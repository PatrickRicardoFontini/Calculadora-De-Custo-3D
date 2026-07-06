import { useState, type FormEvent } from "react";
import { login } from "../api/client";
import { salvarToken } from "../lib/auth";
import type { Usuario } from "../types";

interface LoginProps {
  aoAutenticar: (usuario: Usuario) => void;
  aoMudarParaRegistro: () => void;
}

export function Login({ aoAutenticar, aoMudarParaRegistro }: LoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const { token, usuario } = await login(email, senha);
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
        <h2>Entrar</h2>
        <form className="formulario formulario-auth" onSubmit={handleSubmit}>
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
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="botao-primario" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {erro && <p className="erro">{erro}</p>}

        <p className="troca-auth">
          Não tem conta?{" "}
          <button type="button" className="link-acao" onClick={aoMudarParaRegistro}>
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
}
