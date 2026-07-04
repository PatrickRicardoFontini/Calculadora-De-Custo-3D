import { useEffect, useState } from "react";
import { atualizarStatusOrcamento, atualizarValorOrcamento, buscarOrcamento, listarOrcamentos } from "../api/client";
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
    try {
      await atualizarStatusOrcamento(id, status);
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
    if (!orcamento.historico) {
      try {
        const completo = await buscarOrcamento(orcamento.id);
        setOrcamentos((atual) => atual.map((o) => (o.id === completo.id ? completo : o)));
      } catch (err) {
        setErro((err as Error).message);
      }
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
                      · {orcamento.filamento.tipo} {orcamento.filamento.cor} · {parseFloat(orcamento.pesoUsadoG).toFixed(0)}g ·{" "}
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
