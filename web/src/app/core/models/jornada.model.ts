export interface IJornadaStats {
  numero: number;
  puntos: number;
  rankGlobal: number;
  rankGlobalDelta: number;
  posicionLiga: string;
}

export interface INoticia {
  tipo: string;
  icono: string;
  titulo: string;
  descripcion: string;
}

export interface IJornada {
  id: string;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}
