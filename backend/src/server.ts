import "dotenv/config";
import cors from "cors";
import express from "express";
import { usuarioPadrao } from "./middleware/usuarioPadrao";
import { filamentosRouter } from "./routes/filamentos";
import { calculadoraRouter } from "./routes/calculadora";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/filamentos", usuarioPadrao, filamentosRouter);
app.use("/api/calculadora", usuarioPadrao, calculadoraRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
