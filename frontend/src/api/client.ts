import type {
  CalculoInput,
  CalculoResultado,
  Cliente,
  Filamento,
  Maquina,
  MovimentoEstoque,
  NovaMaquina,
  NovoCliente,
  NovoFilamento,
  NovoOrcamento,
  Orcamento,
  OrcamentoComEstoque,
  ReceitaMensal,
  RespostaAuth,
  StatusOrcamento,
  Usuario,
  VendaDoMes,
} from "../types";
import { limparToken, obterToken } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL as string;

function headersComAuth(extra?: Record<string, string>): HeadersInit {
  const token = obterToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function tratarResposta<T>(resposta: Response): Promise<T> {
  if (resposta.status === 401) {
    limparToken();
    window.dispatchEvent(new Event("nao-autenticado"));
  }
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro || `Erro na requisição (${resposta.status})`);
  }
  if (resposta.status === 204) {
    return undefined as T;
  }
  return resposta.json();
}

export async function registrar(nome: string, email: string, senha: string): Promise<RespostaAuth> {
  const resposta = await fetch(`${API_URL}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });
  return tratarResposta(resposta);
}

export async function login(email: string, senha: string): Promise<RespostaAuth> {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  return tratarResposta(resposta);
}

export async function esqueciSenha(email: string): Promise<{ mensagem: string }> {
  const resposta = await fetch(`${API_URL}/auth/esqueci-senha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return tratarResposta(resposta);
}

export async function redefinirSenha(token: string, novaSenha: string): Promise<{ mensagem: string }> {
  const resposta = await fetch(`${API_URL}/auth/redefinir-senha`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, novaSenha }),
  });
  return tratarResposta(resposta);
}

export async function buscarUsuarioAtual(): Promise<Usuario> {
  const resposta = await fetch(`${API_URL}/auth/me`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function atualizarConfiguracoes(
  precoKwh: number | null,
  margemPadrao: number | null,
  margemExtrasPadrao: number | null,
  templateWhatsapp: string | null
): Promise<Usuario> {
  const resposta = await fetch(`${API_URL}/auth/configuracoes`, {
    method: "PUT",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ precoKwh, margemPadrao, margemExtrasPadrao, templateWhatsapp }),
  });
  return tratarResposta(resposta);
}

export async function preverMensagemWhatsapp(template: string): Promise<{ mensagem: string }> {
  const resposta = await fetch(`${API_URL}/auth/preview-whatsapp`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ template }),
  });
  return tratarResposta(resposta);
}

export async function listarMaquinas(): Promise<Maquina[]> {
  const resposta = await fetch(`${API_URL}/maquinas`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function criarMaquina(dados: NovaMaquina): Promise<Maquina> {
  const resposta = await fetch(`${API_URL}/maquinas`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function atualizarMaquina(id: string, dados: NovaMaquina): Promise<Maquina> {
  const resposta = await fetch(`${API_URL}/maquinas/${id}`, {
    method: "PUT",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function excluirMaquina(id: string): Promise<void> {
  const resposta = await fetch(`${API_URL}/maquinas/${id}`, {
    method: "DELETE",
    headers: headersComAuth(),
  });
  return tratarResposta(resposta);
}

export async function listarFilamentos(): Promise<Filamento[]> {
  const resposta = await fetch(`${API_URL}/filamentos`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function criarFilamento(dados: NovoFilamento): Promise<Filamento> {
  const resposta = await fetch(`${API_URL}/filamentos`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function excluirFilamento(id: string): Promise<void> {
  const resposta = await fetch(`${API_URL}/filamentos/${id}`, {
    method: "DELETE",
    headers: headersComAuth(),
  });
  return tratarResposta(resposta);
}

export async function calcularOrcamento(dados: CalculoInput): Promise<CalculoResultado> {
  const resposta = await fetch(`${API_URL}/calculadora`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function listarClientes(): Promise<Cliente[]> {
  const resposta = await fetch(`${API_URL}/clientes`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function criarCliente(dados: NovoCliente): Promise<Cliente> {
  const resposta = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function listarOrcamentos(status?: StatusOrcamento): Promise<Orcamento[]> {
  const query = status ? `?status=${status}` : "";
  const resposta = await fetch(`${API_URL}/orcamentos${query}`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function buscarOrcamento(id: string): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function criarOrcamento(dados: NovoOrcamento): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function atualizarValorOrcamento(id: string, valor: number): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}/valor`, {
    method: "PUT",
    headers: headersComAuth({ "Content-Type": "application/json" }),
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
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  return tratarResposta(resposta);
}

export async function atualizarNomeOrcamento(id: string, nome: string): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${id}/nome`, {
    method: "PUT",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ nome }),
  });
  return tratarResposta(resposta);
}

export async function adicionarExtra(orcamentoId: string, descricao: string, valorCusto: number): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${orcamentoId}/extras`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ descricao, valorCusto }),
  });
  return tratarResposta(resposta);
}

export async function removerExtra(orcamentoId: string, extraId: string): Promise<Orcamento> {
  const resposta = await fetch(`${API_URL}/orcamentos/${orcamentoId}/extras/${extraId}`, {
    method: "DELETE",
    headers: headersComAuth(),
  });
  return tratarResposta(resposta);
}

export async function buscarMensagemWhatsapp(orcamentoId: string): Promise<{ mensagem: string }> {
  const resposta = await fetch(`${API_URL}/orcamentos/${orcamentoId}/mensagem-whatsapp`, {
    headers: headersComAuth(),
  });
  return tratarResposta(resposta);
}

export async function reabastecerFilamento(id: string, quantidadeG: number, precoPorKg: number): Promise<Filamento> {
  const resposta = await fetch(`${API_URL}/filamentos/${id}/reabastecer`, {
    method: "POST",
    headers: headersComAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({ quantidadeG, precoPorKg }),
  });
  return tratarResposta(resposta);
}

export async function listarMovimentos(filamentoId: string): Promise<MovimentoEstoque[]> {
  const resposta = await fetch(`${API_URL}/filamentos/${filamentoId}/movimentos`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function listarReceitaMensal(): Promise<ReceitaMensal[]> {
  const resposta = await fetch(`${API_URL}/receita/mensal`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}

export async function listarVendasDoMes(mes: string): Promise<VendaDoMes[]> {
  const resposta = await fetch(`${API_URL}/receita/vendas?mes=${mes}`, { headers: headersComAuth() });
  return tratarResposta(resposta);
}
