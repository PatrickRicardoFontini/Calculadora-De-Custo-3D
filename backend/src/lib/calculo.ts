import type { Filamento, Maquina } from "@prisma/client";
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
  valorFinal: number;
}

export function arredondar(valor: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

export function calcularCusto(filamento: Filamento, entrada: EntradaCalculo): DetalhamentoCalculo {
  if (filamento.precoPorGrama === null) {
    throw new Error("Filamento sem precoPorGrama definido");
  }

  const precoPorGrama = decimalToNumber(filamento.precoPorGrama);
  const custoFilamento = precoPorGrama * entrada.pesoUsadoG;
  const custoEnergia = entrada.custoEnergiaHora * entrada.horasImpressao;
  const custoDepreciacao = entrada.taxaDepreciacaoHora * entrada.horasImpressao;
  const subtotal = custoFilamento + custoEnergia + custoDepreciacao;
  const valorFinal = subtotal * (1 + entrada.margemPercentual / 100);

  return {
    precoPorGrama: arredondar(precoPorGrama, 4),
    custoFilamento: arredondar(custoFilamento),
    custoEnergia: arredondar(custoEnergia),
    custoDepreciacao: arredondar(custoDepreciacao),
    subtotal: arredondar(subtotal),
    margemPercentual: entrada.margemPercentual,
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
