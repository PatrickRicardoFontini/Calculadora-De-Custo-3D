import { Router } from "express";
import { prisma } from "../lib/prisma";
import { calcularCusto, validarEntradaCalculo } from "../lib/calculo";
import { buscarItensFilamentoExtras, validarCoresAdicionais } from "../lib/coresAdicionais";

export const calculadoraRouter = Router();

// POST /calculadora - calcula o custo de um orçamento a partir de um filamento cadastrado, somando
// eventuais cores adicionais (mesma validação e função de cálculo usadas por POST /orcamentos)
calculadoraRouter.post("/", async (req, res) => {
  const { filamentoId, pesoUsadoG, horasImpressao, custoEnergiaHora, taxaDepreciacaoHora, margemPercentual, coresAdicionais } =
    req.body;

  const erros: string[] = [];
  if (!filamentoId) {
    erros.push("Campo obrigatório ausente: filamentoId");
  }
  erros.push(...validarEntradaCalculo(req.body));

  const { erros: errosCores, validas: coresAdicionaisInput } = validarCoresAdicionais(coresAdicionais);
  erros.push(...errosCores);

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: filamentoId, usuarioId: req.usuarioId },
  });

  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }
  if (filamento.precoPorGrama === null) {
    return res.status(400).json({ erro: "Filamento sem preço por grama definido. Reabasteça ou recadastre o filamento." });
  }

  const resultadoCores = await buscarItensFilamentoExtras(prisma, req.usuarioId, coresAdicionaisInput);
  if (!resultadoCores.ok) {
    return res.status(resultadoCores.status).json({ erro: resultadoCores.erro });
  }

  const entrada = {
    pesoUsadoG: Number(pesoUsadoG),
    horasImpressao: Number(horasImpressao),
    custoEnergiaHora: Number(custoEnergiaHora),
    taxaDepreciacaoHora: Number(taxaDepreciacaoHora),
    margemPercentual: Number(margemPercentual),
  };

  const detalhamento = calcularCusto(filamento, entrada, 0, 0, resultadoCores.itens);

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
