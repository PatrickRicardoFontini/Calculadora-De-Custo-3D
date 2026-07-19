import { Router } from "express";
import { prisma } from "../lib/prisma";
import { decimalToNumber } from "../lib/decimal";
import { arredondar } from "../lib/calculo";
import { asyncHandler } from "../lib/asyncHandler";

export const receitaRouter = Router();

function chaveMes(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

// GET /receita/mensal - agrega as vendas dos últimos 12 meses por mês, separando o que já
// entrou de caixa (totalRecebido, só vendas pagas) do que ainda está pendente
// (totalAReceber, só vendas não pagas) — totalVendido continua sendo a soma de tudo
receitaRouter.get(
  "/mensal",
  asyncHandler(async (req, res) => {
  const desde = new Date();
  desde.setUTCMonth(desde.getUTCMonth() - 11);
  desde.setUTCDate(1);
  desde.setUTCHours(0, 0, 0, 0);

  const vendas = await prisma.venda.findMany({
    where: { usuarioId: req.usuarioId, dataVenda: { gte: desde } },
    select: { valorFinal: true, dataVenda: true, pago: true },
  });

  const porMes = new Map<string, { totalVendido: number; totalRecebido: number; totalAReceber: number; quantidade: number }>();

  for (const venda of vendas) {
    const mes = chaveMes(venda.dataVenda);
    const atual = porMes.get(mes) ?? { totalVendido: 0, totalRecebido: 0, totalAReceber: 0, quantidade: 0 };
    const valor = decimalToNumber(venda.valorFinal);
    atual.totalVendido += valor;
    if (venda.pago) {
      atual.totalRecebido += valor;
    } else {
      atual.totalAReceber += valor;
    }
    atual.quantidade += 1;
    porMes.set(mes, atual);
  }

  const resultado = Array.from(porMes.entries())
    .map(([mes, dados]) => ({
      mes,
      totalVendido: arredondar(dados.totalVendido),
      totalRecebido: arredondar(dados.totalRecebido),
      totalAReceber: arredondar(dados.totalAReceber),
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
      cliente: true,
      movimentos: { include: { filamento: true } },
    },
    orderBy: { dataVenda: "desc" },
  });

  // Venda lançada direto (sem orçamento por trás) não tem material/cliente vindo de um
  // Orcamento — usa o filamento do próprio MovimentoEstoque (no máximo um, já que venda
  // direta não suporta multi-cor) e o cliente/descrição gravados na própria Venda
  const resultado = vendas.map((venda) => {
    if (venda.orcamento) {
      return {
        id: venda.id,
        orcamentoId: venda.orcamentoId,
        clienteId: venda.clienteId,
        dataVenda: venda.dataVenda,
        pago: venda.pago,
        clienteNome: venda.orcamento.cliente.nome,
        descricao: null,
        filamentoTipo: venda.orcamento.filamento.tipo,
        filamentoCor: venda.orcamento.filamento.cor,
        filamentoMarca: venda.orcamento.filamento.marca,
        pesoUsadoG: decimalToNumber(venda.orcamento.pesoUsadoG),
        horasImpressao: decimalToNumber(venda.orcamento.horasImpressao),
        valorFinal: decimalToNumber(venda.valorFinal),
        valorCalculado: decimalToNumber(venda.orcamento.valorCalculado),
      };
    }

    const movimento = venda.movimentos[0];
    return {
      id: venda.id,
      orcamentoId: venda.orcamentoId,
      clienteId: venda.clienteId,
      dataVenda: venda.dataVenda,
      pago: venda.pago,
      clienteNome: venda.cliente?.nome ?? null,
      descricao: venda.descricao,
      filamentoTipo: movimento?.filamento.tipo ?? null,
      filamentoCor: movimento?.filamento.cor ?? null,
      filamentoMarca: movimento?.filamento.marca ?? null,
      pesoUsadoG: movimento ? decimalToNumber(movimento.quantidadeG) : null,
      horasImpressao: null,
      valorFinal: decimalToNumber(venda.valorFinal),
      valorCalculado: null,
    };
  });

  res.json(resultado);
  })
);
