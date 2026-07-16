import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { clienteExistente, validarClienteInput } from "../lib/clienteOrcamento";
import { calcularEstoqueBaixo, descontarEstoque } from "../lib/estoque";

export const vendasRouter = Router();

const DESCRICAO_MAX_LENGTH = 200;

// POST /vendas - lança uma venda direta, sem passar pelo fluxo de calcular/criar
// orçamento (ex.: peça que já estava pronta em estoque, vendida por um valor combinado).
// Desconto de estoque é opcional: só acontece se filamentoId vier junto
vendasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { descricao, valorFinal, dataVenda, clienteId, clienteNome, clienteWhatsapp, filamentoId, pesoUsadoG } =
      req.body;

    const erros: string[] = [];

    if (typeof descricao !== "string" || !descricao.trim()) {
      erros.push("Campo obrigatório ausente: descricao");
    } else if (descricao.length > DESCRICAO_MAX_LENGTH) {
      erros.push(`Campo 'descricao' excede o tamanho máximo de ${DESCRICAO_MAX_LENGTH} caracteres`);
    }

    if (
      valorFinal === undefined ||
      valorFinal === null ||
      valorFinal === "" ||
      Number.isNaN(Number(valorFinal)) ||
      Number(valorFinal) <= 0
    ) {
      erros.push("Campo numérico inválido: valorFinal");
    }

    let dataVendaFinal = new Date();
    if (dataVenda !== undefined && dataVenda !== null && dataVenda !== "") {
      // "YYYY-MM-DD" (input type="date") vem sem horário — construir via componentes
      // numéricos (meia-noite local) em vez de `new Date(string)`, que interpreta uma
      // string de data pura como meia-noite UTC e faria a data exibida "voltar" um dia
      // pra quem está num fuso atrás de UTC (ex.: Brasil)
      const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataVenda);
      const dataConvertida = partes
        ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
        : new Date(dataVenda);
      if (Number.isNaN(dataConvertida.getTime())) {
        erros.push("Campo 'dataVenda' inválido");
      } else {
        dataVendaFinal = dataConvertida;
      }
    }

    erros.push(...validarClienteInput(clienteId, clienteNome, clienteWhatsapp, { obrigatorio: false }));

    if (
      filamentoId &&
      (pesoUsadoG === undefined ||
        pesoUsadoG === null ||
        pesoUsadoG === "" ||
        Number.isNaN(Number(pesoUsadoG)) ||
        Number(pesoUsadoG) <= 0)
    ) {
      erros.push("Campo numérico inválido: pesoUsadoG");
    }

    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    if (filamentoId) {
      const filamento = await prisma.filamento.findFirst({
        where: { id: filamentoId, usuarioId: req.usuarioId },
      });
      if (!filamento) {
        return res.status(404).json({ erro: "Filamento não encontrado" });
      }
    }

    if (clienteId) {
      const existe = await clienteExistente(prisma, req.usuarioId, clienteId);
      if (!existe) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }
    }

    const { vendaId, estoqueBaixo } = await prisma.$transaction(async (tx) => {
      const clienteIdFinal = clienteId
        ? clienteId
        : clienteNome
          ? (
              await tx.cliente.create({
                data: {
                  usuarioId: req.usuarioId,
                  nome: String(clienteNome).trim(),
                  whatsapp: clienteWhatsapp || null,
                },
              })
            ).id
          : null;

      const venda = await tx.venda.create({
        data: {
          usuarioId: req.usuarioId,
          descricao: String(descricao).trim(),
          valorFinal: Number(valorFinal),
          dataVenda: dataVendaFinal,
          clienteId: clienteIdFinal,
        },
      });

      if (!filamentoId) {
        return { vendaId: venda.id, estoqueBaixo: false };
      }

      const filamentosAtualizados = await descontarEstoque(tx, venda.id, [
        { filamentoId, pesoUsadoG: Number(pesoUsadoG) },
      ]);

      return { vendaId: venda.id, estoqueBaixo: calcularEstoqueBaixo(filamentosAtualizados) };
    });

    const vendaCompleta = await prisma.venda.findFirst({
      where: { id: vendaId },
      include: { cliente: true, movimentos: { include: { filamento: true } } },
    });

    res.status(201).json({ ...vendaCompleta, estoqueBaixo });
  })
);
