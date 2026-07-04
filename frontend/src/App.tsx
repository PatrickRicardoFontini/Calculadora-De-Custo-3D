import { useState } from "react";
import { Estoque } from "./pages/Estoque";
import { Calculadora } from "./pages/Calculadora";
import "./App.css";

type Aba = "estoque" | "calculadora";

function App() {
  const [aba, setAba] = useState<Aba>("estoque");

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>Calculadora de Custos - Impressão 3D</h1>
        <nav className="abas">
          <button className={aba === "estoque" ? "aba-ativa" : ""} onClick={() => setAba("estoque")}>
            Estoque
          </button>
          <button className={aba === "calculadora" ? "aba-ativa" : ""} onClick={() => setAba("calculadora")}>
            Calculadora
          </button>
        </nav>
      </header>
      <main>{aba === "estoque" ? <Estoque /> : <Calculadora />}</main>
    </div>
  );
}

export default App;
