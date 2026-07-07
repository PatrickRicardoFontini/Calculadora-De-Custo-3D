export type ForcaSenha = "fraca" | "media" | "forte";

export const TEXTO_FORCA_SENHA: Record<ForcaSenha, string> = {
  fraca: "Fraca",
  media: "Média",
  forte: "Forte",
};

// Heurística simples (tamanho + variedade de caractere), só pra orientação visual —
// não bloqueia envio, o mínimo de 8 caracteres continua sendo a única regra que impede
export function calcularForcaSenha(senha: string): ForcaSenha {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (senha.length >= 16) pontos++;
  if (/[a-z]/.test(senha)) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  if (pontos <= 3) return "fraca";
  if (pontos <= 5) return "media";
  return "forte";
}
