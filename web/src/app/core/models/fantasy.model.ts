export interface IJugadorFantasy {
  id: string;
  nombre: string;
  equipo: string;
  posicion: 'portero' | 'defensa' | 'centrocampista' | 'delantero';
  puntuacionJornada: number;
  puntuacionTotal: number;
  precio: number;
  estado: 'disponible' | 'lesionado' | 'sancionado';
  titular: boolean;
}

export interface IEquipoFantasy {
  id: string;
  nombre: string;
  propietario: string;
  puntuacionTotal: number;
  puntuacionJornada: number;
  posicionLiga: number;
  presupuesto: number;
  jugadores: IJugadorFantasy[];
}

export interface IClasificacionFantasy {
  posicion: number;
  equipo: string;
  propietario: string;
  puntos: number;
  pj: number;
  esUsuario?: boolean;
}
