export interface IGoleadorJornada {
  id: string;
  nombre: string;
  equipo: string;
  posicion: string;
  goles: number;
  asistencias: number;
}

export interface ITopPerformer {
  id: string;
  nombre: string;
  equipo: string;
  posicion: string;
  puntos: number;
  goles: number;
  asistencias: number;
  esCaptain: boolean;
}
