export interface ClueSection {
  key: string;
  title: string;
  start: number;
  end: number;
  description: string;
}

export const clueSections: ClueSection[] = [
  {
    key: "intro",
    title: "Intro",
    start: 1,
    end: 3,
    description: "El punto de partida del recorrido y las primeras señales de la historia.",
  },
  {
    key: "pista-1",
    title: "Pista 1",
    start: 4,
    end: 8,
    description: "Las primeras piezas empiezan a conectarse.",
  },
  {
    key: "pista-2",
    title: "Pista 2",
    start: 9,
    end: 14,
    description: "Nuevos detalles amplían el misterio y cambian la perspectiva.",
  },
  {
    key: "pista-3",
    title: "Pista 3",
    start: 15,
    end: 19,
    description: "Las señales anteriores comienzan a revelar un patrón.",
  },
  {
    key: "pista-4",
    title: "Pista 4",
    start: 20,
    end: 30,
    description: "El recorrido se profundiza y las conexiones se vuelven más claras.",
  },
  {
    key: "pista-5",
    title: "Pista 5",
    start: 31,
    end: 39,
    description: "Las pistas acumuladas conducen hacia las revelaciones más recientes.",
  },
];

export const normalizeClueTag = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
