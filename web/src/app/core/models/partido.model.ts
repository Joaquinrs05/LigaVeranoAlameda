export type EstadoPartido = 'live' | 'upcoming' | 'finished';

export interface IPartido {
  id: string;
  equipoLocal: string;
  abrevLocal: string;
  colorLocal: string;
  fotoLocal?: string;
  equipoVisitante: string;
  abrevVisitante: string;
  colorVisitante: string;
  fotoVisitante?: string;
  golesLocal: number | null;
  golesVisitante: number | null;
  minuto: string | null;
  estado: EstadoPartido;
  horaInicio: string | null;
  jornadaId?: string | null;
}
