import "dotenv/config";
import cors from "cors";
import express from "express";
import { autenticacao } from "./middleware/autenticacao";
import { authRouter } from "./routes/auth";
import { filamentosRouter } from "./routes/filamentos";
import { calculadoraRouter } from "./routes/calculadora";
import { clientesRouter } from "./routes/clientes";
import { orcamentosRouter } from "./routes/orcamentos";
import { receitaRouter } from "./routes/receita";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);

app.use("/api/filamentos", autenticacao, filamentosRouter);
app.use("/api/calculadora", autenticacao, calculadoraRouter);
app.use("/api/clientes", autenticacao, clientesRouter);
app.use("/api/orcamentos", autenticacao, orcamentosRouter);
app.use("/api/receita", autenticacao, receitaRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
