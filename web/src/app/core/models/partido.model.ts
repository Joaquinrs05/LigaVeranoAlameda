export type EstadoPartido = 'live' | 'upcoming' | 'finished';

export interface IPartido {
  id: string;
  equipoLocal: string;
  abrevLocal: string;
  equipoVisitante: string;
  abrevVisitante: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  minuto: string | null;
  estado: EstadoPartido;
  horaInicio: string | null;
}
