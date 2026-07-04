import { Router } from "express";
import { Prisma } from "@prisma/client";
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

  const { tipo, cor, marca, precoPago, pesoTotalG, estoqueMinimoG } = req.body;
  const precoPagoNum = Number(precoPago);
  const pesoTotalGNum = Number(pesoTotalG);

  const filamento = await prisma.filamento.create({
    data: {
      usuarioId: req.usuarioId,
      tipo,
      cor,
      marca: marca || null,
      precoPago: precoPagoNum,
      pesoTotalG: pesoTotalGNum,
      pesoAtualG: pesoTotalGNum,
      estoqueMinimoG: Number(estoqueMinimoG),
      precoPorGrama: precoPagoNum / pesoTotalGNum,
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

  const { tipo, cor, marca, precoPago, pesoTotalG, pesoAtualG, estoqueMinimoG } = req.body;

  const filamento = await prisma.filamento.update({
    where: { id: existente.id },
    data: {
      ...(tipo !== undefined && { tipo }),
      ...(cor !== undefined && { cor }),
      ...(marca !== undefined && { marca: marca || null }),
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
  const { quantidadeG, precoPago } = req.body;

  const erros: string[] = [];
  if (quantidadeG === undefined || quantidadeG === null || quantidadeG === "" || Number.isNaN(Number(quantidadeG)) || Number(quantidadeG) <= 0) {
    erros.push("Campo 'quantidadeG' inválido");
  }
  if (precoPago === undefined || precoPago === null || precoPago === "" || Number.isNaN(Number(precoPago)) || Number(precoPago) <= 0) {
    erros.push("Campo 'precoPago' inválido");
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  const quantidade = Number(quantidadeG);
  const precoPagoNum = Number(precoPago);
  const precoPorGramaNovo = precoPagoNum / quantidade;

  const filamentoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.movimentoEstoque.create({
      data: {
        filamentoId: filamento.id,
        quantidadeG: quantidade,
        precoPago: precoPagoNum,
        tipo: "ENTRADA",
      },
    });

    return tx.filamento.update({
      where: { id: filamento.id },
      data: {
        pesoAtualG: { increment: quantidade },
        pesoTotalG: { increment: quantidade },
        precoPorGrama: precoPorGramaNovo,
      },
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

  try {
    await prisma.filamento.delete({ where: { id: existente.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return res.status(400).json({
        erro: "Não é possível excluir um filamento que já tem orçamentos ou movimentações de estoque vinculados.",
      });
    }
    throw err;
  }

  res.status(204).send();
});
