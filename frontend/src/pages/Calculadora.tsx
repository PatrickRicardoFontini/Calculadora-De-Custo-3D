import { useEffect, useState, type FormEvent } from "react";
import { calcularOrcamento, criarOrcamento, listarClientes, listarFilamentos } from "../api/client";
import type { CalculoResultado, Cliente, Filamento } from "../types";

const valoresIniciais = {
  filamentoId: "",
  pesoUsadoG: "",
  horasImpressao: "",
  custoEnergiaHora: "",
  taxaDepreciacaoHora: "",
  margemPercentual: "",
};

interface CalculadoraProps {
  aoSalvarOrcamento?: () => void;
}

export function Calculadora({ aoSalvarOrcamento }: CalculadoraProps) {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [form, setForm] = useState(valoresIniciais);
  const [resultado, setResultado] = useState<CalculoResultado | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modoCliente, setModoCliente] = useState<"existente" | "novo">("existente");
  const [clienteId, setClienteId] = useState("");
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [orcamentoSalvo, setOrcamentoSalvo] = useState(false);

  useEffect(() => {
    listarFilamentos()
      .then((dados) => {
        setFilamentos(dados);
        if (dados.length > 0) {
          setForm((atual) => ({ ...atual, filamentoId: dados[0].id }));
        }
      })
      .catch((err) => setErro((err as Error).message));

    listarClientes()
      .then((dados) => {
        setClientes(dados);
        if (dados.length > 0) {
          setClienteId(dados[0].id);
        } else {
          setModoCliente("novo");
        }
      })
      .catch((err) => setErroSalvar((err as Error).message));
  }, []);

  function atualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCalculando(true);
    setErro(null);
    setResultado(null);
    setOrcamentoSalvo(false);
    try {
      const dados = await calcularOrcamento({
        filamentoId: form.filamentoId,
        pesoUsadoG: Number(form.pesoUsadoG),
        horasImpressao: Number(form.horasImpressao),
        custoEnergiaHora: Number(form.custoEnergiaHora),
        taxaDepreciacaoHora: Number(form.taxaDepreciacaoHora),
        margemPercentual: Number(form.margemPercentual),
      });
      setResultado(dados);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCalculando(false);
    }
  }

  async function handleSalvarOrcamento(e: FormEvent) {
    e.preventDefault();
    if (!resultado) return;

    setSalvando(true);
    setErroSalvar(null);
    try {
      await criarOrcamento({
        ...(modoCliente === "existente" ? { clienteId } : { clienteNome: novoClienteNome, clienteWhatsapp: novoClienteWhatsapp }),
        filamentoId: form.filamentoId,
        pesoUsadoG: Number(form.pesoUsadoG),
        horasImpressao: Number(form.horasImpressao),
        custoEnergiaHora: Number(form.custoEnergiaHora),
        taxaDepreciacaoHora: Number(form.taxaDepreciacaoHora),
        margemPercentual: Number(form.margemPercentual),
      });
      setOrcamentoSalvo(true);
      setNovoClienteNome("");
      setNovoClienteWhatsapp("");
      aoSalvarOrcamento?.();
    } catch (err) {
      setErroSalvar((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="pagina">
      <h2>Calculadora de Custo</h2>

      {filamentos.length === 0 ? (
        <p>Cadastre um filamento no estoque antes de calcular um orçamento.</p>
      ) : (
        <form className="formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <label htmlFor="filamentoId">Filamento</label>
            <select
              id="filamentoId"
              required
              value={form.filamentoId}
              onChange={(e) => atualizarCampo("filamentoId", e.target.value)}
            >
              {filamentos.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.tipo} - {f.cor}
                  {f.marca ? ` (${f.marca})` : ""}
                  {f.precoPorGrama ? ` — R$ ${parseFloat(f.precoPorGrama).toFixed(4)}/g` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="pesoUsadoG">Peso usado (g)</label>
            <input
              id="pesoUsadoG"
              required
              type="number"
              min="0"
              step="0.1"
              value={form.pesoUsadoG}
              onChange={(e) => atualizarCampo("pesoUsadoG", e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="horasImpressao">Horas de impressão</label>
            <input
              id="horasImpressao"
              required
              type="number"
              min="0"
              step="0.1"
              value={form.horasImpressao}
              onChange={(e) => atualizarCampo("horasImpressao", e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="custoEnergiaHora">Custo de energia por hora (R$)</label>
            <input
              id="custoEnergiaHora"
              required
              type="number"
              min="0"
              step="0.01"
              value={form.custoEnergiaHora}
              onChange={(e) => atualizarCampo("custoEnergiaHora", e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="taxaDepreciacaoHora">Depreciação por hora (R$)</label>
            <input
              id="taxaDepreciacaoHora"
              required
              type="number"
              min="0"
              step="0.01"
              value={form.taxaDepreciacaoHora}
              onChange={(e) => atualizarCampo("taxaDepreciacaoHora", e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="margemPercentual">Margem de lucro (%)</label>
            <input
              id="margemPercentual"
              required
              type="number"
              min="0"
              step="1"
              value={form.margemPercentual}
              onChange={(e) => atualizarCampo("margemPercentual", e.target.value)}
            />
          </div>
          <button type="submit" disabled={calculando}>
            {calculando ? "Calculando..." : "Calcular"}
          </button>
        </form>
      )}

      {erro && <p className="erro">{erro}</p>}

      {resultado && (
        <div className="resultado">
          <h3>Detalhamento</h3>
          <table className="tabela">
            <tbody>
              <tr>
                <td>Preço por grama</td>
                <td>R$ {resultado.detalhamento.precoPorGrama.toFixed(4)}</td>
              </tr>
              <tr>
                <td>Custo do filamento</td>
                <td>R$ {resultado.detalhamento.custoFilamento.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Custo de energia</td>
                <td>R$ {resultado.detalhamento.custoEnergia.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Depreciação</td>
                <td>R$ {resultado.detalhamento.custoDepreciacao.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Subtotal</td>
                <td>R$ {resultado.detalhamento.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Margem aplicada</td>
                <td>{resultado.detalhamento.margemPercentual}%</td>
              </tr>
              <tr className="linha-total">
                <td>Valor final</td>
                <td>R$ {resultado.detalhamento.valorFinal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="secao-salvar-orcamento">
            <h3>Salvar como orçamento</h3>
            <form className="formulario" onSubmit={handleSalvarOrcamento}>
              <div className="campo">
                <label htmlFor="modoCliente">Cliente</label>
                <select
                  id="modoCliente"
                  value={modoCliente}
                  onChange={(e) => setModoCliente(e.target.value as "existente" | "novo")}
                >
                  <option value="existente" disabled={clientes.length === 0}>
                    Cliente já cadastrado
                  </option>
                  <option value="novo">Novo cliente</option>
                </select>
              </div>

              {modoCliente === "existente" ? (
                <div className="campo">
                  <label htmlFor="clienteId">Selecione o cliente</label>
                  <select id="clienteId" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} {c.whatsapp ? `(${c.whatsapp})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
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

              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar como orçamento"}
              </button>
            </form>
            {erroSalvar && <p className="erro">{erroSalvar}</p>}
            {orcamentoSalvo && <p className="sucesso">Orçamento salvo! Veja na aba Orçamentos.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
