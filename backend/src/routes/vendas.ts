import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";
import { clienteExistente, validarClienteInput } from "../lib/clienteOrcamento";
import { calcularEstoqueBaixo, descontarEstoque, estornarEstoque } from "../lib/estoque";
import { decimalToNumber } from "../lib/decimal";

export const vendasRouter = Router();

const DESCRICAO_MAX_LENGTH = 200;

// "YYYY-MM-DD" (input type="date") vem sem horário — construir via componentes numéricos
// (meia-noite local) em vez de `new Date(string)`, que interpreta uma string de data pura
// como meia-noite UTC e faria a data exibida "voltar" um dia pra quem está num fuso atrás
// de UTC (ex.: Brasil). Compartilhado entre criar (POST) e editar (PUT) venda
function parseDataVenda(dataVenda: unknown): Date | null {
  if (typeof dataVenda !== "string") return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataVenda);
  const dataConvertida = partes
    ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    : new Date(dataVenda);
  return Number.isNaN(dataConvertida.getTime()) ? null : dataConvertida;
}

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
      const dataConvertida = parseDataVenda(dataVenda);
      if (!dataConvertida) {
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

// PUT /vendas/:id - edita valorFinal e dataVenda de qualquer venda (não mexe em estoque).
// Descrição e cliente só são aceitos numa venda direta (sem orçamento por trás) — numa
// venda vinda de orçamento aceito, cliente já é gerenciado do lado do orçamento (PUT
// /orcamentos/:id/cliente), não duplica esse controle aqui. `pago` é opcional (omitir
// mantém o valor atual) — é assim que o "marcar como pago" de um toque só na Receita
// reaproveita esse mesmo endpoint sem precisar reenviar valorFinal/dataVenda
vendasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { valorFinal, dataVenda, descricao, clienteId, clienteNome, clienteWhatsapp, pago } = req.body;

    const venda = await prisma.venda.findFirst({ where: { id: req.params.id, usuarioId: req.usuarioId } });
    if (!venda) {
      return res.status(404).json({ erro: "Venda não encontrada" });
    }

    const erros: string[] = [];

    if (
      valorFinal === undefined ||
      valorFinal === null ||
      valorFinal === "" ||
      Number.isNaN(Number(valorFinal)) ||
      Number(valorFinal) <= 0
    ) {
      erros.push("Campo numérico inválido: valorFinal");
    }

    const dataVendaFinal = parseDataVenda(dataVenda);
    if (!dataVendaFinal) {
      erros.push("Campo obrigatório ausente ou inválido: dataVenda");
    }

    if (pago !== undefined && typeof pago !== "boolean") {
      erros.push("Campo inválido: pago");
    }

    const mexeuEmClienteOuDescricao =
      descricao !== undefined || clienteId !== undefined || clienteNome !== undefined || clienteWhatsapp !== undefined;

    if (venda.orcamentoId && mexeuEmClienteOuDescricao) {
      erros.push("Cliente e descrição só podem ser editados em vendas lançadas diretamente, sem orçamento");
    }

    if (!venda.orcamentoId) {
      if (typeof descricao !== "string" || !descricao.trim()) {
        erros.push("Campo obrigatório ausente: descricao");
      } else if (descricao.length > DESCRICAO_MAX_LENGTH) {
        erros.push(`Campo 'descricao' excede o tamanho máximo de ${DESCRICAO_MAX_LENGTH} caracteres`);
      }
      erros.push(...validarClienteInput(clienteId, clienteNome, clienteWhatsapp, { obrigatorio: false }));
    }

    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    if (!venda.orcamentoId && clienteId) {
      const existe = await clienteExistente(prisma, req.usuarioId, clienteId);
      if (!existe) {
        return res.status(404).json({ erro: "Cliente não encontrado" });
      }
    }

    // Só mexe em dataPagamento quando `pago` de fato muda de estado: marcar como pago
    // preenche a data automaticamente (o usuário não informa), desmarcar limpa a data,
    // reenviar `pago: true` numa venda que já estava paga preserva a data original
    let dadosPagamento: { pago?: boolean; dataPagamento?: Date | null } = {};
    if (pago !== undefined && pago !== venda.pago) {
      dadosPagamento = { pago, dataPagamento: pago ? new Date() : null };
    }

    await prisma.$transaction(async (tx) => {
      let clienteIdFinal = venda.clienteId;
      if (!venda.orcamentoId) {
        clienteIdFinal = clienteId
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
      }

      await tx.venda.update({
        where: { id: venda.id },
        data: {
          valorFinal: Number(valorFinal),
          dataVenda: dataVendaFinal!,
          ...(venda.orcamentoId ? {} : { descricao: String(descricao).trim(), clienteId: clienteIdFinal }),
          ...dadosPagamento,
        },
      });
    });

    const vendaCompleta = await prisma.venda.findFirst({
      where: { id: venda.id },
      include: { cliente: true, movimentos: { include: { filamento: true } } },
    });

    res.json(vendaCompleta);
  })
);

// DELETE /vendas/:id - exclui uma venda (direta ou vinda de orçamento aceito). Se ela
// tinha desconto de estoque vinculado, devolve o estoque (ENTRADA de estorno) dentro da
// mesma transação; o orçamento (quando existe) continua ACEITO — a venda é que foi
// desfeita depois, não muda o fato de que o orçamento foi aceito de verdade
vendasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const venda = await prisma.venda.findFirst({
      where: { id: req.params.id, usuarioId: req.usuarioId },
      include: { movimentos: true },
    });
    if (!venda) {
      return res.status(404).json({ erro: "Venda não encontrada" });
    }

    await prisma.$transaction(async (tx) => {
      if (venda.movimentos.length > 0) {
        const observacao = `Estorno da venda excluída em ${new Date().toLocaleDateString("pt-BR")}`;
        await estornarEstoque(
          tx,
          venda.movimentos.map((m) => ({ filamentoId: m.filamentoId, quantidadeG: decimalToNumber(m.quantidadeG) })),
          observacao
        );
      }

      await tx.venda.delete({ where: { id: venda.id } });
    });

    res.status(204).send();
  })
);
