import { useEffect, useState, type FormEvent } from "react";
import {
  atualizarConfiguracoes,
  atualizarMaquina,
  criarMaquina,
  excluirMaquina,
  listarMaquinas,
} from "../api/client";
import type { Maquina, Usuario } from "../types";
import { MODELOS_MAQUINA, OUTRA_MAQUINA, VIDA_UTIL_SUGERIDA_HORAS } from "../lib/maquinas";

const valoresIniciais = {
  nome: "",
  potenciaWatts: "",
  precoCompra: "",
  vidaUtilHoras: String(VIDA_UTIL_SUGERIDA_HORAS),
};

interface MaquinasProps {
  usuario: Usuario;
  aoAtualizarUsuario: (usuario: Usuario) => void;
}

export function Maquinas({ usuario, aoAtualizarUsuario }: MaquinasProps) {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState(valoresIniciais);
  const [modeloSelecionado, setModeloSelecionado] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [precoKwhInput, setPrecoKwhInput] = useState(usuario.precoKwh ?? "");
  const [margemPadraoInput, setMargemPadraoInput] = useState(usuario.margemPadrao ?? "");
  const [enviandoConfig, setEnviandoConfig] = useState(false);
  const [erroConfig, setErroConfig] = useState<string | null>(null);
  const [sucessoConfig, setSucessoConfig] = useState(false);

  useEffect(() => {
    setPrecoKwhInput(usuario.precoKwh ?? "");
    setMargemPadraoInput(usuario.margemPadrao ?? "");
  }, [usuario]);

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await listarMaquinas();
      setMaquinas(dados);
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

  function selecionarModelo(nome: string) {
    setModeloSelecionado(nome);
    if (nome === OUTRA_MAQUINA || nome === "") {
      return;
    }
    const modelo = MODELOS_MAQUINA.find((m) => m.nome === nome);
    setForm((atual) => ({ ...atual, nome, potenciaWatts: modelo ? String(modelo.potenciaWatts) : atual.potenciaWatts }));
  }

  function iniciarEdicao(maquina: Maquina) {
    setEditandoId(maquina.id);
    setModeloSelecionado("");
    setForm({
      nome: maquina.nome,
      potenciaWatts: maquina.potenciaWatts,
      precoCompra: maquina.precoCompra,
      vidaUtilHoras: maquina.vidaUtilHoras,
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setModeloSelecionado("");
    setForm(valoresIniciais);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const dados = {
        nome: form.nome,
        potenciaWatts: Number(form.potenciaWatts),
        precoCompra: Number(form.precoCompra),
        vidaUtilHoras: Number(form.vidaUtilHoras),
      };
      if (editandoId) {
        await atualizarMaquina(editandoId, dados);
      } else {
        await criarMaquina(dados);
      }
      setForm(valoresIniciais);
      setModeloSelecionado("");
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm("Excluir esta máquina? Orçamentos antigos que a usaram continuam existindo, só perdem essa referência.")) {
      return;
    }
    try {
      await excluirMaquina(id);
      await carregar();
    } catch (err) {
      setErro((err as Error).message);
    }
  }

  async function handleSalvarConfig(e: FormEvent) {
    e.preventDefault();
    setEnviandoConfig(true);
    setErroConfig(null);
    try {
      const atualizado = await atualizarConfiguracoes(
        precoKwhInput === "" ? null : Number(precoKwhInput),
        margemPadraoInput === "" ? null : Number(margemPadraoInput)
      );
      aoAtualizarUsuario(atualizado);
      setSucessoConfig(true);
      setTimeout(() => setSucessoConfig(false), 2500);
    } catch (err) {
      setErroConfig((err as Error).message);
    } finally {
      setEnviandoConfig(false);
    }
  }

  return (
    <div className="pagina">
      <h2>Máquinas</h2>

      <form className="formulario formulario-config" onSubmit={handleSalvarConfig}>
        <div className="campo">
          <label htmlFor="precoKwh">Preço do kWh (R$)</label>
          <input
            id="precoKwh"
            type="number"
            min="0"
            step="0.0001"
            value={precoKwhInput}
            onChange={(e) => setPrecoKwhInput(e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="margemPadrao">Margem de lucro padrão (%)</label>
          <input
            id="margemPadrao"
            type="number"
            min="0"
            step="0.01"
            value={margemPadraoInput}
            onChange={(e) => setMargemPadraoInput(e.target.value)}
          />
        </div>
        <button type="submit" disabled={enviandoConfig}>
          {enviandoConfig ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
      {erroConfig && <p className="erro">{erroConfig}</p>}
      {sucessoConfig && <p className="sucesso">Configurações salvas!</p>}

      <h3>{editandoId ? "Editar máquina" : "Cadastrar máquina"}</h3>
      <form className="formulario" onSubmit={handleSubmit}>
        <div className="campo">
          <label htmlFor="modelo">Modelo</label>
          <select id="modelo" value={modeloSelecionado} onChange={(e) => selecionarModelo(e.target.value)}>
            <option value="">Selecione um modelo (opcional)</option>
            {MODELOS_MAQUINA.map((m) => (
              <option key={m.nome} value={m.nome}>
                {m.nome}
              </option>
            ))}
            <option value={OUTRA_MAQUINA}>{OUTRA_MAQUINA}</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="nome">Nome da máquina</label>
          <input id="nome" required value={form.nome} onChange={(e) => atualizarCampo("nome", e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor="potenciaWatts">Potência média (W)</label>
          <input
            id="potenciaWatts"
            required
            type="number"
            min="0"
            step="1"
            value={form.potenciaWatts}
            onChange={(e) => atualizarCampo("potenciaWatts", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="precoCompra">Preço de compra (R$)</label>
          <input
            id="precoCompra"
            required
            type="number"
            min="0"
            step="0.01"
            value={form.precoCompra}
            onChange={(e) => atualizarCampo("precoCompra", e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="vidaUtilHoras">Vida útil estimada (horas)</label>
          <input
            id="vidaUtilHoras"
            required
            type="number"
            min="0"
            step="1"
            value={form.vidaUtilHoras}
            onChange={(e) => atualizarCampo("vidaUtilHoras", e.target.value)}
          />
        </div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : editandoId ? "Salvar alterações" : "Cadastrar máquina"}
        </button>
        {editandoId && (
          <button type="button" className="botao-secundario" onClick={cancelarEdicao}>
            Cancelar
          </button>
        )}
      </form>
      <p className="dica-cadastro">
        A potência sugerida ao escolher um modelo é uma estimativa média da comunidade, não especificação oficial
        exata — varia com temperatura de bico, mesa aquecida e ambiente.
      </p>

      {erro && <p className="erro">{erro}</p>}

      <h3>Máquinas cadastradas</h3>
      {carregando ? (
        <p>Carregando...</p>
      ) : maquinas.length === 0 ? (
        <p>Nenhuma máquina cadastrada ainda.</p>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Potência</th>
              <th>Preço de compra</th>
              <th>Vida útil</th>
              <th>Depreciação/h</th>
              <th>Energia/h</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {maquinas.map((m) => {
              const depreciacaoHora = parseFloat(m.precoCompra) / parseFloat(m.vidaUtilHoras);
              const energiaHora = usuario.precoKwh
                ? (parseFloat(m.potenciaWatts) / 1000) * parseFloat(usuario.precoKwh)
                : null;

              return (
                <tr key={m.id}>
                  <td>{m.nome}</td>
                  <td>{parseFloat(m.potenciaWatts).toFixed(0)} W</td>
                  <td>R$ {parseFloat(m.precoCompra).toFixed(2)}</td>
                  <td>{parseFloat(m.vidaUtilHoras).toFixed(0)} h</td>
                  <td>R$ {depreciacaoHora.toFixed(4)}</td>
                  <td>{energiaHora !== null ? `R$ ${energiaHora.toFixed(4)}` : "—"}</td>
                  <td className="celula-acoes">
                    <button className="botao-secundario" onClick={() => iniciarEdicao(m)}>
                      Editar
                    </button>
                    <button className="botao-perigo" onClick={() => handleExcluir(m.id)}>
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
