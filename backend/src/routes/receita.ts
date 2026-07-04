import { Router } from "express";
import { prisma } from "../lib/prisma";
import { decimalToNumber } from "../lib/decimal";
import { arredondar } from "../lib/calculo";

export const receitaRouter = Router();

function chaveMes(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
}

// GET /receita/mensal - agrega as vendas dos últimos 12 meses por mês
receitaRouter.get("/mensal", async (req, res) => {
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
});
