import { useEffect, useState, type FormEvent } from "react";
import { calcularOrcamento, listarFilamentos } from "../api/client";
import type { CalculoResultado, Filamento } from "../types";

const valoresIniciais = {
  filamentoId: "",
  pesoUsadoG: "",
  horasImpressao: "",
  custoEnergiaHora: "",
  taxaDepreciacaoHora: "",
  margemPercentual: "",
};

export function Calculadora() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [form, setForm] = useState(valoresIniciais);
  const [resultado, setResultado] = useState<CalculoResultado | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarFilamentos()
      .then((dados) => {
        setFilamentos(dados);
        if (dados.length > 0) {
          setForm((atual) => ({ ...atual, filamentoId: dados[0].id }));
        }
      })
      .catch((err) => setErro((err as Error).message));
  }, []);

  function atualizarCampo(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCalculando(true);
    setErro(null);
    setResultado(null);
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
                  {f.tipo} - {f.cor} (R$ {parseFloat(f.precoPago).toFixed(2)} / {parseFloat(f.pesoTotalG).toFixed(0)} g)
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
        </div>
      )}
    </div>
  );
}
