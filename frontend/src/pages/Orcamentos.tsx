import { useEffect, useState } from "react";
import {
  adicionarExtra,
  atualizarNomeOrcamento,
  atualizarStatusOrcamento,
  atualizarValorOrcamento,
  buscarMensagemWhatsapp,
  buscarOrcamento,
  listarOrcamentos,
  removerExtra,
} from "../api/client";
import type { Orcamento, StatusOrcamento } from "../types";
import { formatarTelefoneWhatsapp, montarLinkWhatsapp } from "../lib/whatsapp";

type Filtro = "TODOS" | StatusOrcamento;

const ROTULO_STATUS: Record<StatusOrcamento, string> = {
  PENDENTE: "Pendente",
  ACEITO: "Aceito",
  RECUSADO: "Recusado",
};

function materiaisResumo(orcamento: Orcamento): string {
  const nomeFilamento = (f: Orcamento["filamento"]) => `${f.tipo} ${f.cor}${f.marca ? ` (${f.marca})` : ""}`;
  return [nomeFilamento(orcamento.filamento), ...orcamento.coresExtras.map((cor) => nomeFilamento(cor.filamento))].join(
    ", "
  );
}

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

  const [editandoNomeId, setEditandoNomeId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");

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

  function iniciarEdicaoNome(orcamento: Orcamento) {
    setEditandoNomeId(orcamento.id);
    setNomeEditado(orcamento.nome ?? "");
  }

  async function salvarNome(id: string) {
    setProcessandoId(id);
    setErro(null);
    try {
      const atualizado = await atualizarNomeOrcamento(id, nomeEditado.trim());
      setOrcamentos((atual) => atual.map((o) => (o.id === atualizado.id ? atualizado : o)));
      setEditandoNomeId(null);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setProcessandoId(null);
    }
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

  async function abrirWhatsapp(orcamento: Orcamento) {
    const numero = orcamento.cliente.whatsapp ? formatarTelefoneWhatsapp(orcamento.cliente.whatsapp) : null;
    if (!numero) return;

    // abre a aba já na hora do clique, antes do fetch, senão o navegador bloqueia o popup
    const aba = window.open("", "_blank");
    setProcessandoId(orcamento.id);
    setErro(null);
    try {
      const { mensagem } = await buscarMensagemWhatsapp(orcamento.id);
      if (aba) {
        aba.location.href = montarLinkWhatsapp(numero, mensagem);
      }
    } catch (err) {
      setErro((err as Error).message);
      aba?.close();
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="pagina">
      <h1>Orçamentos</h1>

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
            const temWhatsapp = Boolean(
              orcamento.cliente.whatsapp && formatarTelefoneWhatsapp(orcamento.cliente.whatsapp)
            );
            const emEdicao = editandoId === orcamento.id;
            const processando = processandoId === orcamento.id;

            return (
              <div key={orcamento.id} className={`card-orcamento status-${orcamento.status.toLowerCase()}`}>
                <div className="card-orcamento-cabecalho" onClick={() => alternarExpandido(orcamento)}>
                  <div>
                    {editandoNomeId === orcamento.id ? (
                      <span className="edicao-nome" onClick={(e) => e.stopPropagation()}>
                        <input value={nomeEditado} onChange={(e) => setNomeEditado(e.target.value)} />
                        <button className="botao-primario" disabled={processando} onClick={() => salvarNome(orcamento.id)}>
                          Salvar
                        </button>
                        <button className="botao-secundario" onClick={() => setEditandoNomeId(null)}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <>
                        <strong>{orcamento.nome || orcamento.cliente.nome}</strong>
                        <button
                          className="link-acao"
                          onClick={(e) => {
                            e.stopPropagation();
                            iniciarEdicaoNome(orcamento);
                          }}
                        >
                          Editar nome
                        </button>
                      </>
                    )}
                    <span className="detalhe-secundario">
                      {" "}
                      {orcamento.nome && <>· {orcamento.cliente.nome} </>}
                      · {materiaisResumo(orcamento)} ·{" "}
                      <span className="numero">{parseFloat(orcamento.pesoUsadoG).toFixed(0)}g</span> ·{" "}
                      <span className="numero">{parseFloat(orcamento.horasImpressao).toFixed(1)}h</span>
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
                      <button className="botao-primario" disabled={processando} onClick={() => salvarValor(orcamento.id)}>
                        Salvar
                      </button>
                      <button className="botao-secundario" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className="valor-atual">
                      Valor atual: <strong className="numero">R$ {parseFloat(orcamento.valorAtual).toFixed(2)}</strong>
                      {orcamento.valorAtual !== orcamento.valorCalculado && (
                        <span className="detalhe-secundario">
                          {" "}
                          (calculado: <span className="numero">R$ {parseFloat(orcamento.valorCalculado).toFixed(2)}</span>)
                        </span>
                      )}
                    </p>
                  )}

                  {orcamento.status === "PENDENTE" && !emEdicao && (
                    <div className="acoes-orcamento">
                      <button className="botao-secundario" disabled={processando} onClick={() => iniciarEdicao(orcamento)}>
                        Editar valor
                      </button>
                      <button className="botao-primario" disabled={processando} onClick={() => mudarStatus(orcamento.id, "ACEITO")}>
                        Aceitar
                      </button>
                      <button
                        className="botao-perigo"
                        disabled={processando}
                        onClick={() => mudarStatus(orcamento.id, "RECUSADO")}
                      >
                        Recusar
                      </button>
                      {temWhatsapp ? (
                        <button className="botao-whatsapp" disabled={processando} onClick={() => abrirWhatsapp(orcamento)}>
                          Abrir no WhatsApp
                        </button>
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
                              {ex.descricao} — <span className="numero">R$ {parseFloat(ex.valorCusto).toFixed(2)}</span>
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
                            <span className="numero">R$ {parseFloat(h.valor).toFixed(2)}</span> —{" "}
                            {new Date(h.registradoEm).toLocaleString("pt-BR")}
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
