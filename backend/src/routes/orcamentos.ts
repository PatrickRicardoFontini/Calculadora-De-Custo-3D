import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calcularCusto, validarEntradaCalculo } from "../lib/calculo";
import type { StatusOrcamento } from "@prisma/client";

export const orcamentosRouter = Router();

const STATUS_VALIDOS: StatusOrcamento[] = ["PENDENTE", "ACEITO", "RECUSADO"];

const INCLUDE_PADRAO = {
  cliente: true,
  filamento: true,
} as const;

// GET /orcamentos - lista orçamentos do usuário, com filtro opcional por status
orcamentosRouter.get("/", async (req, res) => {
  const { status } = req.query;

  if (status !== undefined && !STATUS_VALIDOS.includes(status as StatusOrcamento)) {
    return res.status(400).json({ erro: `status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}` });
  }

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      usuarioId: req.usuarioId,
      ...(status !== undefined && { status: status as StatusOrcamento }),
    },
    include: INCLUDE_PADRAO,
    orderBy: { criadoEm: "desc" },
  });

  res.json(orcamentos);
});

// GET /orcamentos/:id - detalhe do orçamento, incluindo histórico de valores
orcamentosRouter.get("/:id", async (req, res) => {
  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
    include: {
      ...INCLUDE_PADRAO,
      historico: { orderBy: { registradoEm: "asc" } },
    },
  });

  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }

  res.json(orcamento);
});

// POST /orcamentos - cria orçamento vinculado a um cliente (existente ou novo) e a um filamento
orcamentosRouter.post("/", async (req, res) => {
  const { clienteId, clienteNome, clienteWhatsapp, filamentoId, pesoUsadoG, horasImpressao, custoEnergiaHora, taxaDepreciacaoHora, margemPercentual } =
    req.body;

  const erros: string[] = [];
  if (!filamentoId) {
    erros.push("Campo obrigatório ausente: filamentoId");
  }
  if (!clienteId && !clienteNome) {
    erros.push("Informe clienteId de um cliente existente ou clienteNome para criar um novo");
  }
  erros.push(...validarEntradaCalculo(req.body));
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: filamentoId, usuarioId: req.usuarioId },
  });
  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  if (clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, usuarioId: req.usuarioId },
    });
    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }
  }

  const entrada = {
    pesoUsadoG: Number(pesoUsadoG),
    horasImpressao: Number(horasImpressao),
    custoEnergiaHora: Number(custoEnergiaHora),
    taxaDepreciacaoHora: Number(taxaDepreciacaoHora),
    margemPercentual: Number(margemPercentual),
  };

  const { valorFinal } = calcularCusto(filamento, entrada);

  const orcamento = await prisma.$transaction(async (tx) => {
    const clienteIdFinal = clienteId
      ? clienteId
      : (
          await tx.cliente.create({
            data: {
              usuarioId: req.usuarioId,
              nome: clienteNome,
              whatsapp: clienteWhatsapp || null,
            },
          })
        ).id;

    const novoOrcamento = await tx.orcamento.create({
      data: {
        usuarioId: req.usuarioId,
        clienteId: clienteIdFinal,
        filamentoId: filamento.id,
        pesoUsadoG: entrada.pesoUsadoG,
        horasImpressao: entrada.horasImpressao,
        valorCalculado: valorFinal,
        valorAtual: valorFinal,
      },
    });

    await tx.orcamentoHistorico.create({
      data: {
        orcamentoId: novoOrcamento.id,
        valor: valorFinal,
      },
    });

    return novoOrcamento;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamento.id },
    include: INCLUDE_PADRAO,
  });

  res.status(201).json(orcamentoCompleto);
});

// PUT /orcamentos/:id/valor - negocia o valor do orçamento enquanto PENDENTE
orcamentosRouter.put("/:id/valor", async (req, res) => {
  const { valor } = req.body;

  if (valor === undefined || valor === null || valor === "" || Number.isNaN(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: "Campo 'valor' inválido" });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível editar o valor de orçamentos pendentes" });
  }

  const valorNumerico = Number(valor);

  const orcamentoAtualizado = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { valorAtual: valorNumerico },
    });

    await tx.orcamentoHistorico.create({
      data: { orcamentoId: orcamento.id, valor: valorNumerico },
    });

    return atualizado;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamentoAtualizado.id },
    include: {
      ...INCLUDE_PADRAO,
      historico: { orderBy: { registradoEm: "asc" } },
    },
  });

  res.json(orcamentoCompleto);
});

// PUT /orcamentos/:id/status - marca orçamento como ACEITO ou RECUSADO
orcamentosRouter.put("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (status !== "ACEITO" && status !== "RECUSADO") {
    return res.status(400).json({ erro: "status deve ser ACEITO ou RECUSADO" });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível alterar o status de orçamentos pendentes" });
  }

  const orcamentoAtualizado = await prisma.orcamento.update({
    where: { id: orcamento.id },
    data: { status },
    include: INCLUDE_PADRAO,
  });

  res.json(orcamentoAtualizado);
});
