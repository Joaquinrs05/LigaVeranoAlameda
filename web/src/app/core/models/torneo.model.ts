export type FaseTorneo = 'liguilla' | 'cuartos' | 'semis' | 'final';

export interface ICruce {
  id: string;
  equipoLocal: string | null;
  equipoVisitante: string | null;
  golesLocal: number | null;
  golesVisitante: number | null;
  estado: 'pendiente' | 'live' | 'finished';
}

export interface IFaseTorneo {
  tipo: FaseTorneo;
  label: string;
  cruces: ICruce[];
}
