import { useEffect, useState } from "react";
import {
  adicionarExtra,
  atualizarStatusOrcamento,
  atualizarValorOrcamento,
  buscarOrcamento,
  listarOrcamentos,
  removerExtra,
} from "../api/client";
import type { Orcamento, StatusOrcamento } from "../types";
import { montarLinkWhatsapp } from "../lib/whatsapp";

type Filtro = "TODOS" | StatusOrcamento;

const ROTULO_STATUS: Record<StatusOrcamento, string> = {
  PENDENTE: "Pendente",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
};

export function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [avisoEstoqueBaixoId, setAvisoEstoqueBaixoId] = useState<string | null>(null);

  const [novaExtraDescricao, setNovaExtraDescricao] = useState("");
  const [novaExtraValor, setNovaExtraValor] = useState("");

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await listarOrcamentos(filtro === "TODOS" ? undefined : filtro);
      setOrcamentos(dados);
      setErro(null);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  function iniciarEdicao(orcamento: Orcamento) {
    setEditandoId(orcamento.id);
    setValorEditado(orcamento.valorAtual);
  }

  async function salvarValor(id: string) {
    const valorNumerico = Number(valorEditado);
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro("Valor inválido");
      return;
    }
    setProcessandoId(id);
    setErro(null);
    try {
      await atualizarValorOrcamento(id, valorNumerico);
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function mudarStatus(id: string, status: "ACEITO" | "RECUSADO") {
    setProcessandoId(id);
    setErro(null);
    setAvisoEstoqueBaixoId(null);
    try {
      const resultado = await atualizarStatusOrcamento(id, status);
      if (status === "ACEITO" && resultado.estoqueBaixo) {
        setAvisoEstoqueBaixoId(id);
      }
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function alternarExpandido(orcamento: Orcamento) {
    if (expandidoId === orcamento.id) {
      setExpandidoId(null);
      return;
    }
    setExpandidoId(orcamento.id);
    setNovaExtraDescricao("");
    setNovaExtraValor("");
    if (!orcamento.historico) {
      try {
        const completo = await buscarOrcamento(orcamento.id);
        setOrcamentos((atual) => atual.map((o) => (o.id === completo.id ? completo : o)));
      } catch (err) {
        setErro((err as Error).message);
      }
    }
  }

  async function adicionarExtraOrcamento(orcamentoId: string) {
    const valor = Number(novaExtraValor);
    if (!novaExtraDescricao.trim() || Number.isNaN(valor) || valor <= 0) {
      setErro("Preencha descrição e valor do custo extra corretamente");
      return;
    }
    setProcessandoId(orcamentoId);
    setErro(null);
    try {
      const atualizado = await adicionarExtra(orcamentoId, novaExtraDescricao.trim(), valor);
      setOrcamentos((atual) => atual.map((o) => (o.id === atualizado.id ? atualizado : o)));
      setNovaExtraDescricao("");
      setNovaExtraValor("");
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessandoId(null);
    }
  }

  async function removerExtraOrcamento(orcamentoId: string, extraId: string) {
    setProcessandoId(orcamentoId);
    setErro(null);
    try {
      const atualizado = await removerExtra(orcamentoId, extraId);
      setOrcamentos((atual) => atual.map((o) => (o.id === atualizado.id ? atualizado : o)));
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="pagina">
      <h2>Orçamentos</h2>

      <div className="filtros-status">
        {(["TODOS", "PENDENTE", "ACEITO", "RECUSADO"] as Filtro[]).map((opcao) => (
          <button
            key={opcao}
            className={filtro === opcao ? "filtro-ativo" : ""}
            onClick={() => setFiltro(opcao)}
          >
            {opcao === "TODOS" ? "Todos" : ROTULO_STATUS[opcao]}
          </button>
        ))}
      </div>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : orcamentos.length === 0 ? (
        <p>Nenhum orçamento encontrado.</p>
      ) : (
        <div className="lista-orcamentos">
          {orcamentos.map((orcamento) => {
            const linkWhatsapp = montarLinkWhatsapp(orcamento);
            const emEdicao = editandoId === orcamento.id;
            const processando = processandoId === orcamento.id;

            return (
              <div key={orcamento.id} className={`card-orcamento status-${orcamento.status.toLowerCase()}`}>
                <div className="card-orcamento-cabecalho" onClick={() => alternarExpandido(orcamento)}>
                  <div>
                    <strong>{orcamento.cliente.nome}</strong>
                    <span className="detalhe-secundario">
                      {" "}
                      · {orcamento.filamento.tipo} {orcamento.filamento.cor}
                      {orcamento.filamento.marca ? ` (${orcamento.filamento.marca})` : ""} ·{" "}
                      {parseFloat(orcamento.pesoUsadoG).toFixed(0)}g ·{" "}
                      {parseFloat(orcamento.horasImpressao).toFixed(1)}h
                    </span>
                  </div>
                  <span className={`badge-status badge-${orcamento.status.toLowerCase()}`}>
                    {ROTULO_STATUS[orcamento.status]}
                  </span>
                </div>

                <div className="card-orcamento-corpo">
                  {emEdicao ? (
                    <div className="edicao-valor">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorEditado}
                        onChange={(e) => setValorEditado(e.target.value)}
                      />
                      <button disabled={processando} onClick={() => salvarValor(orcamento.id)}>
                        Salvar
                      </button>
                      <button className="botao-secundario" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className="valor-atual">
                      Valor atual: <strong>R$ {parseFloat(orcamento.valorAtual).toFixed(2)}</strong>
                      {orcamento.valorAtual !== orcamento.valorCalculado && (
                        <span className="detalhe-secundario"> (calculado: R$ {parseFloat(orcamento.valorCalculado).toFixed(2)})</span>
                      )}
                    </p>
                  )}

                  {orcamento.status === "PENDENTE" && !emEdicao && (
                    <div className="acoes-orcamento">
                      <button className="botao-secundario" disabled={processando} onClick={() => iniciarEdicao(orcamento)}>
                        Editar valor
                      </button>
                      <button disabled={processando} onClick={() => mudarStatus(orcamento.id, "ACEITO")}>
                        Aceitar
                      </button>
                      <button
                        className="botao-perigo"
                        disabled={processando}
                        onClick={() => mudarStatus(orcamento.id, "RECUSADO")}
                      >
                        Recusar
                      </button>
                      {linkWhatsapp ? (
                        <a className="botao-whatsapp" href={linkWhatsapp} target="_blank" rel="noreferrer">
                          Abrir no WhatsApp
                        </a>
                      ) : (
                        <button className="botao-whatsapp" disabled title="Cliente sem WhatsApp cadastrado">
                          Abrir no WhatsApp
                        </button>
                      )}
                    </div>
                  )}

                  {avisoEstoqueBaixoId === orcamento.id && (
                    <p className="aviso-estoque-baixo">
                      Aceito, mas o estoque de {orcamento.filamento.tipo} {orcamento.filamento.cor} está baixo agora.
                    </p>
                  )}

                  {expandidoId === orcamento.id && (
                    <div className="secao-extras">
                      <h4>Custos extras</h4>
                      {orcamento.extras.length > 0 ? (
                        <ul className="lista-extras">
                          {orcamento.extras.map((ex) => (
                            <li key={ex.id}>
                              {ex.descricao} — R$ {parseFloat(ex.valorCusto).toFixed(2)}
                              {orcamento.status === "PENDENTE" && (
                                <button
                                  className="botao-perigo"
                                  disabled={processando}
                                  onClick={() => removerExtraOrcamento(orcamento.id, ex.id)}
                                >
                                  Remover
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="detalhe-secundario">Nenhum custo extra neste orçamento.</p>
                      )}
                      {orcamento.status === "PENDENTE" && (
                        <div className="painel-inline">
                          <input
                            placeholder="Descrição"
                            value={novaExtraDescricao}
                            onChange={(e) => setNovaExtraDescricao(e.target.value)}
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Valor (R$)"
                            value={novaExtraValor}
                            onChange={(e) => setNovaExtraValor(e.target.value)}
                          />
                          <button
                            className="botao-secundario"
                            disabled={processando}
                            onClick={() => adicionarExtraOrcamento(orcamento.id)}
                          >
                            Adicionar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {expandidoId === orcamento.id && orcamento.historico && (
                    <div className="historico-valores">
                      <h4>Histórico de valores</h4>
                      <ul>
                        {orcamento.historico.map((h) => (
                          <li key={h.id}>
                            R$ {parseFloat(h.valor).toFixed(2)} — {new Date(h.registradoEm).toLocaleString("pt-BR")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
