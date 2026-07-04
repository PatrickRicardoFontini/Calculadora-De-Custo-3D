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

export interface Cliente {
  id: string;
  nome: string;
  whatsapp: string | null;
  criadoEm: string;
}

export interface NovoCliente {
  nome: string;
  whatsapp?: string;
}

export type StatusOrcamento = "PENDENTE" | "ACEITO" | "RECUSADO";

export interface OrcamentoHistoricoItem {
  id: string;
  valor: string;
  registradoEm: string;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  filamentoId: string;
  pesoUsadoG: string;
  horasImpressao: string;
  valorCalculado: string;
  valorAtual: string;
  status: StatusOrcamento;
  criadoEm: string;
  cliente: Cliente;
  filamento: Filamento;
  historico?: OrcamentoHistoricoItem[];
}

export interface NovoOrcamento {
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
  filamentoId: string;
  pesoUsadoG: number;
  horasImpressao: number;
  custoEnergiaHora: number;
  taxaDepreciacaoHora: number;
  margemPercentual: number;
}

export interface OrcamentoComEstoque extends Orcamento {
  estoqueBaixo: boolean;
}

export type TipoMovimento = "ENTRADA" | "SAIDA";

export interface MovimentoEstoque {
  id: string;
  filamentoId: string;
  vendaId: string | null;
  quantidadeG: string;
  tipo: TipoMovimento;
  data: string;
}

export interface ReceitaMensal {
  mes: string;
  totalVendas: number;
  quantidadeVendas: number;
}

export interface VendaDoMes {
  id: string;
  dataVenda: string;
  clienteNome: string;
  filamentoTipo: string;
  filamentoCor: string;
  pesoUsadoG: number;
  horasImpressao: number;
  valorFinal: number;
  valorCalculado: number;
}
