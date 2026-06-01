import { IJornadaStats, INoticia } from '../models/jornada.model';
import { ITopPerformer } from '../models/jugador.model';

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
