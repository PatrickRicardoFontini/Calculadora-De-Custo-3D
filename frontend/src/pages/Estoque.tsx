import { useEffect, useState, type FormEvent } from "react";
import { criarFilamento, excluirFilamento, listarFilamentos } from "../api/client";
import type { Filamento } from "../types";

const valoresIniciais = {
  tipo: "",
  cor: "",
  precoPago: "",
  pesoTotalG: "",
  estoqueMinimoG: "",
};

export function Estoque() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [form, setForm] = useState(valoresIniciais);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await criarFilamento({
        tipo: form.tipo,
        cor: form.cor,
        precoPago: Number(form.precoPago),
        pesoTotalG: Number(form.pesoTotalG),
        estoqueMinimoG: Number(form.estoqueMinimoG),
      });
      setForm(valoresIniciais);
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

  return (
    <div className="pagina">
      <h2>Estoque de Filamentos</h2>

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
          <label htmlFor="precoPago">Preço pago (R$)</label>
          <input
            id="precoPago"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.precoPago}
            onChange={(e) => atualizarCampo("precoPago", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="pesoTotalG">Peso total da bobina (g)</label>
          <input
            id="pesoTotalG"
            required
            type="number"
            min="0"
            step="1"
            value={form.pesoTotalG}
            onChange={(e) => atualizarCampo("pesoTotalG", e.target.value)}
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
        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Cadastrar filamento"}
        </button>
      </form>

      {erro && <p className="erro">{erro}</p>}

      <h3>Filamentos cadastrados</h3>
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
              <th>Preço pago</th>
              <th>Peso total</th>
              <th>Peso atual</th>
              <th>Estoque mínimo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filamentos.map((f) => {
              const abaixoDoMinimo = parseFloat(f.pesoAtualG) < parseFloat(f.estoqueMinimoG);
              return (
                <tr key={f.id} className={abaixoDoMinimo ? "linha-alerta" : ""}>
                  <td>{f.tipo}</td>
                  <td>{f.cor}</td>
                  <td>R$ {parseFloat(f.precoPago).toFixed(2)}</td>
                  <td>{parseFloat(f.pesoTotalG).toFixed(0)} g</td>
                  <td>
                    {parseFloat(f.pesoAtualG).toFixed(0)} g
                    {abaixoDoMinimo && <span className="badge-alerta"> abaixo do mínimo</span>}
                  </td>
                  <td>{parseFloat(f.estoqueMinimoG).toFixed(0)} g</td>
                  <td>
                    <button className="botao-perigo" onClick={() => handleExcluir(f.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
