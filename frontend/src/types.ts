export interface Usuario {
  id: string;
  nome: string;
  email: string;
  precoKwh: string | null;
  margemPadrao: string | null;
  margemExtrasPadrao: string | null;
}

export interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

export interface Filamento {
  id: string;
  tipo: string;
  cor: string;
  marca: string | null;
  pesoTotalG: string;
  pesoAtualG: string;
  estoqueMinimoG: string;
  precoPorGrama: string | null;
  criadoEm: string;
}

export interface NovoFilamento {
  tipo: string;
  cor: string;
  marca?: string;
  precoPorKg: number;
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

export interface Maquina {
  id: string;
  nome: string;
  potenciaWatts: string;
  precoCompra: string;
  vidaUtilHoras: string;
  criadoEm: string;
}

export interface NovaMaquina {
  nome: string;
  potenciaWatts: number;
  precoCompra: number;
  vidaUtilHoras: number;
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
    valorPrincipal: number;
    custoTotalExtras: number;
    margemExtras: number;
    valorExtrasComMargem: number;
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

export interface OrcamentoExtraItem {
  id: string;
  orcamentoId: string;
  descricao: string;
  valorCusto: string;
}

export interface NovoExtra {
  descricao: string;
  valorCusto: number;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  filamentoId: string;
  maquinaId: string | null;
  pesoUsadoG: string;
  horasImpressao: string;
  valorCalculado: string;
  valorAtual: string;
  margemExtras: string | null;
  status: StatusOrcamento;
  criadoEm: string;
  cliente: Cliente;
  filamento: Filamento;
  maquina: Maquina | null;
  extras: OrcamentoExtraItem[];
  historico?: OrcamentoHistoricoItem[];
}

export interface NovoOrcamento {
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
  filamentoId: string;
  maquinaId?: string;
  pesoUsadoG: number;
  horasImpressao: number;
  custoEnergiaHora: number;
  taxaDepreciacaoHora: number;
  margemPercentual: number;
  extras?: NovoExtra[];
  margemExtras?: number;
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
  precoPorKg: string | null;
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
  filamentoMarca: string | null;
  pesoUsadoG: number;
  horasImpressao: number;
  valorFinal: number;
  valorCalculado: number;
}
