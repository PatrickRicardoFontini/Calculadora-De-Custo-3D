import { Router } from "express";
import { prisma } from "../lib/prisma";
import { decimalToNumber } from "../lib/decimal";

export const calculadoraRouter = Router();

function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

// POST /calculadora - calcula o custo de um orçamento a partir de um filamento cadastrado
calculadoraRouter.post("/", async (req, res) => {
  const { filamentoId, pesoUsadoG, horasImpressao, custoEnergiaHora, taxaDepreciacaoHora, margemPercentual } =
    req.body;

  const camposObrigatorios = {
    filamentoId,
    pesoUsadoG,
    horasImpressao,
    custoEnergiaHora,
    taxaDepreciacaoHora,
    margemPercentual,
  };

  const erros: string[] = [];
  for (const [campo, valor] of Object.entries(camposObrigatorios)) {
    if (valor === undefined || valor === null || valor === "") {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    }
  }
  for (const campo of ["pesoUsadoG", "horasImpressao", "custoEnergiaHora", "taxaDepreciacaoHora", "margemPercentual"]) {
    const valor = camposObrigatorios[campo as keyof typeof camposObrigatorios];
    if (valor !== undefined && valor !== null && valor !== "" && Number.isNaN(Number(valor))) {
      erros.push(`Campo numérico inválido: ${campo}`);
    }
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: filamentoId, usuarioId: req.usuarioId },
  });

  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }

  const precoPago = decimalToNumber(filamento.precoPago);
  const pesoTotalG = decimalToNumber(filamento.pesoTotalG);

  const pesoUsado = Number(pesoUsadoG);
  const horas = Number(horasImpressao);
  const energiaHora = Number(custoEnergiaHora);
  const depreciacaoHora = Number(taxaDepreciacaoHora);
  const margem = Number(margemPercentual);

  const precoPorGrama = precoPago / pesoTotalG;
  const custoFilamento = precoPorGrama * pesoUsado;
  const custoEnergia = energiaHora * horas;
  const custoDepreciacao = depreciacaoHora * horas;
  const subtotal = custoFilamento + custoEnergia + custoDepreciacao;
  const valorFinal = subtotal * (1 + margem / 100);

  res.json({
    filamento: {
      id: filamento.id,
      tipo: filamento.tipo,
      cor: filamento.cor,
    },
    entrada: {
      pesoUsadoG: pesoUsado,
      horasImpressao: horas,
      custoEnergiaHora: energiaHora,
      taxaDepreciacaoHora: depreciacaoHora,
      margemPercentual: margem,
    },
    detalhamento: {
      precoPorGrama: arredondar(precoPorGrama, 4),
      custoFilamento: arredondar(custoFilamento),
      custoEnergia: arredondar(custoEnergia),
      custoDepreciacao: arredondar(custoDepreciacao),
      subtotal: arredondar(subtotal),
      margemPercentual: margem,
      valorFinal: arredondar(valorFinal),
    },
  });
});
