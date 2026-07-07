import type { Prisma } from "@prisma/client";

// select explícito (em vez de excluir senhaHash manualmente depois de buscar tudo): garante
// que a senha com hash nunca é sequer carregada do banco nos lugares que não precisam dela,
// então nenhuma resposta de API consegue vazá-la mesmo que algum código futuro esqueça de
// filtrar o campo antes de responder
export const USUARIO_SELECT_SEGURO = {
  id: true,
  nome: true,
  email: true,
  precoKwh: true,
  margemPadrao: true,
  margemExtrasPadrao: true,
  templateWhatsapp: true,
} satisfies Prisma.UsuarioSelect;

export type UsuarioSeguro = Prisma.UsuarioGetPayload<{ select: typeof USUARIO_SELECT_SEGURO }>;
