import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  arredondar,
  calcularCusto,
  calcularCustoEnergiaHora,
  calcularTaxaDepreciacaoHora,
  calcularValorExtrasComMargem,
  somarCustoExtras,
} from "../lib/calculo";
import { decimalToNumber } from "../lib/decimal";
import { MODELO_PADRAO_WHATSAPP, dadosDoOrcamento, renderizarMensagemWhatsapp } from "../lib/mensagemWhatsapp";
import type { StatusOrcamento } from "@prisma/client";

export const orcamentosRouter = Router();

const STATUS_VALIDOS: StatusOrcamento[] = ["PENDENTE", "ACEITO", "RECUSADO"];

const INCLUDE_PADRAO = {
  cliente: true,
  filamento: true,
  maquina: true,
  extras: true,
} as const;

const INCLUDE_DETALHE = {
  ...INCLUDE_PADRAO,
  historico: { orderBy: { registradoEm: "asc" } },
} as const;

// GET /orcamentos - lista orçamentos do usuário, com filtro opcional por status
orcamentosRouter.get("/", async (req, res) => {
  const { status } = req.query;

  if (status !== undefined && !STATUS_VALIDOS.includes(status as StatusOrcamento)) {
    return res.status(400).json({ erro: `status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}` });
  }

  const orcamentos = await prisma.orcamento.findMany({
    where: {
      usuarioId: req.usuarioId,
      ...(status !== undefined && { status: status as StatusOrcamento }),
    },
    include: INCLUDE_PADRAO,
    orderBy: { criadoEm: "desc" },
  });

  res.json(orcamentos);
});

// GET /orcamentos/:id - detalhe do orçamento, incluindo histórico de valores
orcamentosRouter.get("/:id", async (req, res) => {
  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
    include: INCLUDE_DETALHE,
  });

  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }

  res.json(orcamento);
});

// POST /orcamentos - cria orçamento vinculado a um cliente (existente ou novo) e a um filamento
orcamentosRouter.post("/", async (req, res) => {
  const {
    clienteId,
    clienteNome,
    clienteWhatsapp,
    filamentoId,
    maquinaId,
    pesoUsadoG,
    horasImpressao,
    custoEnergiaHora,
    taxaDepreciacaoHora,
    margemPercentual,
    extras,
    margemExtras,
  } = req.body;

  const erros: string[] = [];
  if (!filamentoId) {
    erros.push("Campo obrigatório ausente: filamentoId");
  }
  if (!clienteId && !clienteNome) {
    erros.push("Informe clienteId de um cliente existente ou clienteNome para criar um novo");
  }
  for (const campo of ["pesoUsadoG", "horasImpressao", "margemPercentual"]) {
    const valor = req.body[campo];
    if (valor === undefined || valor === null || valor === "") {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    } else if (Number.isNaN(Number(valor))) {
      erros.push(`Campo numérico inválido: ${campo}`);
    }
  }
  // custoEnergiaHora e taxaDepreciacaoHora só são obrigatórios sem máquina vinculada;
  // com máquina, são calculados automaticamente, mas continuam aceitos como override manual
  for (const campo of ["custoEnergiaHora", "taxaDepreciacaoHora"]) {
    const valor = req.body[campo];
    if (!maquinaId && (valor === undefined || valor === null || valor === "")) {
      erros.push(`Campo obrigatório ausente: ${campo}`);
    } else if (valor !== undefined && valor !== null && valor !== "" && Number.isNaN(Number(valor))) {
      erros.push(`Campo numérico inválido: ${campo}`);
    }
  }

  const extrasInput: { descricao: string; valorCusto: number }[] = [];
  if (extras !== undefined && !Array.isArray(extras)) {
    erros.push("Campo 'extras' deve ser uma lista");
  } else if (Array.isArray(extras)) {
    extras.forEach((item, indice) => {
      const descricaoItem = item?.descricao;
      const valorCustoItem = item?.valorCusto;
      if (typeof descricaoItem !== "string" || !descricaoItem.trim()) {
        erros.push(`extras[${indice}].descricao é obrigatório`);
      }
      if (
        valorCustoItem === undefined ||
        valorCustoItem === null ||
        valorCustoItem === "" ||
        Number.isNaN(Number(valorCustoItem)) ||
        Number(valorCustoItem) <= 0
      ) {
        erros.push(`extras[${indice}].valorCusto inválido`);
      } else {
        extrasInput.push({ descricao: String(descricaoItem).trim(), valorCusto: Number(valorCustoItem) });
      }
    });
  }
  if (
    margemExtras !== undefined &&
    margemExtras !== null &&
    margemExtras !== "" &&
    (Number.isNaN(Number(margemExtras)) || Number(margemExtras) < 0)
  ) {
    erros.push("Campo numérico inválido: margemExtras");
  }

  if (erros.length > 0) {
    return res.status(400).json({ erro: "Dados inválidos", detalhes: erros });
  }

  const filamento = await prisma.filamento.findFirst({
    where: { id: filamentoId, usuarioId: req.usuarioId },
  });
  if (!filamento) {
    return res.status(404).json({ erro: "Filamento não encontrado" });
  }
  if (filamento.precoPorGrama === null) {
    return res.status(400).json({ erro: "Filamento sem preço por grama definido. Reabasteça ou recadastre o filamento." });
  }

  if (clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, usuarioId: req.usuarioId },
    });
    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuarioId } });

  let custoEnergiaHoraFinal: number;
  let taxaDepreciacaoHoraFinal: number;

  if (maquinaId) {
    const maquina = await prisma.maquina.findFirst({
      where: { id: maquinaId, usuarioId: req.usuarioId },
    });
    if (!maquina) {
      return res.status(404).json({ erro: "Máquina não encontrada" });
    }

    if (custoEnergiaHora !== undefined && custoEnergiaHora !== null && custoEnergiaHora !== "") {
      custoEnergiaHoraFinal = Number(custoEnergiaHora);
    } else {
      if (!usuario?.precoKwh) {
        return res.status(400).json({
          erro: "Configure o preço do kWh na aba Máquinas antes de calcular automaticamente, ou informe custoEnergiaHora manualmente.",
        });
      }
      custoEnergiaHoraFinal = calcularCustoEnergiaHora(maquina, decimalToNumber(usuario.precoKwh));
    }

    taxaDepreciacaoHoraFinal =
      taxaDepreciacaoHora !== undefined && taxaDepreciacaoHora !== null && taxaDepreciacaoHora !== ""
        ? Number(taxaDepreciacaoHora)
        : calcularTaxaDepreciacaoHora(maquina);
  } else {
    custoEnergiaHoraFinal = Number(custoEnergiaHora);
    taxaDepreciacaoHoraFinal = Number(taxaDepreciacaoHora);
  }

  const entrada = {
    pesoUsadoG: Number(pesoUsadoG),
    horasImpressao: Number(horasImpressao),
    custoEnergiaHora: custoEnergiaHoraFinal,
    taxaDepreciacaoHora: taxaDepreciacaoHoraFinal,
    margemPercentual: Number(margemPercentual),
  };

  const margemExtrasFinal =
    margemExtras !== undefined && margemExtras !== null && margemExtras !== ""
      ? Number(margemExtras)
      : usuario?.margemExtrasPadrao !== null && usuario?.margemExtrasPadrao !== undefined
        ? decimalToNumber(usuario.margemExtrasPadrao)
        : 0;

  const custoTotalExtras = somarCustoExtras(extrasInput);
  const { valorFinal } = calcularCusto(filamento, entrada, custoTotalExtras, margemExtrasFinal);

  const orcamento = await prisma.$transaction(async (tx) => {
    const clienteIdFinal = clienteId
      ? clienteId
      : (
          await tx.cliente.create({
            data: {
              usuarioId: req.usuarioId,
              nome: clienteNome,
              whatsapp: clienteWhatsapp || null,
            },
          })
        ).id;

    const novoOrcamento = await tx.orcamento.create({
      data: {
        usuarioId: req.usuarioId,
        clienteId: clienteIdFinal,
        filamentoId: filamento.id,
        maquinaId: maquinaId || null,
        pesoUsadoG: entrada.pesoUsadoG,
        horasImpressao: entrada.horasImpressao,
        valorCalculado: valorFinal,
        valorAtual: valorFinal,
        margemExtras: margemExtrasFinal,
      },
    });

    if (extrasInput.length > 0) {
      await tx.orcamentoExtra.createMany({
        data: extrasInput.map((item) => ({
          orcamentoId: novoOrcamento.id,
          descricao: item.descricao,
          valorCusto: item.valorCusto,
        })),
      });
    }

    await tx.orcamentoHistorico.create({
      data: {
        orcamentoId: novoOrcamento.id,
        valor: valorFinal,
      },
    });

    return novoOrcamento;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamento.id },
    include: INCLUDE_PADRAO,
  });

  res.status(201).json(orcamentoCompleto);
});

// POST /orcamentos/:id/extras - adiciona um item extra a um orçamento pendente e recalcula o valor
orcamentosRouter.post("/:id/extras", async (req, res) => {
  const { descricao, valorCusto } = req.body;

  if (typeof descricao !== "string" || !descricao.trim()) {
    return res.status(400).json({ erro: "Campo obrigatório ausente: descricao" });
  }
  if (
    valorCusto === undefined ||
    valorCusto === null ||
    valorCusto === "" ||
    Number.isNaN(Number(valorCusto)) ||
    Number(valorCusto) <= 0
  ) {
    return res.status(400).json({ erro: "Campo 'valorCusto' inválido" });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
    include: { extras: true },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível adicionar custos extras a orçamentos pendentes" });
  }

  const margem = orcamento.margemExtras !== null ? decimalToNumber(orcamento.margemExtras) : 0;
  const valorExtrasAntes = calcularValorExtrasComMargem(somarCustoExtras(orcamento.extras), margem);
  const valorPrincipal = decimalToNumber(orcamento.valorCalculado) - valorExtrasAntes;
  const custoTotalExtrasDepois = somarCustoExtras(orcamento.extras) + Number(valorCusto);
  const valorExtrasDepois = calcularValorExtrasComMargem(custoTotalExtrasDepois, margem);
  const novoValor = arredondar(valorPrincipal + valorExtrasDepois);

  const orcamentoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.orcamentoExtra.create({
      data: { orcamentoId: orcamento.id, descricao: descricao.trim(), valorCusto: Number(valorCusto) },
    });

    const atualizado = await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { valorCalculado: novoValor, valorAtual: novoValor },
    });

    await tx.orcamentoHistorico.create({
      data: { orcamentoId: orcamento.id, valor: novoValor },
    });

    return atualizado;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamentoAtualizado.id },
    include: INCLUDE_DETALHE,
  });

  res.status(201).json(orcamentoCompleto);
});

// DELETE /orcamentos/:id/extras/:extraId - remove um item extra de um orçamento pendente e recalcula o valor
orcamentosRouter.delete("/:id/extras/:extraId", async (req, res) => {
  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
    include: { extras: true },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível remover custos extras de orçamentos pendentes" });
  }

  const extra = orcamento.extras.find((item) => item.id === req.params.extraId);
  if (!extra) {
    return res.status(404).json({ erro: "Item extra não encontrado" });
  }

  const margem = orcamento.margemExtras !== null ? decimalToNumber(orcamento.margemExtras) : 0;
  const valorExtrasAntes = calcularValorExtrasComMargem(somarCustoExtras(orcamento.extras), margem);
  const valorPrincipal = decimalToNumber(orcamento.valorCalculado) - valorExtrasAntes;
  const extrasRestantes = orcamento.extras.filter((item) => item.id !== extra.id);
  const valorExtrasDepois = calcularValorExtrasComMargem(somarCustoExtras(extrasRestantes), margem);
  const novoValor = arredondar(valorPrincipal + valorExtrasDepois);

  const orcamentoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.orcamentoExtra.delete({ where: { id: extra.id } });

    const atualizado = await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { valorCalculado: novoValor, valorAtual: novoValor },
    });

    await tx.orcamentoHistorico.create({
      data: { orcamentoId: orcamento.id, valor: novoValor },
    });

    return atualizado;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamentoAtualizado.id },
    include: INCLUDE_DETALHE,
  });

  res.json(orcamentoCompleto);
});

// PUT /orcamentos/:id/valor - negocia o valor do orçamento enquanto PENDENTE
orcamentosRouter.put("/:id/valor", async (req, res) => {
  const { valor } = req.body;

  if (valor === undefined || valor === null || valor === "" || Number.isNaN(Number(valor)) || Number(valor) <= 0) {
    return res.status(400).json({ erro: "Campo 'valor' inválido" });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível editar o valor de orçamentos pendentes" });
  }

  const valorNumerico = Number(valor);

  const orcamentoAtualizado = await prisma.$transaction(async (tx) => {
    const atualizado = await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { valorAtual: valorNumerico },
    });

    await tx.orcamentoHistorico.create({
      data: { orcamentoId: orcamento.id, valor: valorNumerico },
    });

    return atualizado;
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamentoAtualizado.id },
    include: INCLUDE_DETALHE,
  });

  res.json(orcamentoCompleto);
});

// PUT /orcamentos/:id/status - marca orçamento como ACEITO ou RECUSADO
orcamentosRouter.put("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (status !== "ACEITO" && status !== "RECUSADO") {
    return res.status(400).json({ erro: "status deve ser ACEITO ou RECUSADO" });
  }

  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }
  if (orcamento.status !== "PENDENTE") {
    return res.status(400).json({ erro: "Só é possível alterar o status de orçamentos pendentes" });
  }

  if (status === "RECUSADO") {
    const orcamentoAtualizado = await prisma.orcamento.update({
      where: { id: orcamento.id },
      data: { status },
      include: INCLUDE_PADRAO,
    });

    return res.json({ ...orcamentoAtualizado, estoqueBaixo: false });
  }

  // ACEITO: gera a venda, a saída de estoque e desconta o filamento, tudo em uma transação
  const pesoUsado = decimalToNumber(orcamento.pesoUsadoG);

  const filamentoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.orcamento.update({
      where: { id: orcamento.id },
      data: { status: "ACEITO" },
    });

    const venda = await tx.venda.create({
      data: {
        usuarioId: req.usuarioId,
        orcamentoId: orcamento.id,
        valorFinal: orcamento.valorAtual,
      },
    });

    await tx.movimentoEstoque.create({
      data: {
        filamentoId: orcamento.filamentoId,
        vendaId: venda.id,
        quantidadeG: pesoUsado,
        tipo: "SAIDA",
      },
    });

    return tx.filamento.update({
      where: { id: orcamento.filamentoId },
      data: { pesoAtualG: { decrement: pesoUsado } },
    });
  });

  const orcamentoCompleto = await prisma.orcamento.findFirst({
    where: { id: orcamento.id },
    include: INCLUDE_PADRAO,
  });

  const estoqueBaixo = decimalToNumber(filamentoAtualizado.pesoAtualG) < decimalToNumber(filamentoAtualizado.estoqueMinimoG);

  res.json({ ...orcamentoCompleto, estoqueBaixo });
});

// GET /orcamentos/:id/mensagem-whatsapp - mensagem pronta pra enviar, usando o template do usuário (ou o padrão)
orcamentosRouter.get("/:id/mensagem-whatsapp", async (req, res) => {
  const orcamento = await prisma.orcamento.findFirst({
    where: { id: req.params.id, usuarioId: req.usuarioId },
    include: { cliente: true, filamento: true, extras: true },
  });
  if (!orcamento) {
    return res.status(404).json({ erro: "Orçamento não encontrado" });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuarioId } });
  const template = usuario?.templateWhatsapp ?? MODELO_PADRAO_WHATSAPP;
  const mensagem = renderizarMensagemWhatsapp(template, dadosDoOrcamento(orcamento));

  res.json({ mensagem });
});
