import { useEffect, useState } from "react";
import { listarReceitaMensal } from "../api/client";
import type { ReceitaMensal } from "../types";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatarMes(mes: string): string {
  const [ano, mesNum] = mes.split("-").map(Number);
  return `${MESES[mesNum - 1]} de ${ano}`;
}

function mesAtualChave(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

export function Receita() {
  const [dados, setDados] = useState<ReceitaMensal[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarReceitaMensal()
      .then(setDados)
      .catch((err) => setErro((err as Error).message))
      .finally(() => setCarregando(false));
  }, []);

  const chaveMesAtual = mesAtualChave();
  const mesAtual = dados.find((d) => d.mes === chaveMesAtual) ?? {
    mes: chaveMesAtual,
    totalVendas: 0,
    quantidadeVendas: 0,
  };
  const mesesAnteriores = dados.filter((d) => d.mes !== chaveMesAtual);

  return (
    <div className="pagina">
      <h2>Receita</h2>

      {erro && <p className="erro">{erro}</p>}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="destaque-mes-atual">
            <span className="rotulo-destaque">{formatarMes(mesAtual.mes)}</span>
            <span className="valor-destaque">R$ {mesAtual.totalVendas.toFixed(2)}</span>
            <span className="detalhe-secundario">
              {mesAtual.quantidadeVendas} {mesAtual.quantidadeVendas === 1 ? "venda" : "vendas"}
            </span>
          </div>

          <h3>Meses anteriores</h3>
          {mesesAnteriores.length === 0 ? (
            <p>Nenhuma venda registrada em meses anteriores.</p>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Total faturado</th>
                  <th>Vendas</th>
                </tr>
              </thead>
              <tbody>
                {mesesAnteriores.map((m) => (
                  <tr key={m.mes}>
                    <td>{formatarMes(m.mes)}</td>
                    <td>R$ {m.totalVendas.toFixed(2)}</td>
                    <td>{m.quantidadeVendas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
