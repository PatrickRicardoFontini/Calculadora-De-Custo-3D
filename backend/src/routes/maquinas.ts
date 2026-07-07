import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";

export const maquinasRouter = Router();

const NOME_MAX_LENGTH = 150;

function validarCamposMaquina(body: any, { parcial }: { parcial: boolean }) {
  const erros: string[] = [];
  const campos = ["nome", "potenciaWatts", "precoCompra", "vidaUtilHoras"];

  for (const campo of campos) {
    if (!parcial && (body[campo] === undefined || body[campo] === null || body[campo] === "")) {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    }
  }

  if (body.nome !== undefined && body.nome !== null && String(body.nome).length > NOME_MAX_LENGTH) {
    erros.push(`Campo 'nome' excede o tamanho máximo de ${NOME_MAX_LENGTH} caracteres`);
  }

  for (const campoNumerico of ["potenciaWatts", "precoCompra", "vidaUtilHoras"]) {
    if (body[campoNumerico] !== undefined && body[campoNumerico] !== null && body[campoNumerico] !== "") {
      if (Number.isNaN(Number(body[campoNumerico])) || Number(body[campoNumerico]) <= 0) {
        erros.push(`Campo numérico inválido: ${campoNumerico}`);
      }
    }
  }

  return erros;
}

// GET /maquinas - lista máquinas do usuário
maquinasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const maquinas = await prisma.maquina.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: { criadoEm: "desc" },
    });

    res.json(maquinas);
  })
);

// POST /maquinas - cadastra uma nova máquina
maquinasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const erros = validarCamposMaquina(req.body, { parcial: false });
    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    const { nome, potenciaWatts, precoCompra, vidaUtilHoras } = req.body;

    const maquina = await prisma.maquina.create({
      data: {
        usuarioId: req.usuarioId,
        nome: String(nome).slice(0, NOME_MAX_LENGTH),
        potenciaWatts: Number(potenciaWatts),
        precoCompra: Number(precoCompra),
        vidaUtilHoras: Number(vidaUtilHoras),
      },
    });

    res.status(201).json(maquina);
  })
);

// PUT /maquinas/:id - atualiza uma máquina existente
maquinasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.maquina.findFirst({
      where: { id: req.params.id, usuarioId: req.usuarioId },
    });

    if (!existente) {
      return res.status(404).json({ erro: "Máquina não encontrada" });
    }

    const erros = validarCamposMaquina(req.body, { parcial: true });
    if (erros.length > 0) {
      return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
    }

    const { nome, potenciaWatts, precoCompra, vidaUtilHoras } = req.body;

    const maquina = await prisma.maquina.update({
      where: { id: existente.id },
      data: {
        ...(nome !== undefined && { nome: String(nome).slice(0, NOME_MAX_LENGTH) }),
        ...(potenciaWatts !== undefined && { potenciaWatts: Number(potenciaWatts) }),
        ...(precoCompra !== undefined && { precoCompra: Number(precoCompra) }),
        ...(vidaUtilHoras !== undefined && { vidaUtilHoras: Number(vidaUtilHoras) }),
      },
    });

    res.json(maquina);
  })
);

// DELETE /maquinas/:id - orçamentos que usaram essa máquina mantêm o histórico,
// só perdem a referência (maquinaId vira null via onDelete: SetNull no schema)
maquinasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.maquina.findFirst({
      where: { id: req.params.id, usuarioId: req.usuarioId },
    });

    if (!existente) {
      return res.status(404).json({ erro: "Máquina não encontrada" });
    }

    await prisma.maquina.delete({ where: { id: existente.id } });

    res.status(204).send();
  })
);
