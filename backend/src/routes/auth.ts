import { Router } from "express";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { gerarToken } from "../lib/jwt";
import { autenticacao } from "../middleware/autenticacao";
import { asyncHandler } from "../lib/asyncHandler";
import { USUARIO_SELECT_SEGURO, type UsuarioSeguro } from "../lib/usuarioSelect";
import { MODELO_PADRAO_WHATSAPP, dadosDeExemplo, renderizarMensagemWhatsapp } from "../lib/mensagemWhatsapp";
import { enviarEmailRedefinicaoSenha } from "../lib/email";

export const authRouter = Router();

const SENHA_MIN_LENGTH = 8;
const SENHA_MAX_LENGTH = 128; // bcrypt ignora silenciosamente qualquer byte além do 72º
const NOME_MAX_LENGTH = 150;
const EMAIL_MAX_LENGTH = 255;
const TEMPLATE_WHATSAPP_MAX_LENGTH = 5000;
const TOKEN_MAX_LENGTH = 256;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_VALIDADE_MS = 60 * 60 * 1000; // 1 hora
// URL do frontend pra montar o link do email — mesma variável usada no CORS, já que
// representa a mesma origem, sem precisar de uma segunda variável redundante no .env
const FRONTEND_URL = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

// Limite de tentativas por IP em login/registro/esqueci-senha, pra dificultar força
// bruta de senha e abuso de envio de email (o Resend tem cota diária)
const limiteLoginRegistro = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: "Muitas tentativas. Aguarde alguns minutos antes de tentar de novo." },
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Guarda defensiva: rejeita login com um erro genérico em vez de deixar bcrypt.compare
// processar um hash malformado (por exemplo, a conta placeholder do prisma/seed.ts)
function pareceHashBcrypt(hash: string): boolean {
  return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

function usuarioParaResposta(usuario: UsuarioSeguro) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    precoKwh: usuario.precoKwh,
    margemPadrao: usuario.margemPadrao,
    margemExtrasPadrao: usuario.margemExtrasPadrao,
    templateWhatsapp: usuario.templateWhatsapp,
    templateWhatsappPadrao: MODELO_PADRAO_WHATSAPP,
  };
}

// POST /auth/registro - cria uma conta nova
authRouter.post("/registro", limiteLoginRegistro, asyncHandler(async (req, res) => {
  const { nome, email, senha } = req.body;

  const erros: string[] = [];
  if (!nome) erros.push("Campo obrigatório ausente: nome");
  else if (String(nome).length > NOME_MAX_LENGTH) erros.push(`Campo 'nome' excede o tamanho máximo de ${NOME_MAX_LENGTH} caracteres`);
  if (!email || !REGEX_EMAIL.test(email)) erros.push("Email inválido");
  else if (String(email).length > EMAIL_MAX_LENGTH) erros.push(`Campo 'email' excede o tamanho máximo de ${EMAIL_MAX_LENGTH} caracteres`);
  if (!senha || String(senha).length < SENHA_MIN_LENGTH) {
    erros.push(`Senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres`);
  } else if (String(senha).length > SENHA_MAX_LENGTH) {
    erros.push(`Senha deve ter no máximo ${SENHA_MAX_LENGTH} caracteres`);
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ erro: "Email já cadastrado" });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash },
    select: USUARIO_SELECT_SEGURO,
  });

  const token = gerarToken(usuario.id);
  res.status(201).json({ token, usuario: usuarioParaResposta(usuario) });
}));

// POST /auth/login
authRouter.post("/login", limiteLoginRegistro, asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha || String(email).length > EMAIL_MAX_LENGTH || String(senha).length > SENHA_MAX_LENGTH) {
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
}));

// GET /auth/me - dados do usuário autenticado, usado pelo frontend pra validar o token guardado
authRouter.get("/me", autenticacao, asyncHandler(async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuarioId },
    select: USUARIO_SELECT_SEGURO,
  });
  if (!usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }
  res.json(usuarioParaResposta(usuario));
}));

// PUT /auth/configuracoes - atualiza preço do kWh, margens padrão e template de WhatsApp da conta
authRouter.put("/configuracoes", autenticacao, asyncHandler(async (req, res) => {
  const { precoKwh, margemPadrao, margemExtrasPadrao, templateWhatsapp } = req.body;

  const erros: string[] = [];
  if (precoKwh !== undefined && precoKwh !== null && precoKwh !== "" && (Number.isNaN(Number(precoKwh)) || Number(precoKwh) < 0)) {
    erros.push("Campo numérico inválido: precoKwh");
  }
  if (
    margemPadrao !== undefined &&
    margemPadrao !== null &&
    margemPadrao !== "" &&
    (Number.isNaN(Number(margemPadrao)) || Number(margemPadrao) < 0)
  ) {
    erros.push("Campo numérico inválido: margemPadrao");
  }
  if (
    margemExtrasPadrao !== undefined &&
    margemExtrasPadrao !== null &&
    margemExtrasPadrao !== "" &&
    (Number.isNaN(Number(margemExtrasPadrao)) || Number(margemExtrasPadrao) < 0)
  ) {
    erros.push("Campo numérico inválido: margemExtrasPadrao");
  }
  if (templateWhatsapp !== undefined && templateWhatsapp !== null && typeof templateWhatsapp !== "string") {
    erros.push("Campo inválido: templateWhatsapp");
  } else if (typeof templateWhatsapp === "string" && templateWhatsapp.length > TEMPLATE_WHATSAPP_MAX_LENGTH) {
    erros.push(`Campo 'templateWhatsapp' excede o tamanho máximo de ${TEMPLATE_WHATSAPP_MAX_LENGTH} caracteres`);
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const usuario = await prisma.usuario.update({
    where: { id: req.usuarioId },
    data: {
      ...(precoKwh !== undefined && {
        precoKwh: precoKwh === "" || precoKwh === null ? null : Number(precoKwh),
      }),
      ...(margemPadrao !== undefined && {
        margemPadrao: margemPadrao === "" || margemPadrao === null ? null : Number(margemPadrao),
      }),
      ...(margemExtrasPadrao !== undefined && {
        margemExtrasPadrao: margemExtrasPadrao === "" || margemExtrasPadrao === null ? null : Number(margemExtrasPadrao),
      }),
      ...(templateWhatsapp !== undefined && {
        templateWhatsapp: templateWhatsapp === "" || templateWhatsapp === null ? null : templateWhatsapp,
      }),
    },
    select: USUARIO_SELECT_SEGURO,
  });

  res.json(usuarioParaResposta(usuario));
}));

// POST /auth/preview-whatsapp - renderiza um template (ainda não salvo) com dados de exemplo
authRouter.post("/preview-whatsapp", autenticacao, asyncHandler(async (req, res) => {
  const { template } = req.body;

  if (template !== undefined && typeof template !== "string") {
    return res.status(400).json({ erro: "Campo 'template' inválido" });
  }
  if (typeof template === "string" && template.length > TEMPLATE_WHATSAPP_MAX_LENGTH) {
    return res.status(400).json({ erro: `Campo 'template' excede o tamanho máximo de ${TEMPLATE_WHATSAPP_MAX_LENGTH} caracteres` });
  }

  const mensagem = renderizarMensagemWhatsapp(template ?? MODELO_PADRAO_WHATSAPP, dadosDeExemplo());
  res.json({ mensagem });
}));

// POST /auth/esqueci-senha - gera um token de redefinição e manda por email, se o email existir
authRouter.post("/esqueci-senha", limiteLoginRegistro, asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Resposta sempre igual, exista ou não o email: não revela quais emails estão cadastrados
  const respostaGenerica = {
    mensagem: "Se esse email existir na nossa base, você vai receber um link para redefinir a senha.",
  };

  if (!email || String(email).length > EMAIL_MAX_LENGTH) {
    return res.json(respostaGenerica);
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (usuario) {
    const token = crypto.randomBytes(RESET_TOKEN_BYTES).toString("hex");
    const resetTokenHash = hashToken(token);
    const resetTokenExpira = new Date(Date.now() + RESET_TOKEN_VALIDADE_MS);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetTokenHash, resetTokenExpira },
    });

    const link = `${FRONTEND_URL}/redefinir-senha?token=${token}`;
    await enviarEmailRedefinicaoSenha(usuario.email, link);
  }

  res.json(respostaGenerica);
}));

// POST /auth/redefinir-senha - confere o token e troca a senha
authRouter.post("/redefinir-senha", asyncHandler(async (req, res) => {
  const { token, novaSenha } = req.body;

  const erros: string[] = [];
  if (!token || typeof token !== "string") {
    erros.push("Campo obrigatório ausente: token");
  } else if (token.length > TOKEN_MAX_LENGTH) {
    erros.push("Campo 'token' inválido");
  }
  if (!novaSenha || String(novaSenha).length < SENHA_MIN_LENGTH) {
    erros.push(`Senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres`);
  } else if (String(novaSenha).length > SENHA_MAX_LENGTH) {
    erros.push(`Senha deve ter no máximo ${SENHA_MAX_LENGTH} caracteres`);
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const resetTokenHash = hashToken(token);
  const usuario = await prisma.usuario.findFirst({ where: { resetTokenHash } });

  if (!usuario || !usuario.resetTokenExpira || usuario.resetTokenExpira < new Date()) {
    return res.status(400).json({ erro: "Token inválido ou expirado" });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { senhaHash, resetTokenHash: null, resetTokenExpira: null },
  });

  res.json({ mensagem: "Senha redefinida com sucesso." });
}));
