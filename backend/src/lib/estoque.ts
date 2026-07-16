import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "./decimal";

export interface ItemBaixaEstoque {
  filamentoId: string;
  pesoUsadoG: number;
}

// Desconta estoque de um ou mais filamentos vinculados a uma venda (saída), dentro de uma
// transação já aberta pelo chamador — usado tanto no aceite de orçamento (PUT
// /orcamentos/:id/status) quanto no lançamento de venda direta (POST /vendas), pra não
// duplicar a lógica de baixa
export async function descontarEstoque(tx: Prisma.TransactionClient, vendaId: string, itens: ItemBaixaEstoque[]) {
  const resultados = [];
  for (const item of itens) {
    await tx.movimentoEstoque.create({
      data: {
        filamentoId: item.filamentoId,
        vendaId,
        quantidadeG: item.pesoUsadoG,
        tipo: "SAIDA",
      },
    });

    resultados.push(
      await tx.filamento.update({
        where: { id: item.filamentoId },
        data: { pesoAtualG: { decrement: item.pesoUsadoG } },
      })
    );
  }
  return resultados;
}

export function calcularEstoqueBaixo(filamentosAtualizados: { pesoAtualG: Prisma.Decimal; estoqueMinimoG: Prisma.Decimal }[]) {
  return filamentosAtualizados.some(
    (filamento) => decimalToNumber(filamento.pesoAtualG) < decimalToNumber(filamento.estoqueMinimoG)
  );
}
