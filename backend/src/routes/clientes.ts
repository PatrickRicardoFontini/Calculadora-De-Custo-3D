import { Router } from "express";
import { prisma } from "../lib/prisma";

export const clientesRouter = Router();

// GET /clientes - lista clientes do usuário
clientesRouter.get("/", async (req, res) => {
  const clientes = await prisma.cliente.findMany({
    where: { usuarioId: req.usuarioId },
    orderBy: { criadoEm: "desc" },
  });

  res.json(clientes);
});

// POST /clientes - cadastra um novo cliente
clientesRouter.post("/", async (req, res) => {
  const { nome, whatsapp } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: ["Campo obrigatório ausente: nome"] });
  }

  const cliente = await prisma.cliente.create({
    data: {
      usuarioId: req.usuarioId,
      nome,
      whatsapp: whatsapp || null,
    },
  });

  res.status(201).json(cliente);
});
