import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarCorFilamento,
  criarFilamento,
  excluirFilamento,
  listarFilamentos,
  listarMovimentos,
  reabastecerFilamento,
} from "../api/client";
import type { Filamento, MovimentoEstoque } from "../types";
import { MARCAS_INTERNACIONAIS, MARCAS_NACIONAIS, OUTRA_MARCA } from "../lib/marcas";

const COR_HEX_PADRAO = "#9CA3AF";

const valoresIniciais = {
  tipo: "",
  cor: "",
  corHex: "",
  marca: "",
  precoPorKg: "",
  pesoTotalKg: "",
  estoqueMinimoG: "",
};

function IconeLixeira() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

type Painel = { filamentoId: string; modo: "reabastecer" | "movimentos" } | null;

export function Estoque() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [form, setForm] = useState(valoresIniciais);
  const [modoMarca, setModoMarca] = useState<"lista" | "outra">("lista");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [painel, setPainel] = useState<Painel>(null);
  const [quantidadeReabastecer, setQuantidadeReabastecer] = useState("");
  const [precoReabastecer, setPrecoReabastecer] = useState("");
  const [processando, setProcessando] = useState(false);
  const [movimentosPorFilamento, setMovimentosPorFilamento] = useState<Record<string, MovimentoEstoque[]>>({});

  const [editandoCorId, setEditandoCorId] = useState<string | null>(null);
  const [corEditada, setCorEditada] = useState(COR_HEX_PADRAO);
  const [salvandoCor, setSalvandoCor] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await listarFilamentos();
      setFilamentos(dados);
      setErro(null);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarMarca(valor: string) {
    if (valor === OUTRA_MARCA) {
      setModoMarca("outra");
      atualizarCampo("marca", "");
    } else {
      setModoMarca("lista");
      atualizarCampo("marca", valor);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await criarFilamento({
        tipo: form.tipo,
        cor: form.cor,
        corHex: form.corHex || undefined,
        marca: form.marca || undefined,
        precoPorKg: Number(form.precoPorKg),
        pesoTotalG: Number(form.pesoTotalKg) * 1000,
        estoqueMinimoG: Number(form.estoqueMinimoG),
      });
      setForm(valoresIniciais);
      setModoMarca("lista");
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm("Excluir este filamento?")) return;
    try {
      await excluirFilamento(id);
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  function iniciarEdicaoCor(filamento: Filamento) {
    setEditandoCorId(filamento.id);
    setCorEditada(filamento.corHex || COR_HEX_PADRAO);
  }

  async function salvarCor(id: string) {
    setSalvandoCor(true);
    setErro(null);
    try {
      await atualizarCorFilamento(id, corEditada);
      setEditandoCorId(null);
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setSalvandoCor(false);
    }
  }

  function irParaFormularioCadastro() {
    document.getElementById("tipo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("tipo")?.focus();
  }

  function abrirReabastecer(filamentoId: string) {
    setPainel({ filamentoId, modo: "reabastecer" });
    setQuantidadeReabastecer("");
    setPrecoReabastecer("");
  }

  async function confirmarReabastecimento(filamentoId: string) {
    const quantidadeKg = Number(quantidadeReabastecer);
    const preco = Number(precoReabastecer);
    if (Number.isNaN(quantidadeKg) || quantidadeKg <= 0) {
      setErro("Quantidade inválida");
      return;
    }
    if (Number.isNaN(preco) || preco <= 0) {
      setErro("Preço por kg inválido");
      return;
    }
    setProcessando(true);
    setErro(null);
    try {
      await reabastecerFilamento(filamentoId, quantidadeKg * 1000, preco);
      setPainel(null);
      await carregar();
      if (movimentosPorFilamento[filamentoId]) {
        const atualizados = await listarMovimentos(filamentoId);
        setMovimentosPorFilamento((atual) => ({ ...atual, [filamentoId]: atualizados }));
      }
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  async function alternarMovimentos(filamentoId: string) {
    if (painel?.modo === "movimentos" && painel.filamentoId === filamentoId) {
      setPainel(null);
      return;
    }
    setPainel({ filamentoId, modo: "movimentos" });
    if (!movimentosPorFilamento[filamentoId]) {
      try {
        const dados = await listarMovimentos(filamentoId);
        setMovimentosPorFilamento((atual) => ({ ...atual, [filamentoId]: dados }));
      } catch (err) {
        setErro((err as Error).message);
      }
    }
  }

  return (
    <div className="pagina">
      <h1>Estoque de Filamentos</h1>

      <form className="formulario" onSubmit={handleSubmit}>
        <div className="campo">
          <label htmlFor="tipo">Tipo</label>
          <input
            id="tipo"
            required
            placeholder="PLA, ABS, PETG..."
            value={form.tipo}
            onChange={(e) => atualizarCampo("tipo", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="cor">Cor</label>
          <input
            id="cor"
            required
            placeholder="Preto"
            value={form.cor}
            onChange={(e) => atualizarCampo("cor", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="corHex">Cor visual (opcional)</label>
          <input
            id="corHex"
            type="color"
            value={form.corHex || COR_HEX_PADRAO}
            onChange={(e) => atualizarCampo("corHex", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="marca">Marca</label>
          {modoMarca === "lista" ? (
            <select id="marca" value={form.marca} onChange={(e) => selecionarMarca(e.target.value)}>
              <option value="">Selecione (opcional)</option>
              <optgroup label="Nacionais">
                {MARCAS_NACIONAIS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Internacionais">
                {MARCAS_INTERNACIONAIS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
              <option value={OUTRA_MARCA}>Outra</option>
            </select>
          ) : (
            <div className="campo-marca-customizada">
              <input
                autoFocus
                placeholder="Digite a marca"
                value={form.marca}
                onChange={(e) => atualizarCampo("marca", e.target.value)}
              />
              <button type="button" className="link-acao" onClick={() => selecionarMarca("")}>
                Escolher da lista
              </button>
            </div>
          )}
        </div>
        <div className="campo">
          <label htmlFor="precoPorKg">Preço por kg (R$)</label>
          <input
            id="precoPorKg"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.precoPorKg}
            onChange={(e) => atualizarCampo("precoPorKg", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="pesoTotalKg">Peso comprado agora (kg)</label>
          <input
            id="pesoTotalKg"
            required
            type="number"
            min="0"
            step="0.001"
            value={form.pesoTotalKg}
            onChange={(e) => atualizarCampo("pesoTotalKg", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="estoqueMinimoG">Estoque mínimo (g)</label>
          <input
            id="estoqueMinimoG"
            required
            type="number"
            min="0"
            step="1"
            value={form.estoqueMinimoG}
            onChange={(e) => atualizarCampo("estoqueMinimoG", e.target.value)}
          />
        </div>
        <button type="submit" className="botao-primario" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar filamento"}
        </button>
      </form>

      <p className="dica-cadastro">
        <strong>Cadastrar filamento</strong> é para um tipo, cor ou marca que você nunca teve. Já comprou mais do
        mesmo filamento que já existe na lista? Use o botão <strong>Reabastecer</strong> dele lá embaixo.
      </p>

      {erro && <p className="erro">{erro}</p>}

      <h2>Filamentos cadastrados</h2>
      {carregando ? (
        <p>Carregando...</p>
      ) : filamentos.length === 0 ? (
        <div className="estado-vazio">
          <p>Você ainda não tem filamentos cadastrados. Cadastre o primeiro pra poder calcular orçamentos.</p>
          <button type="button" className="botao-primario" onClick={irParaFormularioCadastro}>
            Cadastrar meu primeiro filamento
          </button>
        </div>
      ) : (
        <div className="lista-filamentos">
          {filamentos.map((f) => {
            const abaixoDoMinimo = parseFloat(f.pesoAtualG) < parseFloat(f.estoqueMinimoG);
            const painelAberto = painel?.filamentoId === f.id ? painel.modo : null;
            const emEdicaoCor = editandoCorId === f.id;

            return (
              <div key={f.id} className={abaixoDoMinimo ? "card-filamento estoque-baixo" : "card-filamento"}>
                <div className="card-filamento-cabecalho">
                  <div className="identidade-filamento">
                    {emEdicaoCor ? (
                      <span className="edicao-cor">
                        <input
                          type="color"
                          autoFocus
                          value={corEditada}
                          onChange={(e) => setCorEditada(e.target.value)}
                        />
                        <button className="botao-primario" disabled={salvandoCor} onClick={() => salvarCor(f.id)}>
                          Salvar
                        </button>
                        <button className="botao-secundario" onClick={() => setEditandoCorId(null)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="indicador-cor"
                        style={f.corHex ? { background: f.corHex } : undefined}
                        onClick={() => iniciarEdicaoCor(f)}
                        title={f.corHex ? "Editar cor" : "Escolher cor"}
                        aria-label={f.corHex ? "Editar cor" : "Escolher cor"}
                      />
                    )}
                    <span>
                      <strong>{f.tipo}</strong> · {f.cor}
                      {f.marca && <span className="detalhe-secundario"> · {f.marca}</span>}
                    </span>
                  </div>
                  {abaixoDoMinimo && <span className="badge-status badge-pendente">Estoque baixo</span>}
                </div>

                <div className="card-filamento-info">
                  <div className="stat-filamento">
                    <span>Preço/g</span>
                    <strong className="numero">
                      {f.precoPorGrama ? `R$ ${parseFloat(f.precoPorGrama).toFixed(4)}` : "—"}
                    </strong>
                  </div>
                  <div className="stat-filamento">
                    <span>Peso atual</span>
                    <strong className="numero">{parseFloat(f.pesoAtualG).toFixed(0)} g</strong>
                  </div>
                  <div className="stat-filamento">
                    <span>Total comprado</span>
                    <strong className="numero">{parseFloat(f.pesoTotalG).toFixed(0)} g</strong>
                  </div>
                  <div className="stat-filamento">
                    <span>Estoque mínimo</span>
                    <strong className="numero">{parseFloat(f.estoqueMinimoG).toFixed(0)} g</strong>
                  </div>
                </div>

                <div className="acoes-filamento">
                  <button className="botao-secundario" onClick={() => abrirReabastecer(f.id)}>
                    Reabastecer
                  </button>
                  <button className="link-acao" onClick={() => alternarMovimentos(f.id)}>
                    {painelAberto === "movimentos" ? "Ocultar movimentações" : "Ver movimentações"}
                  </button>
                  <button
                    className="botao-excluir-discreto"
                    onClick={() => handleExcluir(f.id)}
                    title="Excluir filamento"
                    aria-label="Excluir filamento"
                  >
                    <IconeLixeira />
                  </button>
                </div>

                {painelAberto === "reabastecer" && (
                  <div className="painel-inline">
                    <label htmlFor={`quantidade-${f.id}`}>Quantidade comprada (kg)</label>
                    <input
                      id={`quantidade-${f.id}`}
                      type="number"
                      min="0"
                      step="0.001"
                      value={quantidadeReabastecer}
                      onChange={(e) => setQuantidadeReabastecer(e.target.value)}
                    />
                    <label htmlFor={`preco-${f.id}`}>Preço por kg nessa compra (R$)</label>
                    <input
                      id={`preco-${f.id}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={precoReabastecer}
                      onChange={(e) => setPrecoReabastecer(e.target.value)}
                    />
                    <button
                      className="botao-primario"
                      disabled={processando}
                      onClick={() => confirmarReabastecimento(f.id)}
                    >
                      Confirmar
                    </button>
                    <button className="botao-secundario" onClick={() => setPainel(null)}>
                      Cancelar
                    </button>
                  </div>
                )}

                {painelAberto === "movimentos" && (
                  <div className="painel-inline painel-movimentos">
                    {!movimentosPorFilamento[f.id] ? (
                      <p>Carregando movimentações...</p>
                    ) : movimentosPorFilamento[f.id].length === 0 ? (
                      <p>Nenhuma movimentação registrada ainda.</p>
                    ) : (
                      <ul>
                        {movimentosPorFilamento[f.id].map((m) => (
                          <li key={m.id}>
                            <span className={`badge-movimento badge-${m.tipo.toLowerCase()}`}>
                              {m.tipo === "ENTRADA" ? "Entrada" : "Saída"}
                            </span>{" "}
                            <span className="numero">
                              {parseFloat(m.quantidadeG).toFixed(0)}g
                              {m.precoPorKg && ` (R$ ${parseFloat(m.precoPorKg).toFixed(2)}/kg)`}
                            </span>{" "}
                            — {new Date(m.data).toLocaleString("pt-BR")}
                            {m.observacao && <span className="detalhe-secundario"> — {m.observacao}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
