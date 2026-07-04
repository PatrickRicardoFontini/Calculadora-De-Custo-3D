import { useState } from "react";
import { Estoque } from "./pages/Estoque";
import { Calculadora } from "./pages/Calculadora";
import { Orcamentos } from "./pages/Orcamentos";
import { Receita } from "./pages/Receita";
import "./App.css";

type Aba = "estoque" | "calculadora" | "orcamentos" | "receita";

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
