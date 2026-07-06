import { Fragment, useEffect, useState, type FormEvent } from "react";
import {
  criarFilamento,
  excluirFilamento,
  listarFilamentos,
  listarMovimentos,
  reabastecerFilamento,
} from "../api/client";
import type { Filamento, MovimentoEstoque } from "../types";
import { MARCAS_INTERNACIONAIS, MARCAS_NACIONAIS, OUTRA_MARCA } from "../lib/marcas";

const valoresIniciais = {
  tipo: "",
  cor: "",
  marca: "",
  precoPorKg: "",
  pesoTotalKg: "",
  estoqueMinimoG: "",
};

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
        <p>Nenhum filamento cadastrado ainda.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Cor</th>
              <th>Marca</th>
              <th>Preço/g</th>
              <th>Total comprado</th>
              <th>Peso atual</th>
              <th>Estoque mínimo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filamentos.map((f) => {
              const abaixoDoMinimo = parseFloat(f.pesoAtualG) < parseFloat(f.estoqueMinimoG);
              const painelAberto = painel?.filamentoId === f.id ? painel.modo : null;

              return (
                <Fragment key={f.id}>
                  <tr className={abaixoDoMinimo ? "linha-alerta" : ""}>
                    <td>{f.tipo}</td>
                    <td>{f.cor}</td>
                    <td>{f.marca || "—"}</td>
                    <td className="numero">{f.precoPorGrama ? `R$ ${parseFloat(f.precoPorGrama).toFixed(4)}` : "—"}</td>
                    <td className="numero">{parseFloat(f.pesoTotalG).toFixed(0)} g</td>
                    <td>
                      <span className="numero">{parseFloat(f.pesoAtualG).toFixed(0)} g</span>
                      {abaixoDoMinimo && <span className="badge-alerta"> abaixo do mínimo</span>}
                    </td>
                    <td className="numero">{parseFloat(f.estoqueMinimoG).toFixed(0)} g</td>
                    <td className="celula-acoes">
                      <button className="botao-secundario" onClick={() => abrirReabastecer(f.id)}>
                        Reabastecer
                      </button>
                      <button className="link-acao" onClick={() => alternarMovimentos(f.id)}>
                        {painelAberto === "movimentos" ? "Ocultar movimentações" : "Ver movimentações"}
                      </button>
                      <button className="botao-perigo" onClick={() => handleExcluir(f.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                  {painelAberto === "reabastecer" && (
                    <tr key={`${f.id}-reabastecer`}>
                      <td colSpan={8}>
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
                      </td>
                    </tr>
                  )}
                  {painelAberto === "movimentos" && (
                    <tr key={`${f.id}-movimentos`}>
                      <td colSpan={8}>
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
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
