export interface IEntrenadorEquipo {
  id: string;
  nombre: string;
  foto_url: string | null;
  entrenador_id: string;
}

export interface IEntrenadorJugador {
  id: string;
  nombre: string;
  dorsal: number | null;
  posicion: string;
  foto_url: string | null;
  activo: boolean;
  es_titular: boolean;
}
