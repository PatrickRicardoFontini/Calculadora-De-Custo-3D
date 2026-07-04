import { Router } from "express";
import { prisma } from "../lib/prisma";

export const filamentosRouter = Router();

function validarCamposFilamento(body: any, { parcial }: { parcial: boolean }) {
  const erros: string[] = [];
  const campos = ["tipo", "cor", "precoPago", "pesoTotalG", "estoqueMinimoG"];

  for (const campo of campos) {
    if (!parcial && (body[campo] === undefined || body[campo] === null || body[campo] === "")) {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    }
  }

  for (const campoNumerico of ["precoPago", "pesoTotalG", "estoqueMinimoG", "pesoAtualG"]) {
    if (body[campoNumerico] !== undefined && Number.isNaN(Number(body[campoNumerico]))) {
      erros.push(`Campo numérico inválido: ${campoNumerico}`);
    }
  }

  return erros;
}

// GET /filamentos - lista todos os filamentos do usuário
filamentosRouter.get("/", async (req, res) => {
  const filamentos = await prisma.filamento.findMany({
    where: { usuarioId: req.usuarioId },
    orderBy: { criadoEm: "desc" },
  });

  res.json(filamentos);
});

// GET /filamentos/:id
filamentosRouter.get("/:id", async (req, res) => {
  const filamento = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });

  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  res.json(filamento);
});

// POST /filamentos - cadastra um novo filamento
filamentosRouter.post("/", async (req, res) => {
  const erros = validarCamposFilamento(req.body, { parcial: false });
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const { tipo, cor, precoPago, pesoTotalG, estoqueMinimoG } = req.body;

  const filamento = await prisma.filamento.create({
    data: {
      usuarioId: req.usuarioId,
      tipo,
      cor,
      precoPago: Number(precoPago),
      pesoTotalG: Number(pesoTotalG),
      pesoAtualG: Number(pesoTotalG),
      estoqueMinimoG: Number(estoqueMinimoG),
    },
  });

  res.status(201).json(filamento);
});

// PUT /filamentos/:id - atualiza um filamento existente
filamentosRouter.put("/:id", async (req, res) => {
  const existente = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });

  if (!existente) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  const erros = validarCamposFilamento(req.body, { parcial: true });
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const { tipo, cor, precoPago, pesoTotalG, pesoAtualG, estoqueMinimoG } = req.body;

  const filamento = await prisma.filamento.update({
    where: { id: existente.id },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(cor !== undefined && { cor }),
      ...(precoPago !== undefined && { precoPago: Number(precoPago) }),
      ...(pesoTotalG !== undefined && { pesoTotalG: Number(pesoTotalG) }),
      ...(pesoAtualG !== undefined && { pesoAtualG: Number(pesoAtualG) }),
      ...(estoqueMinimoG !== undefined && { estoqueMinimoG: Number(estoqueMinimoG) }),
    },
  });

  res.json(filamento);
});

// POST /filamentos/:id/reabastecer - registra entrada de estoque (compra de material novo)
filamentosRouter.post("/:id/reabastecer", async (req, res) => {
  const { quantidadeG } = req.body;

  if (quantidadeG === undefined || quantidadeG === null || quantidadeG === "" || Number.isNaN(Number(quantidadeG)) || Number(quantidadeG) <= 0) {
    return res.status(400).json({ erro: "Campo 'quantidadeG' inválido" });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  const quantidade = Number(quantidadeG);

  const filamentoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.movimentoEstoque.create({
      data: {
        filamentoId: filamento.id,
        quantidadeG: quantidade,
        tipo: "ENTRADA",
      },
    });

    return tx.filamento.update({
      where: { id: filamento.id },
      data: { pesoAtualG: { increment: quantidade } },
    });
  });

  res.json(filamentoAtualizado);
});

// GET /filamentos/:id/movimentos - histórico de entradas e saídas de estoque do filamento
filamentosRouter.get("/:id/movimentos", async (req, res) => {
  const filamento = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  const movimentos = await prisma.movimentoEstoque.findMany({
    where: { filamentoId: filamento.id },
    orderBy: { data: "desc" },
  });

  res.json(movimentos);
});

// DELETE /filamentos/:id
filamentosRouter.delete("/:id", async (req, res) => {
  const existente = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });

  if (!existente) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  await prisma.filamento.delete({ where: { id: existente.id } });

  res.status(204).send();
});
