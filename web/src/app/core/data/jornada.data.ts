import { IJornadaStats, INoticia } from '../models/jornada.model';
import { ITopPerformer, IGoleadorJornada } from '../models/jugador.model';

export const JORNADA_STATS: IJornadaStats = {
  numero: 12,
  puntos: 84,
  rankGlobal: 14502,
  rankGlobalDelta: 1200,
  posicionLiga: '2º',
};

export const NOTICIA_BREAKING: INoticia = {
  tipo: 'Parte Médico',
  icono: 'medical_services',
  titulo: 'El delantero estrella es baja por 3 semanas tras una colisión',
  descripcion: 'Duro golpe para los managers fantasy. El máximo goleador de la liga sufre un esguince de tobillo en el partido de copa. Asegúrate de tener el banquillo preparado para esta jornada.',
};

export const GOLEADORES_JORNADA: IGoleadorJornada[] = [
  { id: '1', nombre: 'M. García',   equipo: 'FC Alameda',     posicion: 'MED', goles: 2, asistencias: 1 },
  { id: '2', nombre: 'K. Santos',   equipo: 'Inter Alameda',  posicion: 'DEL', goles: 2, asistencias: 0 },
  { id: '3', nombre: 'R. Blanco',   equipo: 'La Vecindad',    posicion: 'DEL', goles: 2, asistencias: 0 },
  { id: '4', nombre: 'L. Serrano',  equipo: 'Los Galácticos', posicion: 'MED', goles: 1, asistencias: 1 },
  { id: '5', nombre: 'P. Campos',   equipo: 'Élite FC',       posicion: 'DEL', goles: 1, asistencias: 1 },
];

export const TOP_PERFORMERS: ITopPerformer[] = [
  {
    id: '1',
    nombre: 'M. García',
    equipo: 'FC Alameda',
    posicion: 'MED',
    puntos: 24,
    goles: 2,
    asistencias: 1,
    esCaptain: true,
  },
  {
    id: '2',
    nombre: 'J. Martínez',
    equipo: 'Los Galácticos',
    posicion: 'DEL',
    puntos: 12,
    goles: 1,
    asistencias: 0,
    esCaptain: false,
  },
];
