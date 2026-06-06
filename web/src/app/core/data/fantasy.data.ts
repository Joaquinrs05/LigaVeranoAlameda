import { IEquipoFantasy, IClasificacionFantasy } from '../models/fantasy.model';

export const MI_EQUIPO_FANTASY: IEquipoFantasy = {
  id: 'user-1',
  nombre: 'Los Cañoneros',
  propietario: 'Tú',
  puntuacionTotal: 487,
  puntuacionJornada: 54,
  posicionLiga: 2,
  presupuesto: 12.5,
  jugadores: [
    // Titulares — fútbol 7 (1-2-3-1)
    { id: 'j1',  nombre: 'Marcos García',   equipo: 'FC Alameda',       posicion: 'portero',        puntuacionJornada: 8,  puntuacionTotal: 74,  precio: 5.5,  estado: 'disponible', titular: true  },
    { id: 'j2',  nombre: 'Rubén Torres',    equipo: 'Los Galácticos',   posicion: 'defensa',        puntuacionJornada: 6,  puntuacionTotal: 58,  precio: 4.5,  estado: 'disponible', titular: true  },
    { id: 'j3',  nombre: 'Adrián López',    equipo: 'Inter Alameda',    posicion: 'defensa',        puntuacionJornada: 4,  puntuacionTotal: 43,  precio: 4.0,  estado: 'sancionado', titular: true  },
    { id: 'j4',  nombre: 'Pablo Herrera',   equipo: 'Atleti Verde',     posicion: 'centrocampista', puntuacionJornada: 9,  puntuacionTotal: 81,  precio: 7.0,  estado: 'disponible', titular: true  },
    { id: 'j5',  nombre: 'Iván Molina',     equipo: 'Los Galácticos',   posicion: 'centrocampista', puntuacionJornada: 7,  puntuacionTotal: 66,  precio: 6.5,  estado: 'disponible', titular: true  },
    { id: 'j6',  nombre: 'Carlos Ramos',    equipo: 'Thundercats FC',   posicion: 'centrocampista', puntuacionJornada: 5,  puntuacionTotal: 51,  precio: 5.0,  estado: 'disponible', titular: true  },
    { id: 'j7',  nombre: 'Diego Castillo',  equipo: 'Atleti Verde',     posicion: 'delantero',      puntuacionJornada: 14, puntuacionTotal: 102, precio: 10.0, estado: 'disponible', titular: true  },
    // Reservas
    { id: 'j8',  nombre: 'Óscar Navarro',   equipo: 'Real Barrio',      posicion: 'portero',        puntuacionJornada: 2,  puntuacionTotal: 18,  precio: 3.0,  estado: 'disponible', titular: false },
    { id: 'j9',  nombre: 'Toni Ferrer',     equipo: 'Sporting Alameda', posicion: 'defensa',        puntuacionJornada: 3,  puntuacionTotal: 26,  precio: 3.0,  estado: 'disponible', titular: false },
    { id: 'j10', nombre: 'Alejandro Ruiz',  equipo: 'Inter Alameda',    posicion: 'delantero',      puntuacionJornada: 12, puntuacionTotal: 98,  precio: 9.5,  estado: 'lesionado',  titular: false },
    { id: 'j11', nombre: 'Fran Soler',      equipo: 'Los Galácticos',   posicion: 'delantero',      puntuacionJornada: 0,  puntuacionTotal: 44,  precio: 6.0,  estado: 'disponible', titular: false },
  ],
};

export const CLASIFICACION_FANTASY: IClasificacionFantasy[] = [
  { posicion: 1, equipo: 'El Barca de Richi',   propietario: 'Ricardo',  puntos: 521, pj: 12 },
  { posicion: 2, equipo: 'Los Cañoneros',        propietario: 'Tú',       puntos: 487, pj: 12, esUsuario: true },
  { posicion: 3, equipo: 'Crack Team',           propietario: 'Marcos',   puntos: 462, pj: 12 },
  { posicion: 4, equipo: 'La Máquina',           propietario: 'Álvaro',   puntos: 439, pj: 12 },
  { posicion: 5, equipo: 'Galácticos 2.0',       propietario: 'Javi',     puntos: 418, pj: 12 },
  { posicion: 6, equipo: 'Los Invencibles',      propietario: 'Pedro',    puntos: 395, pj: 12 },
  { posicion: 7, equipo: 'FC Torpedo',           propietario: 'Sergio',   puntos: 371, pj: 12 },
  { posicion: 8, equipo: 'Meteoros FC',          propietario: 'Nacho',    puntos: 348, pj: 12 },
];
