import { Router } from "express";
import { prisma } from "../lib/prisma";
import { decimalToNumber } from "../lib/decimal";
import { arredondar } from "../lib/calculo";
import { asyncHandler } from "../lib/asyncHandler";

export const receitaRouter = Router();

function chaveMes(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

// GET /receita/mensal - agrega as vendas dos últimos 12 meses por mês
receitaRouter.get(
  "/mensal",
  asyncHandler(async (req, res) => {
  const desde = new Date();
  desde.setUTCMonth(desde.getUTCMonth() - 11);
  desde.setUTCDate(1);
  desde.setUTCHours(0, 0, 0, 0);

  const vendas = await prisma.venda.findMany({
    where: { usuarioId: req.usuarioId, dataVenda: { gte: desde } },
    select: { valorFinal: true, dataVenda: true },
  });

  const porMes = new Map<string, { total: number; quantidade: number }>();

  for (const venda of vendas) {
    const mes = chaveMes(venda.dataVenda);
    const atual = porMes.get(mes) ?? { total: 0, quantidade: 0 };
    atual.total += decimalToNumber(venda.valorFinal);
    atual.quantidade += 1;
    porMes.set(mes, atual);
  }

  const resultado = Array.from(porMes.entries())
    .map(([mes, dados]) => ({
      mes,
      totalVendas: arredondar(dados.total),
      quantidadeVendas: dados.quantidade,
    }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1));

  res.json(resultado);
  })
);

// GET /receita/vendas?mes=2026-07 - lista as vendas de um mês específico com dados do pedido
receitaRouter.get(
  "/vendas",
  asyncHandler(async (req, res) => {
  const { mes } = req.query;

  if (typeof mes !== "string" || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ erro: "Parâmetro 'mes' inválido. Use o formato YYYY-MM" });
  }

  const [ano, mesNum] = mes.split("-").map(Number);
  if (mesNum < 1 || mesNum > 12) {
    return res.status(400).json({ erro: "Parâmetro 'mes' inválido. Use o formato YYYY-MM" });
  }

  const inicio = new Date(Date.UTC(ano, mesNum - 1, 1));
  const fim = new Date(Date.UTC(ano, mesNum, 1));

  const vendas = await prisma.venda.findMany({
    where: {
      usuarioId: req.usuarioId,
      dataVenda: { gte: inicio, lt: fim },
    },
    include: {
      orcamento: {
        include: { cliente: true, filamento: true },
      },
    },
    orderBy: { dataVenda: "desc" },
  });

  const resultado = vendas.map((venda) => ({
    id: venda.id,
    dataVenda: venda.dataVenda,
    clienteNome: venda.orcamento.cliente.nome,
    filamentoTipo: venda.orcamento.filamento.tipo,
    filamentoCor: venda.orcamento.filamento.cor,
    filamentoMarca: venda.orcamento.filamento.marca,
    pesoUsadoG: decimalToNumber(venda.orcamento.pesoUsadoG),
    horasImpressao: decimalToNumber(venda.orcamento.horasImpressao),
    valorFinal: decimalToNumber(venda.valorFinal),
    valorCalculado: decimalToNumber(venda.orcamento.valorCalculado),
  }));

  res.json(resultado);
  })
);
