import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { gerarToken } from "../lib/jwt";
import { autenticacao } from "../middleware/autenticacao";

export const authRouter = Router();

const SENHA_MIN_LENGTH = 8;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pareceHashBcrypt(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

function usuarioParaResposta(usuario: { id: string; nome: string; email: string }) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

// POST /auth/registro - cria uma conta nova, ou assume a conta do seed se ela ainda não tiver senha real
authRouter.post("/registro", async (req, res) => {
  const { nome, email, senha } = req.body;

  const erros: string[] = [];
  if (!nome) erros.push("Campo obrigatório ausente: nome");
  if (!email || !REGEX_EMAIL.test(email)) erros.push("Email inválido");
  if (!senha || String(senha).length < SENHA_MIN_LENGTH) {
    erros.push(`Senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres`);
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const existente = await prisma.usuario.findUnique({ where: { email } });

  let usuario;
  if (!existente) {
    usuario = await prisma.usuario.create({ data: { nome, email, senhaHash } });
  } else if (!pareceHashBcrypt(existente.senhaHash)) {
    // conta criada pelo seed, ainda sem senha real: assume essa conta e preserva os dados vinculados
    usuario = await prisma.usuario.update({
      where: { id: existente.id },
      data: { nome, senhaHash },
    });
  } else {
    return res.status(409).json({ erro: "Email já cadastrado" });
  }

  const token = gerarToken(usuario.id);
  res.status(201).json({ token, usuario: usuarioParaResposta(usuario) });
});

// POST /auth/login
authRouter.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: ["Informe email e senha"] });
  }

  const erroGenerico = { erro: "Email ou senha incorretos" };

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !pareceHashBcrypt(usuario.senhaHash)) {
    return res.status(401).json(erroGenerico);
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json(erroGenerico);
  }

  const token = gerarToken(usuario.id);
  res.json({ token, usuario: usuarioParaResposta(usuario) });
});

// GET /auth/me - dados do usuário autenticado, usado pelo frontend pra validar o token guardado
authRouter.get("/me", autenticacao, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuarioId } });
  if (!usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  res.json(usuarioParaResposta(usuario));
});
