import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "./decimal";

export const MODELO_PADRAO_WHATSAPP = `Orçamento: {nome}

Olá, {cliente}! Aqui está o orçamento da sua peça:

Material: {material}
Peso: {peso}
Tempo de impressão: {horas}
{extras}
Valor: {valor}

Qualquer dúvida, é só chamar!`;

export interface DadosMensagemWhatsapp {
  nome: string;
  cliente: string;
  material: string;
  peso: string;
  horas: string;
  valor: string;
  extras: string;
}

// Substitui os marcadores {chave} pelo dado correspondente; marcador desconhecido é
// mantido como está, pra não sumir com texto do usuário por engano
export function renderizarMensagemWhatsapp(template: string, dados: DadosMensagemWhatsapp): string {
  return template.replace(/\{(\w+)\}/g, (marcador, chave: string) =>
    chave in dados ? dados[chave as keyof DadosMensagemWhatsapp] : marcador
  );
}

export function dadosDeExemplo(): DadosMensagemWhatsapp {
  return {
    nome: "Suporte de celular",
    cliente: "Maria Exemplo",
    material: "PLA Preto",
    peso: "50g",
    horas: "2.0h",
    valor: "R$ 45.90",
    extras: "Inclui: chaveiro personalizado",
  };
}

interface OrcamentoParaMensagem {
  nome: string | null;
  cliente: { nome: string };
  filamento: { tipo: string; cor: string };
  pesoUsadoG: Prisma.Decimal | number | string;
  horasImpressao: Prisma.Decimal | number | string;
  valorAtual: Prisma.Decimal | number | string;
  extras: { descricao: string }[];
}

export function dadosDoOrcamento(orcamento: OrcamentoParaMensagem): DadosMensagemWhatsapp {
  const peso = decimalToNumber(orcamento.pesoUsadoG).toFixed(0);
  const horas = decimalToNumber(orcamento.horasImpressao).toFixed(1);
  const valor = decimalToNumber(orcamento.valorAtual).toFixed(2);

  return {
    nome: orcamento.nome ?? "",
    cliente: orcamento.cliente.nome,
    material: `${orcamento.filamento.tipo} ${orcamento.filamento.cor}`,
    peso: `${peso}g`,
    horas: `${horas}h`,
    valor: `R$ ${valor}`,
    extras: orcamento.extras.length > 0 ? `Inclui: ${orcamento.extras.map((e) => e.descricao).join(", ")}` : "",
  };
}
