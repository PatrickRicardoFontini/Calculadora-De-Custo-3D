import { useState, type FormEvent } from "react";
import { registrar } from "../api/client";
import { salvarToken } from "../lib/auth";
import { CampoSenha } from "../components/CampoSenha";
import type { Usuario } from "../types";

interface RegistroProps {
  aoAutenticar: (usuario: Usuario) => void;
  aoMudarParaLogin: () => void;
}

export function Registro({ aoAutenticar, aoMudarParaLogin }: RegistroProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const { token, usuario } = await registrar(nome, email, senha);
      salvarToken(token);
      aoAutenticar(usuario);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-auth">
      <div className="cartao-auth">
        <h2>Criar conta</h2>
        <form className="formulario formulario-auth" onSubmit={handleSubmit}>
          <div className="campo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <CampoSenha
            id="senha"
            label="Senha (mínimo 8 caracteres)"
            value={senha}
            onChange={setSenha}
            required
            minLength={8}
            autoComplete="new-password"
            mostrarForca
          />
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        {erro && <p className="erro">{erro}</p>}

        <p className="troca-auth">
          Já tem conta?{" "}
          <button type="button" className="link-acao" onClick={aoMudarParaLogin}>
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}
