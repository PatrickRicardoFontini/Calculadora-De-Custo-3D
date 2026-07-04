import { useEffect, useState } from "react";
import { listarReceitaMensal, listarVendasDoMes } from "../api/client";
import type { ReceitaMensal, VendaDoMes } from "../types";

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

  const [mesSelecionado, setMesSelecionado] = useState(mesAtualChave());
  const [vendas, setVendas] = useState<VendaDoMes[]>([]);
  const [carregandoVendas, setCarregandoVendas] = useState(true);
  const [erroVendas, setErroVendas] = useState<string | null>(null);

  useEffect(() => {
    listarReceitaMensal()
      .then(setDados)
      .catch((err) => setErro((err as Error).message))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    setCarregandoVendas(true);
    listarVendasDoMes(mesSelecionado)
      .then(setVendas)
      .catch((err) => setErroVendas((err as Error).message))
      .finally(() => setCarregandoVendas(false));
  }, [mesSelecionado]);

  const chaveMesAtual = mesAtualChave();
  const mesAtual = dados.find((d) => d.mes === chaveMesAtual) ?? {
    mes: chaveMesAtual,
    totalVendas: 0,
    quantidadeVendas: 0,
  };
  const mesesAnteriores = dados.filter((d) => d.mes !== chaveMesAtual);

  const opcoesMes = Array.from(new Set([chaveMesAtual, ...dados.map((d) => d.mes)])).sort((a, b) =>
    a < b ? 1 : -1
  );

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

          <h3 className="titulo-historico">Histórico de vendas</h3>
          <div className="campo campo-seletor-mes">
            <label htmlFor="mesSelecionado">Mês</label>
            <select id="mesSelecionado" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)}>
              {opcoesMes.map((mes) => (
                <option key={mes} value={mes}>
                  {formatarMes(mes)}
                </option>
              ))}
            </select>
          </div>

          {erroVendas && <p className="erro">{erroVendas}</p>}

          {carregandoVendas ? (
            <p>Carregando vendas...</p>
          ) : vendas.length === 0 ? (
            <p>Nenhuma venda registrada em {formatarMes(mesSelecionado)}.</p>
          ) : (
            <table className="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Filamento</th>
                  <th>Peso</th>
                  <th>Horas</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr key={v.id}>
                    <td>{new Date(v.dataVenda).toLocaleString("pt-BR")}</td>
                    <td>{v.clienteNome}</td>
                    <td>
                      {v.filamentoTipo} {v.filamentoCor}
                      {v.filamentoMarca ? ` (${v.filamentoMarca})` : ""}
                    </td>
                    <td>{v.pesoUsadoG.toFixed(0)} g</td>
                    <td>{v.horasImpressao.toFixed(1)} h</td>
                    <td>
                      R$ {v.valorFinal.toFixed(2)}
                      {v.valorFinal !== v.valorCalculado && (
                        <span className="detalhe-secundario"> (calculado: R$ {v.valorCalculado.toFixed(2)})</span>
                      )}
                    </td>
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
