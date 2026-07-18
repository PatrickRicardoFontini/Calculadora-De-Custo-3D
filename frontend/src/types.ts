export interface Usuario {
  id: string;
  nome: string;
  email: string;
  precoKwh: string | null;
  margemPadrao: string | null;
  margemExtrasPadrao: string | null;
  templateWhatsapp: string | null;
  templateWhatsappPadrao: string;
}

export interface RespostaAuth {
  token: string;
  usuario: Usuario;
}

export interface Filamento {
  id: string;
  tipo: string;
  cor: string;
  corHex: string | null;
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
  corHex?: string;
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
  coresAdicionais?: NovaCorAdicional[];
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

export interface OrcamentoFilamentoExtraItem {
  id: string;
  orcamentoId: string;
  filamentoId: string;
  pesoUsadoG: string;
  filamento: Filamento;
}

export interface NovaCorAdicional {
  filamentoId: string;
  pesoUsadoG: number;
}

export interface Orcamento {
  id: string;
  clienteId: string;
  filamentoId: string;
  maquinaId: string | null;
  nome: string | null;
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
  coresExtras: OrcamentoFilamentoExtraItem[];
  historico?: OrcamentoHistoricoItem[];
}

export interface NovoOrcamento {
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
  filamentoId: string;
  maquinaId?: string;
  nome?: string;
  pesoUsadoG: number;
  horasImpressao: number;
  custoEnergiaHora: number;
  taxaDepreciacaoHora: number;
  margemPercentual: number;
  extras?: NovoExtra[];
  margemExtras?: number;
  coresAdicionais?: NovaCorAdicional[];
}

export interface OrcamentoComEstoque extends Orcamento {
  estoqueBaixo: boolean;
}

export interface TrocaClienteOrcamento {
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
}

export type TipoMovimento = "ENTRADA" | "SAIDA";

export interface MovimentoEstoque {
  id: string;
  filamentoId: string;
  vendaId: string | null;
  quantidadeG: string;
  precoPorKg: string | null;
  observacao: string | null;
  tipo: TipoMovimento;
  data: string;
}

export interface ReceitaMensal {
  mes: string;
  totalVendas: number;
  quantidadeVendas: number;
}

// Campos ficam nulos quando a venda foi lançada direto (sem orçamento por trás): não há
// horasImpressao/valorCalculado (só existem no cálculo de um orçamento), e
// cliente/material são opcionais nesse fluxo. orcamentoId decide se cliente/descrição são
// editáveis (só em venda direta); clienteId é o dado bruto usado pra pré-preencher a edição
export interface VendaDoMes {
  id: string;
  orcamentoId: string | null;
  clienteId: string | null;
  dataVenda: string;
  clienteNome: string | null;
  descricao: string | null;
  filamentoTipo: string | null;
  filamentoCor: string | null;
  filamentoMarca: string | null;
  pesoUsadoG: number | null;
  horasImpressao: number | null;
  valorFinal: number;
  valorCalculado: number | null;
}

export interface NovaVenda {
  descricao: string;
  valorFinal: number;
  dataVenda?: string;
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
  filamentoId?: string;
  pesoUsadoG?: number;
}

// valorFinal/dataVenda sempre obrigatórios; descricao/cliente só são aceitos pelo backend
// quando a venda é direta (sem orçamento) — omitir os dois em venda de orçamento
export interface EdicaoVenda {
  valorFinal: number;
  dataVenda: string;
  descricao?: string;
  clienteId?: string;
  clienteNome?: string;
  clienteWhatsapp?: string;
}

export interface VendaComEstoque {
  id: string;
  orcamentoId: string | null;
  clienteId: string | null;
  descricao: string | null;
  valorFinal: string;
  dataVenda: string;
  cliente: Cliente | null;
  estoqueBaixo: boolean;
}
