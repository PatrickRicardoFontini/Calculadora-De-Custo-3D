import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 não encaminha rejeições de promises de handlers async pro middleware de erro
// sozinho — sem isso, um erro inesperado (ex.: falha do Prisma) vira uma rejeição não
// tratada, que em versões recentes do Node derruba o processo inteiro. Todo handler
// async de rota passa por aqui antes de ser registrado no Router.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
