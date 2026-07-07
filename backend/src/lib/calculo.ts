import type { Filamento, Maquina, Prisma } from "@prisma/client";
import { decimalToNumber } from "./decimal";

export interface EntradaCalculo {
  pesoUsadoG: number;
  horasImpressao: number;
  custoEnergiaHora: number;
  taxaDepreciacaoHora: number;
  margemPercentual: number;
}

export interface DetalhamentoCalculo {
  precoPorGrama: number;
  custoFilamento: number;
  custoEnergia: number;
  custoDepreciacao: number;
  subtotal: number;
  margemPercentual: number;
  valorPrincipal: number;
  custoTotalExtras: number;
  margemExtras: number;
  valorExtrasComMargem: number;
  valorFinal: number;
}

export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

// Soma o custo bruto de uma lista de itens extras (aceita valores já numéricos ou Decimal do Prisma)
export function somarCustoExtras(extras: { valorCusto: Prisma.Decimal | number | string }[]): number {
  return extras.reduce((soma, extra) => soma + decimalToNumber(extra.valorCusto), 0);
}

export interface ItemFilamentoCalculo {
  filamento: Filamento;
  pesoUsadoG: number;
}

// Soma o custo de filamento de uma ou mais cores/materiais usados no mesmo orçamento
export function calcularCustoFilamentoTotal(itens: ItemFilamentoCalculo[]): number {
  return itens.reduce((soma, item) => {
    if (item.filamento.precoPorGrama === null) {
      throw new Error("Filamento sem precoPorGrama definido");
    }
    return soma + decimalToNumber(item.filamento.precoPorGrama) * item.pesoUsadoG;
  }, 0);
}

// Margem dos extras é separada da margem principal: um item revendido não carrega o
// mesmo markup do filamento/máquina
export function calcularValorExtrasComMargem(custoTotalExtras: number, margemExtras: number): number {
  return arredondar(custoTotalExtras * (1 + margemExtras / 100));
}

export function calcularCusto(
  filamento: Filamento,
  entrada: EntradaCalculo,
  custoTotalExtras = 0,
  margemExtras = 0,
  itensFilamentoExtras: ItemFilamentoCalculo[] = []
): DetalhamentoCalculo {
  if (filamento.precoPorGrama === null) {
    throw new Error("Filamento sem precoPorGrama definido");
  }

  const precoPorGrama = decimalToNumber(filamento.precoPorGrama);
  const custoFilamento = calcularCustoFilamentoTotal([
    { filamento, pesoUsadoG: entrada.pesoUsadoG },
    ...itensFilamentoExtras,
  ]);
  const custoEnergia = entrada.custoEnergiaHora * entrada.horasImpressao;
  const custoDepreciacao = entrada.taxaDepreciacaoHora * entrada.horasImpressao;
  const subtotal = custoFilamento + custoEnergia + custoDepreciacao;
  const valorPrincipal = subtotal * (1 + entrada.margemPercentual / 100);
  const valorExtrasComMargem = calcularValorExtrasComMargem(custoTotalExtras, margemExtras);
  const valorFinal = valorPrincipal + valorExtrasComMargem;

  return {
    precoPorGrama: arredondar(precoPorGrama, 4),
    custoFilamento: arredondar(custoFilamento),
    custoEnergia: arredondar(custoEnergia),
    custoDepreciacao: arredondar(custoDepreciacao),
    subtotal: arredondar(subtotal),
    margemPercentual: entrada.margemPercentual,
    valorPrincipal: arredondar(valorPrincipal),
    custoTotalExtras: arredondar(custoTotalExtras),
    margemExtras,
    valorExtrasComMargem,
    valorFinal: arredondar(valorFinal),
  };
}

// Calcula sempre na hora a partir dos dados brutos da máquina e do preço do kWh do
// usuário, nunca guarda o resultado, pra refletir mudanças de preço imediatamente
export function calcularCustoEnergiaHora(maquina: Maquina, precoKwh: number): number {
  const potenciaKw = decimalToNumber(maquina.potenciaWatts) / 1000;
  return arredondar(potenciaKw * precoKwh, 4);
}

export function calcularTaxaDepreciacaoHora(maquina: Maquina): number {
  const precoCompra = decimalToNumber(maquina.precoCompra);
  const vidaUtilHoras = decimalToNumber(maquina.vidaUtilHoras);
  return arredondar(precoCompra / vidaUtilHoras, 4);
}

export function validarEntradaCalculo(body: Record<string, unknown>): string[] {
  const erros: string[] = [];
  const campos = ["pesoUsadoG", "horasImpressao", "custoEnergiaHora", "taxaDepreciacaoHora", "margemPercentual"];

  for (const campo of campos) {
    const valor = body[campo];
    if (valor === undefined || valor === null || valor === "") {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    } else if (Number.isNaN(Number(valor))) {
      erros.push(`Campo numérico inválido: ${campo}`);
    }
  }

  return erros;
}
