import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarVenda,
  criarVenda,
  excluirVenda,
  listarClientes,
  listarFilamentos,
  listarReceitaMensal,
  listarVendasDoMes,
} from "../api/client";
import type { Cliente, Filamento, ReceitaMensal, VendaDoMes } from "../types";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatarMes(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  return `${MESES[mesNum - 1]} de ${ano}`;
}

function mesAtualChave(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function hojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function Receita() {
  const [dados, setDados] = useState<ReceitaMensal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave());
  const [vendas, setVendas] = useState<VendaDoMes[]>([]);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [erroVendas, setErroVendas] = useState<string | null>(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);

  const [descricaoVenda, setDescricaoVenda] = useState("");
  const [valorVenda, setValorVenda] = useState("");
  const [dataVenda, setDataVenda] = useState(hojeISO());
  const [modoCliente, setModoCliente] = useState<"nenhum" | "existente" | "novo">("nenhum");
  const [clienteId, setClienteId] = useState("");
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState("");
  const [descontarEstoque, setDescontarEstoque] = useState(false);
  const [filamentoId, setFilamentoId] = useState("");
  const [pesoUsadoG, setPesoUsadoG] = useState("");
  const [salvandoVenda, setSalvandoVenda] = useState(false);
  const [erroVendaForm, setErroVendaForm] = useState<string | null>(null);

  const [editandoVendaId, setEditandoVendaId] = useState<string | null>(null);
  const [valorEditado, setValorEditado] = useState("");
  const [dataEditada, setDataEditada] = useState("");
  const [descricaoEditada, setDescricaoEditada] = useState("");
  const [modoClienteEdicao, setModoClienteEdicao] = useState<"nenhum" | "existente" | "novo">("nenhum");
  const [clienteIdEditado, setClienteIdEditado] = useState("");
  const [novoClienteNomeEditado, setNovoClienteNomeEditado] = useState("");
  const [novoClienteWhatsappEditado, setNovoClienteWhatsappEditado] = useState("");
  const [processandoVendaId, setProcessandoVendaId] = useState<string | null>(null);
  const [erroEdicaoVenda, setErroEdicaoVenda] = useState<string | null>(null);

  async function carregarReceitaMensal() {
    try {
      const dados = await listarReceitaMensal();
      setDados(dados);
      setErro(null);
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function carregarVendasDoMes() {
    setCarregandoVendas(true);
    try {
      const vendas = await listarVendasDoMes(mesSelecionado);
      setVendas(vendas);
      setErroVendas(null);
    } catch (err) {
      setErroVendas((err as Error).message);
    } finally {
      setCarregandoVendas(false);
    }
  }

  useEffect(() => {
    carregarReceitaMensal().finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarVendasDoMes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesSelecionado]);

  function abrirFormulario() {
    setMostrarFormulario(true);
    if (clientes.length === 0) {
      listarClientes()
        .then(setClientes)
        .catch(() => {});
    }
    if (filamentos.length === 0) {
      listarFilamentos()
        .then(setFilamentos)
        .catch(() => {});
    }
  }

  function limparFormulario() {
    setDescricaoVenda("");
    setValorVenda("");
    setDataVenda(hojeISO());
    setModoCliente("nenhum");
    setClienteId("");
    setNovoClienteNome("");
    setNovoClienteWhatsapp("");
    setDescontarEstoque(false);
    setFilamentoId("");
    setPesoUsadoG("");
    setErroVendaForm(null);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    limparFormulario();
  }

  async function handleLancarVenda(e: FormEvent) {
    e.preventDefault();

    const valor = Number(valorVenda);
    if (!descricaoVenda.trim() || Number.isNaN(valor) || valor <= 0) {
      setErroVendaForm("Preencha descrição e valor corretamente");
      return;
    }
    if (modoCliente === "novo" && !novoClienteNome.trim()) {
      setErroVendaForm("Informe o nome do cliente");
      return;
    }
    if (descontarEstoque && (!filamentoId || Number.isNaN(Number(pesoUsadoG)) || Number(pesoUsadoG) <= 0)) {
      setErroVendaForm("Selecione o filamento e informe o peso usado");
      return;
    }

    setSalvandoVenda(true);
    setErroVendaForm(null);
    try {
      await criarVenda({
        descricao: descricaoVenda.trim(),
        valorFinal: valor,
        dataVenda,
        ...(modoCliente === "existente" ? { clienteId } : {}),
        ...(modoCliente === "novo"
          ? { clienteNome: novoClienteNome.trim(), clienteWhatsapp: novoClienteWhatsapp || undefined }
          : {}),
        ...(descontarEstoque ? { filamentoId, pesoUsadoG: Number(pesoUsadoG) } : {}),
      });
      fecharFormulario();
      await Promise.all([carregarReceitaMensal(), carregarVendasDoMes()]);
    } catch (err) {
      setErroVendaForm((err as Error).message);
    } finally {
      setSalvandoVenda(false);
    }
  }

  function iniciarEdicaoVenda(v: VendaDoMes) {
    setEditandoVendaId(v.id);
    setValorEditado(String(v.valorFinal));
    setDataEditada(v.dataVenda.slice(0, 10));
    setDescricaoEditada(v.descricao ?? "");
    setModoClienteEdicao(v.clienteId ? "existente" : "nenhum");
    setClienteIdEditado(v.clienteId ?? "");
    setNovoClienteNomeEditado("");
    setNovoClienteWhatsappEditado("");
    setErroEdicaoVenda(null);
    if (clientes.length === 0) {
      listarClientes()
        .then(setClientes)
        .catch(() => {});
    }
  }

  function cancelarEdicaoVenda() {
    setEditandoVendaId(null);
    setErroEdicaoVenda(null);
  }

  async function salvarEdicaoVenda(v: VendaDoMes) {
    const valor = Number(valorEditado);
    if (Number.isNaN(valor) || valor <= 0) {
      setErroEdicaoVenda("Valor inválido");
      return;
    }
    if (!dataEditada) {
      setErroEdicaoVenda("Informe a data");
      return;
    }
    const ehVendaDireta = !v.orcamentoId;
    if (ehVendaDireta && !descricaoEditada.trim()) {
      setErroEdicaoVenda("Descrição não pode ficar vazia");
      return;
    }
    if (ehVendaDireta && modoClienteEdicao === "novo" && !novoClienteNomeEditado.trim()) {
      setErroEdicaoVenda("Informe o nome do cliente");
      return;
    }

    setProcessandoVendaId(v.id);
    setErroEdicaoVenda(null);
    try {
      await atualizarVenda(v.id, {
        valorFinal: valor,
        dataVenda: dataEditada,
        ...(ehVendaDireta
          ? {
              descricao: descricaoEditada.trim(),
              ...(modoClienteEdicao === "existente" ? { clienteId: clienteIdEditado } : {}),
              ...(modoClienteEdicao === "novo"
                ? { clienteNome: novoClienteNomeEditado.trim(), clienteWhatsapp: novoClienteWhatsappEditado || undefined }
                : {}),
            }
          : {}),
      });
      setEditandoVendaId(null);
      await Promise.all([carregarReceitaMensal(), carregarVendasDoMes()]);
    } catch (err) {
      setErroEdicaoVenda((err as Error).message);
    } finally {
      setProcessandoVendaId(null);
    }
  }

  async function excluirVendaConfirmada(id: string) {
    if (
      !confirm(
        "Tem certeza? Essa ação não pode ser desfeita. Se essa venda descontou estoque, o estoque será devolvido."
      )
    ) {
      return;
    }
    setProcessandoVendaId(id);
    setErroVendas(null);
    try {
      await excluirVenda(id);
      await Promise.all([carregarReceitaMensal(), carregarVendasDoMes()]);
    } catch (err) {
      setErroVendas((err as Error).message);
    } finally {
      setProcessandoVendaId(null);
    }
  }

  const chaveMesAtual = mesAtualChave();
  const mesAtual = dados.find((d) => d.mes === chaveMesAtual) ?? {
    mes: chaveMesAtual,
    totalVendas: 0,
    quantidadeVendas: 0,
  };
  const mesesAnteriores = dados.filter((d) => d.mes !== chaveMesAtual);

  const opcoesMes = Array.from(new Set([chaveMesAtual, ...dados.map((d) => d.mes)])).sort((a, b) =>
    a < b ? 1 : -1
  );

  return (
    <div className="pagina">
      <h1>Receita</h1>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="destaque-mes-atual">
            <span className="rotulo-destaque">{formatarMes(mesAtual.mes)}</span>
            <span className="valor-destaque">R$ {mesAtual.totalVendas.toFixed(2)}</span>
            <span className="detalhe-secundario">
              <span className="numero">{mesAtual.quantidadeVendas}</span>{" "}
              {mesAtual.quantidadeVendas === 1 ? "venda" : "vendas"}
            </span>
          </div>

          <h2>Meses anteriores</h2>
          {mesesAnteriores.length === 0 ? (
            <p>Nenhuma venda registrada em meses anteriores.</p>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Total faturado</th>
                    <th>Vendas</th>
                  </tr>
                </thead>
                <tbody>
                  {mesesAnteriores.map((m) => (
                    <tr key={m.mes}>
                      <td>{formatarMes(m.mes)}</td>
                      <td className="numero">R$ {m.totalVendas.toFixed(2)}</td>
                      <td className="numero">{m.quantidadeVendas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="cabecalho-secao">
            <h2 className="titulo-historico">Histórico de vendas</h2>
            {!mostrarFormulario && (
              <button type="button" className="botao-primario" onClick={abrirFormulario}>
                Lançar venda
              </button>
            )}
          </div>

          {mostrarFormulario && (
            <form className="formulario" onSubmit={handleLancarVenda}>
              <div className="campo campo-largura-total">
                <label htmlFor="descricaoVenda">Descrição</label>
                <input
                  id="descricaoVenda"
                  required
                  placeholder="Ex: Suporte de celular já pronto"
                  value={descricaoVenda}
                  onChange={(e) => setDescricaoVenda(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="valorVenda">Valor (R$)</label>
                <input
                  id="valorVenda"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={valorVenda}
                  onChange={(e) => setValorVenda(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="dataVenda">Data</label>
                <input id="dataVenda" type="date" required value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
              </div>

              <div className="campo">
                <label htmlFor="modoCliente">Cliente (opcional)</label>
                <select id="modoCliente" value={modoCliente} onChange={(e) => setModoCliente(e.target.value as typeof modoCliente)}>
                  <option value="nenhum">Sem cliente</option>
                  <option value="existente" disabled={clientes.length === 0}>
                    Cliente já cadastrado
                  </option>
                  <option value="novo">Novo cliente</option>
                </select>
              </div>

              {modoCliente === "existente" && (
                <div className="campo">
                  <label htmlFor="clienteId">Selecione o cliente</label>
                  <select id="clienteId" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                    <option value="" disabled>
                      Selecione
                    </option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.whatsapp ? `(${c.whatsapp})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modoCliente === "novo" && (
                <>
                  <div className="campo">
                    <label htmlFor="novoClienteNome">Nome do cliente</label>
                    <input
                      id="novoClienteNome"
                      required
                      value={novoClienteNome}
                      onChange={(e) => setNovoClienteNome(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="novoClienteWhatsapp">WhatsApp</label>
                    <input
                      id="novoClienteWhatsapp"
                      placeholder="(11) 98765-4321"
                      value={novoClienteWhatsapp}
                      onChange={(e) => setNovoClienteWhatsapp(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="campo campo-largura-total">
                <label>
                  <input
                    type="checkbox"
                    checked={descontarEstoque}
                    onChange={(e) => setDescontarEstoque(e.target.checked)}
                  />{" "}
                  Descontar do estoque
                </label>
              </div>

              {descontarEstoque && (
                <>
                  <div className="campo">
                    <label htmlFor="filamentoIdVenda">Filamento</label>
                    <select
                      id="filamentoIdVenda"
                      required
                      value={filamentoId}
                      onChange={(e) => setFilamentoId(e.target.value)}
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {filamentos.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.tipo} {f.cor} {f.marca ? `(${f.marca})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor="pesoUsadoVenda">Peso usado (g)</label>
                    <input
                      id="pesoUsadoVenda"
                      type="number"
                      min="0"
                      step="0.1"
                      required
                      value={pesoUsadoG}
                      onChange={(e) => setPesoUsadoG(e.target.value)}
                    />
                  </div>
                </>
              )}

              {erroVendaForm && <p className="erro campo-largura-total">{erroVendaForm}</p>}

              <div className="painel-inline campo-largura-total">
                <button type="submit" className="botao-primario" disabled={salvandoVenda}>
                  Salvar venda
                </button>
                <button type="button" className="botao-secundario" onClick={fecharFormulario}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="campo campo-seletor-mes">
            <label htmlFor="mesSelecionado">Mês</label>
            <select id="mesSelecionado" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
              {opcoesMes.map((mes) => (
                <option key={mes} value={mes}>
                  {formatarMes(mes)}
                </option>
              ))}
            </select>
          </div>

          {erroVendas && <p className="erro">{erroVendas}</p>}

          {carregandoVendas ? (
            <p>Carregando vendas...</p>
          ) : vendas.length === 0 ? (
            <p>Nenhuma venda registrada em {formatarMes(mesSelecionado)}.</p>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Material / Descrição</th>
                    <th>Peso</th>
                    <th>Horas</th>
                    <th>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((v) => {
                    const ehVendaDireta = !v.orcamentoId;
                    const processando = processandoVendaId === v.id;

                    if (editandoVendaId === v.id) {
                      return (
                        <tr key={v.id}>
                          <td colSpan={7}>
                            <form
                              className="formulario"
                              onSubmit={(e) => {
                                e.preventDefault();
                                salvarEdicaoVenda(v);
                              }}
                            >
                              <div className="campo">
                                <label htmlFor={`valorEditado-${v.id}`}>Valor (R$)</label>
                                <input
                                  id={`valorEditado-${v.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  required
                                  value={valorEditado}
                                  onChange={(e) => setValorEditado(e.target.value)}
                                />
                              </div>
                              <div className="campo">
                                <label htmlFor={`dataEditada-${v.id}`}>Data</label>
                                <input
                                  id={`dataEditada-${v.id}`}
                                  type="date"
                                  required
                                  value={dataEditada}
                                  onChange={(e) => setDataEditada(e.target.value)}
                                />
                              </div>

                              {ehVendaDireta && (
                                <>
                                  <div className="campo campo-largura-total">
                                    <label htmlFor={`descricaoEditada-${v.id}`}>Descrição</label>
                                    <input
                                      id={`descricaoEditada-${v.id}`}
                                      required
                                      value={descricaoEditada}
                                      onChange={(e) => setDescricaoEditada(e.target.value)}
                                    />
                                  </div>

                                  <div className="campo">
                                    <label htmlFor={`modoClienteEdicao-${v.id}`}>Cliente (opcional)</label>
                                    <select
                                      id={`modoClienteEdicao-${v.id}`}
                                      value={modoClienteEdicao}
                                      onChange={(e) => setModoClienteEdicao(e.target.value as typeof modoClienteEdicao)}
                                    >
                                      <option value="nenhum">Sem cliente</option>
                                      <option value="existente" disabled={clientes.length === 0}>
                                        Cliente já cadastrado
                                      </option>
                                      <option value="novo">Novo cliente</option>
                                    </select>
                                  </div>

                                  {modoClienteEdicao === "existente" && (
                                    <div className="campo">
                                      <label htmlFor={`clienteIdEditado-${v.id}`}>Selecione o cliente</label>
                                      <select
                                        id={`clienteIdEditado-${v.id}`}
                                        required
                                        value={clienteIdEditado}
                                        onChange={(e) => setClienteIdEditado(e.target.value)}
                                      >
                                        <option value="" disabled>
                                          Selecione
                                        </option>
                                        {clientes.map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.nome} {c.whatsapp ? `(${c.whatsapp})` : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {modoClienteEdicao === "novo" && (
                                    <>
                                      <div className="campo">
                                        <label htmlFor={`novoClienteNomeEditado-${v.id}`}>Nome do cliente</label>
                                        <input
                                          id={`novoClienteNomeEditado-${v.id}`}
                                          required
                                          value={novoClienteNomeEditado}
                                          onChange={(e) => setNovoClienteNomeEditado(e.target.value)}
                                        />
                                      </div>
                                      <div className="campo">
                                        <label htmlFor={`novoClienteWhatsappEditado-${v.id}`}>WhatsApp</label>
                                        <input
                                          id={`novoClienteWhatsappEditado-${v.id}`}
                                          placeholder="(11) 98765-4321"
                                          value={novoClienteWhatsappEditado}
                                          onChange={(e) => setNovoClienteWhatsappEditado(e.target.value)}
                                        />
                                      </div>
                                    </>
                                  )}
                                </>
                              )}

                              {erroEdicaoVenda && <p className="erro campo-largura-total">{erroEdicaoVenda}</p>}

                              <div className="painel-inline campo-largura-total">
                                <button type="submit" className="botao-primario" disabled={processando}>
                                  Salvar
                                </button>
                                <button type="button" className="botao-secundario" onClick={cancelarEdicaoVenda}>
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={v.id}>
                        <td>{new Date(v.dataVenda).toLocaleString("pt-BR")}</td>
                        <td>{v.clienteNome ?? "—"}</td>
                        <td>
                          {v.filamentoTipo
                            ? `${v.filamentoTipo} ${v.filamentoCor}${v.filamentoMarca ? ` (${v.filamentoMarca})` : ""}`
                            : (v.descricao ?? "—")}
                        </td>
                        <td className="numero">{v.pesoUsadoG !== null ? `${v.pesoUsadoG.toFixed(0)} g` : "—"}</td>
                        <td className="numero">{v.horasImpressao !== null ? `${v.horasImpressao.toFixed(1)} h` : "—"}</td>
                        <td>
                          <span className="numero">R$ {v.valorFinal.toFixed(2)}</span>
                          {v.valorCalculado !== null && v.valorFinal !== v.valorCalculado && (
                            <span className="detalhe-secundario">
                              {" "}
                              (calculado: <span className="numero">R$ {v.valorCalculado.toFixed(2)}</span>)
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="link-acao"
                            disabled={processando}
                            onClick={() => iniciarEdicaoVenda(v)}
                          >
                            Editar
                          </button>
                          <button
                            className="botao-perigo"
                            disabled={processando}
                            onClick={() => excluirVendaConfirmada(v.id)}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
