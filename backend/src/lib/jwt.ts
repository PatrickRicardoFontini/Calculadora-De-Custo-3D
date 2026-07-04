import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no .env");
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const EXPIRACAO = "7d";

export interface TokenPayload {
  usuarioId: string;
}

export function gerarToken(usuarioId: string): string {
  return jwt.sign({ usuarioId } satisfies TokenPayload, JWT_SECRET, { expiresIn: EXPIRACAO });
}

export function verificarToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET);
  if (typeof payload === "string" || !("usuarioId" in payload)) {
    throw new Error("Token payload inválido");
  }
  return payload as TokenPayload;
}
