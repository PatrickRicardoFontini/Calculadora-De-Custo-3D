import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";

export const clientesRouter = Router();

const NOME_MAX_LENGTH = 150;
const WHATSAPP_MAX_LENGTH = 30;

// GET /clientes - lista clientes do usuário
clientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const clientes = await prisma.cliente.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { criadoEm: "desc" },
    });

    res.json(clientes);
  })
);

// POST /clientes - cadastra um novo cliente
clientesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { nome, whatsapp } = req.body;

    const erros: string[] = [];
    if (!nome || typeof nome !== "string" || !nome.trim()) {
      erros.push("Campo obrigatório ausente: nome");
    } else if (nome.length > NOME_MAX_LENGTH) {
      erros.push(`Campo 'nome' excede o tamanho máximo de ${NOME_MAX_LENGTH} caracteres`);
    }
    if (whatsapp !== undefined && whatsapp !== null && String(whatsapp).length > WHATSAPP_MAX_LENGTH) {
      erros.push(`Campo 'whatsapp' excede o tamanho máximo de ${WHATSAPP_MAX_LENGTH} caracteres`);
    }
    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    const cliente = await prisma.cliente.create({
      data: {
        usuarioId: req.usuarioId,
        nome: nome.trim(),
        whatsapp: whatsapp || null,
      },
    });

    res.status(201).json(cliente);
  })
);
