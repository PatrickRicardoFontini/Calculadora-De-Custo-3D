export interface Filamento {
  id: string;
  tipo: string;
  cor: string;
  precoPago: string;
  pesoTotalG: string;
  pesoAtualG: string;
  estoqueMinimoG: string;
  criadoEm: string;
}

export interface NovoFilamento {
  tipo: string;
  cor: string;
  precoPago: number;
  pesoTotalG: number;
  estoqueMinimoG: number;
}

export interface CalculoInput {
  filamentoId: string;
  pesoUsadoG: number;
  horasImpressao: number;
  custoEnergiaHora: number;
  taxaDepreciacaoHora: number;
  margemPercentual: number;
}

export interface CalculoResultado {
  filamento: {
    id: string;
    tipo: string;
    cor: string;
  };
  entrada: {
    pesoUsadoG: number;
    horasImpressao: number;
    custoEnergiaHora: number;
    taxaDepreciacaoHora: number;
    margemPercentual: number;
  };
  detalhamento: {
    precoPorGrama: number;
    custoFilamento: number;
    custoEnergia: number;
    custoDepreciacao: number;
    subtotal: number;
    margemPercentual: number;
    valorFinal: number;
  };
}
