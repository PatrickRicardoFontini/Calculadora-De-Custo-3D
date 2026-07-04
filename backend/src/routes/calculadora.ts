import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calcularCusto, validarEntradaCalculo } from "../lib/calculo";

export const calculadoraRouter = Router();

// POST /calculadora - calcula o custo de um orçamento a partir de um filamento cadastrado
calculadoraRouter.post("/", async (req, res) => {
  const { filamentoId, pesoUsadoG, horasImpressao, custoEnergiaHora, taxaDepreciacaoHora, margemPercentual } =
    req.body;

  const erros: string[] = [];
  if (!filamentoId) {
    erros.push("Campo obrigatório ausente: filamentoId");
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

  const entrada = {
    pesoUsadoG: Number(pesoUsadoG),
    horasImpressao: Number(horasImpressao),
    custoEnergiaHora: Number(custoEnergiaHora),
    taxaDepreciacaoHora: Number(taxaDepreciacaoHora),
    margemPercentual: Number(margemPercentual),
  };

  const detalhamento = calcularCusto(filamento, entrada);

  res.json({
    filamento: {
      id: filamento.id,
      tipo: filamento.tipo,
      cor: filamento.cor,
    },
    entrada,
    detalhamento,
  });
});
