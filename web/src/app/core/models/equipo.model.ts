export interface IJugadorEquipo {
  id: string;
  nombre: string;
  dorsal: number;
  posicion: 'Portero' | 'Cierre' | 'Ala' | 'Pivot';
  goles: number;
  asistencias: number;
}

export interface IEquipoStats {
  pj: number;
  v:  number;
  e:  number;
  d:  number;
  gf: number;
  gc: number;
  pts: number;
}

export interface IEquipo {
  id: string;
  nombre: string;
  abrev: string;
  color: string;
  posicion: number;
  stats: IEquipoStats;
  jugadores: IJugadorEquipo[];
}
