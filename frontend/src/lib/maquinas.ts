export interface ModeloMaquina {
  nome: string;
  potenciaWatts: number;
}

export const MODELOS_MAQUINA: ModeloMaquina[] = [
  { nome: "Creality Ender 3 / Ender 3 Pro", potenciaWatts: 125 },
  { nome: "Creality Ender 3 V2 / Neo", potenciaWatts: 130 },
  { nome: "Creality Ender 3 S1 / S1 Pro", potenciaWatts: 150 },
  { nome: "Creality K1 / K1C", potenciaWatts: 180 },
  { nome: "Bambu Lab A1 Mini", potenciaWatts: 90 },
  { nome: "Bambu Lab A1", potenciaWatts: 120 },
  { nome: "Bambu Lab P1P / P1S", potenciaWatts: 150 },
  { nome: "Bambu Lab X1 Carbon", potenciaWatts: 190 },
  { nome: "Anycubic Kobra 2", potenciaWatts: 150 },
  { nome: "Anycubic Kobra 3", potenciaWatts: 150 },
  { nome: "Elegoo Neptune 3", potenciaWatts: 120 },
  { nome: "Elegoo Neptune 4", potenciaWatts: 130 },
  { nome: "Prusa i3 MK3S+", potenciaWatts: 120 },
  { nome: "Prusa MK4", potenciaWatts: 130 },
];

export const OUTRA_MAQUINA = "Outra (digitar manualmente)";

export const VIDA_UTIL_SUGERIDA_HORAS = 5000;
