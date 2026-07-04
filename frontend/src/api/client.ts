import type {
  CalculoInput,
  CalculoResultado,
  Cliente,
  Filamento,
  MovimentoEstoque,
  NovoCliente,
  NovoFilamento,
  NovoOrcamento,
  Orcamento,
  OrcamentoComEstoque,
  ReceitaMensal,
  StatusOrcamento,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

async function tratarResposta<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || `Erro na requisição (${resposta.status})`);
  }
  if (resposta.status === 204) {
    return undefined as T;
  }
  return resposta.json();
}

export async function listarFilamentos(): Promise<Filamento[]> {
  const resposta = await fetch(`${API_URL}/filamentos`);
  return tratarResposta(resposta);
}

export async function criarFilamento(dados: NovoFilamento): Promise<Filamento> {
  const resposta = await fetch(`${API_URL}/filamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function excluirFilamento(id: string): Promise<void> {
  const resposta = await fetch(`${API_URL}/filamentos/${id}`, { method: "DELETE" });
  return tratarResposta(resposta);
}

export async function calcularOrcamento(dados: CalculoInput): Promise<CalculoResultado> {
  const resposta = await fetch(`${API_URL}/calculadora`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function listarClientes(): Promise<Cliente[]> {
  const resposta = await fetch(`${API_URL}/clientes`);
  return tratarResposta(resposta);
}

export async function criarCliente(dados: NovoCliente): Promise<Cliente> {
  const resposta = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function listarOrcamentos(status?: StatusOrcamento): Promise<Orcamento[]> {
  const query = status ? `?status=${status}` : "";
  const resposta = await fetch(`${API_URL}/orcamentos${query}`);
  return tratarResposta(resposta);
}

export async function buscarOrcamento(id: string): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}`);
  return tratarResposta(resposta);
}

export async function criarOrcamento(dados: NovoOrcamento): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function atualizarValorOrcamento(id: string, valor: number): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}/valor`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
  return tratarResposta(resposta);
}

export async function atualizarStatusOrcamento(
  id: string,
  status: "ACEITO" | "RECUSADO"
): Promise<OrcamentoComEstoque> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return tratarResposta(resposta);
}

export async function reabastecerFilamento(id: string, quantidadeG: number): Promise<Filamento> {
  const resposta = await fetch(`${API_URL}/filamentos/${id}/reabastecer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantidadeG }),
  });
  return tratarResposta(resposta);
}

export async function listarMovimentos(filamentoId: string): Promise<MovimentoEstoque[]> {
  const resposta = await fetch(`${API_URL}/filamentos/${filamentoId}/movimentos`);
  return tratarResposta(resposta);
}

export async function listarReceitaMensal(): Promise<ReceitaMensal[]> {
  const resposta = await fetch(`${API_URL}/receita/mensal`);
  return tratarResposta(resposta);
}
