import type { NextFunction, Request, Response } from "express";

const DEFAULT_USUARIO_ID = process.env.DEFAULT_USUARIO_ID;

export function usuarioPadrao(req: Request, res: Response, next: NextFunction) {
  if (!DEFAULT_USUARIO_ID) {
    return res.status(500).json({
      erro:
        "DEFAULT_USUARIO_ID não configurado no .env. Rode o seed (npm run seed) e copie o id gerado para o .env.",
    });
  }

  req.usuarioId = DEFAULT_USUARIO_ID;
  next();
}
