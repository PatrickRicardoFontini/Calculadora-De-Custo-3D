import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";

export const filamentosRouter = Router();

const REGEX_COR_HEX = /^#[0-9A-Fa-f]{6}$/;

function validarCamposFilamento(body: any, { parcial }: { parcial: boolean }) {
  const erros: string[] = [];
  const campos = ["tipo", "cor", "precoPorKg", "pesoTotalG", "estoqueMinimoG"];

  for (const campo of campos) {
    if (!parcial && (body[campo] === undefined || body[campo] === null || body[campo] === "")) {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    }
  }

  for (const campoNumerico of ["precoPorKg", "pesoTotalG", "estoqueMinimoG", "pesoAtualG"]) {
    if (body[campoNumerico] !== undefined && body[campoNumerico] !== null && body[campoNumerico] !== "") {
      if (Number.isNaN(Number(body[campoNumerico])) || Number(body[campoNumerico]) < 0) {
        erros.push(`Campo numérico inválido: ${campoNumerico}`);
      }
    }
  }

  if (
    body.corHex !== undefined &&
    body.corHex !== null &&
    body.corHex !== "" &&
    !REGEX_COR_HEX.test(body.corHex)
  ) {
    erros.push("Campo 'corHex' inválido — use o formato #RRGGBB");
  }

  return erros;
}

// GET /filamentos - lista todos os filamentos do usuário
filamentosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const filamentos = await prisma.filamento.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { criadoEm: "desc" },
    });

    res.json(filamentos);
  })
);

// GET /filamentos/:id
filamentosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const filamento = await prisma.filamento.findFirst({
      where: { id: req.params.id, usuarioId: req.usuarioId },
    });

    if (!filamento) {
      return res.status(404).json({ erro: "Filamento não encontrado" });
    }

    res.json(filamento);
  })
);

// POST /filamentos - cadastra um novo filamento
filamentosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const erros = validarCamposFilamento(req.body, { parcial: false });
    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    const { tipo, cor, corHex, marca, precoPorKg, pesoTotalG, estoqueMinimoG } = req.body;
    const precoPorKgNum = Number(precoPorKg);
    const pesoTotalGNum = Number(pesoTotalG);

    const filamento = await prisma.filamento.create({
      data: {
        usuarioId: req.usuarioId,
        tipo: String(tipo).slice(0, 100),
        cor: String(cor).slice(0, 100),
        corHex: corHex || null,
        marca: marca ? String(marca).slice(0, 100) : null,
        pesoTotalG: pesoTotalGNum,
        pesoAtualG: pesoTotalGNum,
        estoqueMinimoG: Number(estoqueMinimoG),
        precoPorGrama: precoPorKgNum / 1000,
      },
    });

    res.status(201).json(filamento);
  })
);

// PUT /filamentos/:id - atualiza um filamento existente
filamentosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
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

    const { tipo, cor, corHex, marca, precoPorKg, pesoTotalG, pesoAtualG, estoqueMinimoG } = req.body;

    const filamento = await prisma.filamento.update({
      where: { id: existente.id },
      data: {
        ...(tipo !== undefined && { tipo: String(tipo).slice(0, 100) }),
        ...(cor !== undefined && { cor: String(cor).slice(0, 100) }),
        ...(corHex !== undefined && { corHex: corHex || null }),
        ...(marca !== undefined && { marca: marca ? String(marca).slice(0, 100) : null }),
        ...(precoPorKg !== undefined && { precoPorGrama: Number(precoPorKg) / 1000 }),
        ...(pesoTotalG !== undefined && { pesoTotalG: Number(pesoTotalG) }),
        ...(pesoAtualG !== undefined && { pesoAtualG: Number(pesoAtualG) }),
        ...(estoqueMinimoG !== undefined && { estoqueMinimoG: Number(estoqueMinimoG) }),
      },
    });

    res.json(filamento);
  })
);

// POST /filamentos/:id/reabastecer - registra entrada de estoque (compra de material novo)
filamentosRouter.post(
  "/:id/reabastecer",
  asyncHandler(async (req, res) => {
    const { quantidadeG, precoPorKg } = req.body;

    const erros: string[] = [];
    if (
      quantidadeG === undefined ||
      quantidadeG === null ||
      quantidadeG === "" ||
      Number.isNaN(Number(quantidadeG)) ||
      Number(quantidadeG) <= 0
    ) {
      erros.push("Campo 'quantidadeG' inválido");
    }
    if (
      precoPorKg === undefined ||
      precoPorKg === null ||
      precoPorKg === "" ||
      Number.isNaN(Number(precoPorKg)) ||
      Number(precoPorKg) <= 0
    ) {
      erros.push("Campo 'precoPorKg' inválido");
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
    const precoPorKgNum = Number(precoPorKg);
    const precoPorGramaNovo = precoPorKgNum / 1000;

    const filamentoAtualizado = await prisma.$transaction(async (tx) => {
      await tx.movimentoEstoque.create({
        data: {
          filamentoId: filamento.id,
          quantidadeG: quantidade,
          precoPorKg: precoPorKgNum,
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
  })
);

// GET /filamentos/:id/movimentos - histórico de entradas e saídas de estoque do filamento
filamentosRouter.get(
  "/:id/movimentos",
  asyncHandler(async (req, res) => {
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
  })
);

// DELETE /filamentos/:id
filamentosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.filamento.findFirst({
      where: { id: req.params.id, usuarioId: req.usuarioId },
    });

    if (!existente) {
      return res.status(404).json({ erro: "Filamento não encontrado" });
    }

    const orcamentosVinculados = await prisma.orcamento.count({
      where: { filamentoId: existente.id },
    });
    if (orcamentosVinculados > 0) {
      return res.status(400).json({
        erro: "Não é possível excluir um filamento que já tem orçamentos vinculados.",
      });
    }

    try {
      await prisma.$transaction([
        // Sem orçamentos vinculados, qualquer movimento existente é só histórico de
        // reabastecimento (entrada), seguro pra remover junto com o filamento
        prisma.movimentoEstoque.deleteMany({ where: { filamentoId: existente.id } }),
        prisma.filamento.delete({ where: { id: existente.id } }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        return res.status(400).json({
          erro: "Não é possível excluir um filamento que já tem orçamentos ou movimentações de estoque vinculados.",
        });
      }
      throw err;
    }

    res.status(204).send();
  })
);
