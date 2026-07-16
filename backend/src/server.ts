import "dotenv/config";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import { autenticacao } from "./middleware/autenticacao";
import { authRouter } from "./routes/auth";
import { filamentosRouter } from "./routes/filamentos";
import { calculadoraRouter } from "./routes/calculadora";
import { clientesRouter } from "./routes/clientes";
import { orcamentosRouter } from "./routes/orcamentos";
import { receitaRouter } from "./routes/receita";
import { maquinasRouter } from "./routes/maquinas";
import { vendasRouter } from "./routes/vendas";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3333;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Confere conexão real com o banco (não só que o processo Express subiu), pra quem chama
// (ex.: o app desktop Electron, esperando o backend ficar pronto antes de abrir a janela)
// conseguir distinguir "backend não subiu" de "banco inacessível" e mostrar uma mensagem
// específica em vez de travar sem explicação
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Falha ao conectar no banco de dados:", err);
    res.status(503).json({
      status: "erro",
      mensagem: "Não consegui conectar ao banco de dados. Confirma que o MySQL do XAMPP está rodando.",
    });
  }
});

app.use("/api/auth", authRouter);

app.use("/api/filamentos", autenticacao, filamentosRouter);
app.use("/api/calculadora", autenticacao, calculadoraRouter);
app.use("/api/clientes", autenticacao, clientesRouter);
app.use("/api/orcamentos", autenticacao, orcamentosRouter);
app.use("/api/receita", autenticacao, receitaRouter);
app.use("/api/maquinas", autenticacao, maquinasRouter);
app.use("/api/vendas", autenticacao, vendasRouter);

// Serve os arquivos do frontend já compilados (`npm run build` em /frontend), pra rodar
// tudo num processo só atrás de um único túnel. Só registra se a pasta existir — no
// dia a dia com os dois processos separados (frontend via Vite em :5173) essa pasta não
// existe, então nada muda no fluxo normal de desenvolvimento.
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // Rota coringa: qualquer caminho que não bateu com uma rota de API acima cai aqui e
  // recebe o index.html, pra navegação do lado do cliente continuar funcionando. Exclui
  // caminhos que começam com /api/ pra um endpoint inexistente continuar dando 404 em
  // vez de silenciosamente devolver a página HTML.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

// Middleware de erro central: precisa ser o último registrado. Cobre tanto erros
// encaminhados pelo asyncHandler das rotas quanto erros do próprio Express (ex.: JSON
// malformado no corpo da requisição). O detalhe completo só vai pro log do servidor —
// a resposta HTTP nunca expõe stack trace, mensagem crua do Prisma ou caminho de arquivo.
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  const status =
    typeof (err as { status?: unknown })?.status === "number"
      ? (err as { status: number }).status
      : typeof (err as { statusCode?: unknown })?.statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;

  const mensagem = status >= 400 && status < 500 ? "Requisição inválida" : "Erro interno do servidor";
  res.status(status).json({ erro: mensagem });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
