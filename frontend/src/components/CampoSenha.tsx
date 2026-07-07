import { useState } from "react";
import { calcularForcaSenha, TEXTO_FORCA_SENHA } from "../lib/forcaSenha";

interface CampoSenhaProps {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  mostrarForca?: boolean;
}

export function CampoSenha({
  id,
  label,
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  mostrarForca = false,
}: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const forca = mostrarForca && value ? calcularForcaSenha(value) : null;

  return (
    <div className="campo">
      <label htmlFor={id}>{label}</label>
      <div className="campo-senha-wrapper">
        <input
          id={id}
          type={visivel ? "text" : "password"}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="botao-visibilidade-senha"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          title={visivel ? "Esconder senha" : "Mostrar senha"}
        >
          {visivel ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
        </button>
      </div>
      {forca && (
        <div className={`indicador-forca-senha forca-${forca}`}>
          <div className="barra-forca-senha">
            <span />
            <span />
            <span />
          </div>
          <span className="badge-forca-senha">{TEXTO_FORCA_SENHA[forca]}</span>
        </div>
      )}
    </div>
  );
}

function IconeOlhoAberto() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconeOlhoFechado() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
