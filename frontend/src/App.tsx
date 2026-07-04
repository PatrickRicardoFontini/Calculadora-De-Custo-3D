import { useEffect, useState } from "react";
import { Estoque } from "./pages/Estoque";
import { Calculadora } from "./pages/Calculadora";
import { Orcamentos } from "./pages/Orcamentos";
import { Receita } from "./pages/Receita";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { buscarUsuarioAtual } from "./api/client";
import { limparToken, obterToken } from "./lib/auth";
import type { Usuario } from "./types";
import "./App.css";

type Aba = "estoque" | "calculadora" | "orcamentos" | "receita";

function App() {
  const [aba, setAba] = useState<Aba>("estoque");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [modoAuth, setModoAuth] = useState<"login" | "registro">("login");

  useEffect(() => {
    function aoDeslogar() {
      setUsuario(null);
    }
    window.addEventListener("nao-autenticado", aoDeslogar);
    return () => window.removeEventListener("nao-autenticado", aoDeslogar);
  }, []);

  useEffect(() => {
    if (!obterToken()) {
      setVerificando(false);
      return;
    }
    buscarUsuarioAtual()
      .then(setUsuario)
      .catch(() => {})
      .finally(() => setVerificando(false));
  }, []);

  function handleSair() {
    limparToken();
    setUsuario(null);
    setAba("estoque");
  }

  if (verificando) {
    return <div className="tela-auth">Carregando...</div>;
  }

  if (!usuario) {
    return modoAuth === "login" ? (
      <Login aoAutenticar={setUsuario} aoMudarParaRegistro={() => setModoAuth("registro")} />
    ) : (
      <Registro aoAutenticar={setUsuario} aoMudarParaLogin={() => setModoAuth("login")} />
    );
  }

  return (
    <div className="app">
      <header className="cabecalho">
        <div className="cabecalho-topo">
          <h1>Calculadora de Custos - Impressão 3D</h1>
          <div className="usuario-logado">
            <span>{usuario.nome}</span>
            <button className="botao-secundario" onClick={handleSair}>
              Sair
            </button>
          </div>
        </div>
        <nav className="abas">
          <button className={aba === "estoque" ? "aba-ativa" : ""} onClick={() => setAba("estoque")}>
            Estoque
          </button>
          <button className={aba === "calculadora" ? "aba-ativa" : ""} onClick={() => setAba("calculadora")}>
            Calculadora
          </button>
          <button className={aba === "orcamentos" ? "aba-ativa" : ""} onClick={() => setAba("orcamentos")}>
            Orçamentos
          </button>
          <button className={aba === "receita" ? "aba-ativa" : ""} onClick={() => setAba("receita")}>
            Receita
          </button>
        </nav>
      </header>
      <main>
        {aba === "estoque" && <Estoque />}
        {aba === "calculadora" && <Calculadora aoSalvarOrcamento={() => setAba("orcamentos")} />}
        {aba === "orcamentos" && <Orcamentos />}
        {aba === "receita" && <Receita />}
      </main>
    </div>
  );
}

export default App;
