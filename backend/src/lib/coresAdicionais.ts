import type { PrismaClient } from "@prisma/client";
import type { ItemFilamentoCalculo } from "./calculo";

export interface CorAdicionalInput {
  filamentoId: string;
  pesoUsadoG: number;
}

// Valida o formato bruto do campo coresAdicionais vindo do corpo da requisição,
// usado tanto por /calculadora (prévia) quanto por POST /orcamentos (criação)
export function validarCoresAdicionais(coresAdicionais: unknown): { erros: string[]; validas: CorAdicionalInput[] } {
  const erros: string[] = [];
  const validas: CorAdicionalInput[] = [];

  if (coresAdicionais === undefined) {
    return { erros, validas };
  }
  if (!Array.isArray(coresAdicionais)) {
    erros.push("Campo 'coresAdicionais' deve ser uma lista");
    return { erros, validas };
  }

  coresAdicionais.forEach((item, indice) => {
    const filamentoIdItem = item?.filamentoId;
    const pesoUsadoGItem = item?.pesoUsadoG;
    if (typeof filamentoIdItem !== "string" || !filamentoIdItem.trim()) {
      erros.push(`coresAdicionais[${indice}].filamentoId é obrigatório`);
    }
    if (
      pesoUsadoGItem === undefined ||
      pesoUsadoGItem === null ||
      pesoUsadoGItem === "" ||
      Number.isNaN(Number(pesoUsadoGItem)) ||
      Number(pesoUsadoGItem) <= 0
    ) {
      erros.push(`coresAdicionais[${indice}].pesoUsadoG inválido`);
    } else if (typeof filamentoIdItem === "string" && filamentoIdItem.trim()) {
      validas.push({ filamentoId: filamentoIdItem, pesoUsadoG: Number(pesoUsadoGItem) });
    }
  });

  return { erros, validas };
}

export type ResultadoBuscaCoresAdicionais =
  | { ok: true; itens: ItemFilamentoCalculo[] }
  | { ok: false; status: number; erro: string };

// Busca cada filamento das cores adicionais já validadas, conferindo posse (usuarioId) e
// preço por grama definido — mesma checagem já feita pro filamento principal em cada rota
export async function buscarItensFilamentoExtras(
  prisma: PrismaClient,
  usuarioId: string,
  coresValidas: CorAdicionalInput[]
): Promise<ResultadoBuscaCoresAdicionais> {
  const itens: ItemFilamentoCalculo[] = [];

  for (const item of coresValidas) {
    const filamento = await prisma.filamento.findFirst({
      where: { id: item.filamentoId, usuarioId },
    });
    if (!filamento) {
      return { ok: false, status: 404, erro: "Filamento não encontrado para uma das cores adicionais" };
    }
    if (filamento.precoPorGrama === null) {
      return {
        ok: false,
        status: 400,
        erro: `Filamento ${filamento.tipo} ${filamento.cor} sem preço por grama definido. Reabasteça ou recadastre o filamento.`,
      };
    }
    itens.push({ filamento, pesoUsadoG: item.pesoUsadoG });
  }

  return { ok: true, itens };
}
