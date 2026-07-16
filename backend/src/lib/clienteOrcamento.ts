import type { PrismaClient } from "@prisma/client";

export const CLIENTE_NOME_MAX_LENGTH = 150;
export const CLIENTE_WHATSAPP_MAX_LENGTH = 30;

// Validação compartilhada entre criar orçamento (POST /orcamentos) e trocar o cliente de
// um orçamento existente (PUT /orcamentos/:id/cliente): aceita um cliente já cadastrado
// (clienteId) ou dados pra criar um novo na hora (clienteNome + clienteWhatsapp opcional)
export function validarClienteInput(clienteId: unknown, clienteNome: unknown, clienteWhatsapp: unknown): string[] {
  const erros: string[] = [];
  if (!clienteId && !clienteNome) {
    erros.push("Informe clienteId de um cliente existente ou clienteNome para criar um novo");
  } else if (!clienteId) {
    if (typeof clienteNome !== "string" || !clienteNome.trim()) {
      erros.push("Campo 'clienteNome' inválido");
    } else if (clienteNome.length > CLIENTE_NOME_MAX_LENGTH) {
      erros.push(`Campo 'clienteNome' excede o tamanho máximo de ${CLIENTE_NOME_MAX_LENGTH} caracteres`);
    }
    if (
      clienteWhatsapp !== undefined &&
      clienteWhatsapp !== null &&
      clienteWhatsapp !== "" &&
      String(clienteWhatsapp).length > CLIENTE_WHATSAPP_MAX_LENGTH
    ) {
      erros.push(`Campo 'clienteWhatsapp' excede o tamanho máximo de ${CLIENTE_WHATSAPP_MAX_LENGTH} caracteres`);
    }
  }
  return erros;
}

// Confere que um clienteId informado pertence ao usuário, antes de qualquer transação —
// mesmo padrão de "validar fora, escrever dentro" já usado pra coresAdicionais
export async function clienteExistente(prisma: PrismaClient, usuarioId: string, clienteId: string): Promise<boolean> {
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, usuarioId } });
  return cliente !== null;
}
