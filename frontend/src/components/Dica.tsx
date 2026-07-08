import { useState } from "react";

interface DicaProps {
  texto: string;
}

export function Dica({ texto }: DicaProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <span className="dica-campo">
      <button
        type="button"
        className="botao-dica"
        onMouseEnter={() => setVisivel(true)}
        onMouseLeave={() => setVisivel(false)}
        onClick={() => setVisivel((atual) => !atual)}
        onBlur={() => setVisivel(false)}
        aria-label="Ajuda"
      >
        ?
      </button>
      {visivel && (
        <span className="balao-dica" role="tooltip">
          {texto}
        </span>
      )}
    </span>
  );
}
