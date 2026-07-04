import type { CalculoInput, CalculoResultado, Filamento, NovoFilamento } from "../types";

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
