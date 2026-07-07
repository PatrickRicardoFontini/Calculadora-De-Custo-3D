import { useState, type FormEvent } from "react";
import { redefinirSenha } from "../api/client";
import { CampoSenha } from "../components/CampoSenha";

interface RedefinirSenhaProps {
  aoConcluir: () => void;
}

export function RedefinirSenha({ aoConcluir }: RedefinirSenhaProps) {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") ?? "");
  const [novaSenha, setNovaSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await redefinirSenha(token, novaSenha);
      setConcluido(true);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (!token) {
    return (
      <div className="tela-auth">
        <div className="cartao-auth">
          <h2>Redefinir senha</h2>
          <p className="erro">Link inválido ou incompleto. Peça um novo link em "Esqueci minha senha".</p>
          <p className="troca-auth">
            <button type="button" className="link-acao" onClick={aoConcluir}>
              Voltar pro login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tela-auth">
      <div className="cartao-auth">
        <h2>Redefinir senha</h2>

        {concluido ? (
          <>
            <p>Senha redefinida com sucesso. Já pode entrar com a senha nova.</p>
            <button type="button" className="botao-primario" onClick={aoConcluir}>
              Ir para o login
            </button>
          </>
        ) : (
          <form className="formulario formulario-auth" onSubmit={handleSubmit}>
            <CampoSenha
              id="novaSenha"
              label="Nova senha (mínimo 8 caracteres)"
              value={novaSenha}
              onChange={setNovaSenha}
              required
              minLength={8}
              autoComplete="new-password"
              mostrarForca
            />
            <button type="submit" className="botao-primario" disabled={enviando}>
              {enviando ? "Redefinindo..." : "Redefinir senha"}
            </button>
            {erro && <p className="erro">{erro}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
