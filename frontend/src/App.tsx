import { useEffect, useState } from "react";
import { Estoque } from "./pages/Estoque";
import { Calculadora } from "./pages/Calculadora";
import { Orcamentos } from "./pages/Orcamentos";
import { Receita } from "./pages/Receita";
import { Maquinas } from "./pages/Maquinas";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { EsqueciSenha } from "./pages/EsqueciSenha";
import { RedefinirSenha } from "./pages/RedefinirSenha";
import { BoasVindas } from "./components/BoasVindas";
import { buscarUsuarioAtual, listarFilamentos, listarOrcamentos } from "./api/client";
import { limparToken, obterToken } from "./lib/auth";
import type { Usuario } from "./types";
import "./App.css";

type Aba = "estoque" | "calculadora" | "orcamentos" | "maquinas" | "receita";
type Tema = "light" | "dark";
type ModoAuth = "login" | "registro" | "esqueci-senha" | "redefinir-senha";

// O link do email de redefinição aponta pra /redefinir-senha?token=... de verdade —
// detecta esse caminho no primeiro carregamento pra abrir a tela certa direto
function obterModoAuthInicial(): ModoAuth {
  return window.location.pathname === "/redefinir-senha" ? "redefinir-senha" : "login";
}

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

// Chave de dispensa da mensagem de boas-vindas, por conta — sinal de "conta nova" é
// calculado (zero filamentos e zero orçamentos), não é um campo salvo no banco
function chaveBoasVindas(usuarioId: string): string {
  return `boasVindasVista_${usuarioId}`;
}

function App() {
  const [aba, setAba] = useState<Aba>("estoque");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [modoAuth, setModoAuth] = useState<ModoAuth>(obterModoAuthInicial);
  const [tema, setTema] = useState<Tema>(obterTemaInicial);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [mostrarBoasVindas, setMostrarBoasVindas] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
  }, [tema]);

  useEffect(() => {
    if (!usuario) return;
    if (localStorage.getItem(chaveBoasVindas(usuario.id))) return;

    Promise.all([listarFilamentos(), listarOrcamentos()])
      .then(([filamentos, orcamentos]) => {
        if (filamentos.length === 0 && orcamentos.length === 0) {
          setMostrarBoasVindas(true);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id]);

  function fecharBoasVindas() {
    if (usuario) {
      localStorage.setItem(chaveBoasVindas(usuario.id), "1");
    }
    setMostrarBoasVindas(false);
  }

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

  function voltarParaLogin() {
    // Limpa o caminho/query de /redefinir-senha?token=... pra um refresh não reabrir a tela
    window.history.replaceState({}, "", "/");
    setModoAuth("login");
  }

  if (verificando) {
    return <div className="tela-auth">Carregando...</div>;
  }

  if (!usuario) {
    if (modoAuth === "registro") {
      return <Registro aoAutenticar={setUsuario} aoMudarParaLogin={() => setModoAuth("login")} />;
    }
    if (modoAuth === "esqueci-senha") {
      return <EsqueciSenha aoVoltarParaLogin={() => setModoAuth("login")} />;
    }
    if (modoAuth === "redefinir-senha") {
      return <RedefinirSenha aoConcluir={voltarParaLogin} />;
    }
    return (
      <Login
        aoAutenticar={setUsuario}
        aoMudarParaRegistro={() => setModoAuth("registro")}
        aoMudarParaEsqueciSenha={() => setModoAuth("esqueci-senha")}
      />
    );
  }

  return (
    <div className="app-shell">
      {mostrarBoasVindas && <BoasVindas aoFechar={fecharBoasVindas} />}
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
