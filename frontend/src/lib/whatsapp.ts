import type { Orcamento } from "../types";

export function formatarTelefoneWhatsapp(whatsapp: string): string | null {
  const somenteDigitos = whatsapp.replace(/\D/g, "");
  if (somenteDigitos.length === 0) return null;

  // Números com DDD (10 ou 11 dígitos) ainda não têm o código do país (55 = Brasil)
  if (somenteDigitos.length === 10 || somenteDigitos.length === 11) {
    return `55${somenteDigitos}`;
  }

  return somenteDigitos;
}

export function montarMensagemOrcamento(orcamento: Orcamento): string {
  const valor = parseFloat(orcamento.valorAtual).toFixed(2);
  const peso = parseFloat(orcamento.pesoUsadoG).toFixed(0);
  const horas = parseFloat(orcamento.horasImpressao).toFixed(1);
  const linhaExtras =
    orcamento.extras.length > 0 ? `\nInclui: ${orcamento.extras.map((e) => e.descricao).join(", ")}\n` : "";

  return `Olá, ${orcamento.cliente.nome}! Aqui está o orçamento da sua peça:

Material: ${orcamento.filamento.tipo} ${orcamento.filamento.cor}
Peso: ${peso}g
Tempo de impressão: ${horas}h
${linhaExtras}
Valor: R$ ${valor}

Qualquer dúvida, é só chamar!`;
}

export function montarLinkWhatsapp(orcamento: Orcamento): string | null {
  if (!orcamento.cliente.whatsapp) return null;

  const numero = formatarTelefoneWhatsapp(orcamento.cliente.whatsapp);
  if (!numero) return null;

  const mensagem = montarMensagemOrcamento(orcamento);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
