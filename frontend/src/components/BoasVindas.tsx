interface BoasVindasProps {
  aoFechar: () => void;
}

export function BoasVindas({ aoFechar }: BoasVindasProps) {
  return (
    <div className="overlay-modal" onClick={aoFechar}>
      <div className="modal-boas-vindas" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="botao-fechar-modal" onClick={aoFechar} aria-label="Fechar">
          ×
        </button>
        <h2>Bem-vindo à calc3d</h2>
        <p>
          Essa calculadora ajuda você a precificar peças impressas em 3D considerando o custo real de filamento,
          energia e desgaste da máquina — e organiza seus orçamentos e vendas num só lugar.
        </p>
        <p>
          <strong>Pra começar:</strong>
        </p>
        <ol>
          <li>
            Cadastre pelo menos um filamento na aba Estoque — esse é o único passo obrigatório antes de calcular um
            orçamento.
          </li>
          <li>
            Cadastrar uma máquina na aba Máquinas é recomendado (preenche energia e depreciação sozinho), mas não é
            obrigatório — dá pra preencher esses valores na mão.
          </li>
        </ol>
        <button type="button" className="botao-primario" onClick={aoFechar}>
          Entendi, vamos começar
        </button>
      </div>
    </div>
  );
}
