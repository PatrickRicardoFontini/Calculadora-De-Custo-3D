import { useState, type FormEvent } from "react";
import { esqueciSenha } from "../api/client";

interface EsqueciSenhaProps {
  aoVoltarParaLogin: () => void;
}

export function EsqueciSenha({ aoVoltarParaLogin }: EsqueciSenhaProps) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await esqueciSenha(email);
      setMensagem(resposta.mensagem);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="tela-auth">
      <div className="cartao-auth">
        <h2>Esqueci minha senha</h2>

        {mensagem ? (
          <p>{mensagem}</p>
        ) : (
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
            <button type="submit" className="botao-primario" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link de redefinição"}
            </button>
          </form>
        )}

        {erro && <p className="erro">{erro}</p>}

        <p className="troca-auth">
          <button type="button" className="link-acao" onClick={aoVoltarParaLogin}>
            Voltar pro login
          </button>
        </p>
      </div>
    </div>
  );
}
