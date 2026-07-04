import type { NextFunction, Request, Response } from "express";
import { verificarToken } from "../lib/jwt";

export function autenticacao(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho || !cabecalho.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  const token = cabecalho.slice("Bearer ".length);

  try {
    const payload = verificarToken(token);
    req.usuarioId = payload.usuarioId;
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}
