import { useEffect, useState } from "react";
import { Estoque } from "./pages/Estoque";
import { Calculadora } from "./pages/Calculadora";
import { Orcamentos } from "./pages/Orcamentos";
import { Receita } from "./pages/Receita";
import { Maquinas } from "./pages/Maquinas";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { buscarUsuarioAtual } from "./api/client";
import { limparToken, obterToken } from "./lib/auth";
import type { Usuario } from "./types";
import "./App.css";

type Aba = "estoque" | "calculadora" | "orcamentos" | "maquinas" | "receita";
type Tema = "light" | "dark";

const ITENS_NAV: { aba: Aba; rotulo: string }[] = [
  { aba: "estoque", rotulo: "Estoque" },
  { aba: "calculadora", rotulo: "Calculadora" },
  { aba: "orcamentos", rotulo: "Orçamentos" },
  { aba: "maquinas", rotulo: "Máquinas" },
  { aba: "receita", rotulo: "Receita" },
];

function obterTemaInicial(): Tema {
  const salvo = localStorage.getItem("tema");
  if (salvo === "light" || salvo === "dark") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function App() {
  const [aba, setAba] = useState<Aba>("estoque");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [modoAuth, setModoAuth] = useState<"login" | "registro">("login");
  const [tema, setTema] = useState<Tema>(obterTemaInicial);
  const [gavetaAberta, setGavetaAberta] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
  }, [tema]);

  useEffect(() => {
    document.body.style.overflow = gavetaAberta ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [gavetaAberta]);

  function selecionarAba(item: Aba) {
    setAba(item);
    setGavetaAberta(false);
  }

  function alternarTema() {
    setTema((atual) => {
      const novo: Tema = atual === "light" ? "dark" : "light";
      localStorage.setItem("tema", novo);
      return novo;
    });
  }

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
    <div className="app-shell">
      <header className="barra-mobile">
        <button className="botao-hamburguer" onClick={() => setGavetaAberta(true)} aria-label="Abrir menu">
          <span />
          <span />
          <span />
        </button>
        <span className="titulo-barra-mobile">{ITENS_NAV.find((item) => item.aba === aba)?.rotulo}</span>
      </header>

      {gavetaAberta && <div className="overlay-gaveta" onClick={() => setGavetaAberta(false)} />}

      <aside className={gavetaAberta ? "sidebar sidebar-aberta" : "sidebar"}>
        <div className="logo">calc3d</div>
        <nav className="nav-principal">
          {ITENS_NAV.map((item) => (
            <button
              key={item.aba}
              className={aba === item.aba ? "nav-item nav-item-ativo" : "nav-item"}
              onClick={() => selecionarAba(item.aba)}
            >
              {item.rotulo}
            </button>
          ))}
        </nav>
        <div className="sidebar-rodape">
          <span className="usuario-sidebar">{usuario.nome}</span>
          <button className="nav-item" onClick={alternarTema}>
            {tema === "dark" ? "Tema claro" : "Tema escuro"}
          </button>
          <button className="nav-item" onClick={handleSair}>
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo">
        {aba === "estoque" && <Estoque />}
        {aba === "calculadora" && <Calculadora usuario={usuario} aoSalvarOrcamento={() => setAba("orcamentos")} />}
        {aba === "orcamentos" && <Orcamentos />}
        {aba === "maquinas" && <Maquinas usuario={usuario} aoAtualizarUsuario={setUsuario} />}
        {aba === "receita" && <Receita />}
      </main>
    </div>
  );
}

export default App;
