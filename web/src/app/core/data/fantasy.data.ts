import { IEquipoFantasy, IClasificacionFantasy, IJugadorFantasy } from '../models/fantasy.model';

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

export const CATALOGO_MERCADO: IJugadorFantasy[] = [
  // FC Alameda
  { id: 'm1',  nombre: 'Sergio Blanco',      equipo: 'FC Alameda',       posicion: 'portero',        puntuacionJornada: 6,  puntuacionTotal: 52,  precio: 4.5,  estado: 'disponible', titular: false },
  { id: 'm2',  nombre: 'Javier Molina',      equipo: 'FC Alameda',       posicion: 'defensa',        puntuacionJornada: 4,  puntuacionTotal: 38,  precio: 3.5,  estado: 'disponible', titular: false },
  { id: 'm3',  nombre: 'Miguel Ángel Soto',  equipo: 'FC Alameda',       posicion: 'centrocampista', puntuacionJornada: 8,  puntuacionTotal: 71,  precio: 6.5,  estado: 'disponible', titular: false },
  { id: 'm4',  nombre: 'Roberto Jiménez',    equipo: 'FC Alameda',       posicion: 'delantero',      puntuacionJornada: 11, puntuacionTotal: 89,  precio: 8.5,  estado: 'lesionado',  titular: false },
  // Los Galácticos
  { id: 'm5',  nombre: 'Eduardo Vega',       equipo: 'Los Galácticos',   posicion: 'portero',        puntuacionJornada: 7,  puntuacionTotal: 61,  precio: 5.0,  estado: 'disponible', titular: false },
  { id: 'm6',  nombre: 'Samuel Ortega',      equipo: 'Los Galácticos',   posicion: 'defensa',        puntuacionJornada: 5,  puntuacionTotal: 44,  precio: 4.0,  estado: 'disponible', titular: false },
  { id: 'm7',  nombre: 'Tomás Delgado',      equipo: 'Los Galácticos',   posicion: 'centrocampista', puntuacionJornada: 9,  puntuacionTotal: 78,  precio: 7.0,  estado: 'sancionado', titular: false },
  { id: 'm8',  nombre: 'Cristóbal Nieto',    equipo: 'Los Galácticos',   posicion: 'delantero',      puntuacionJornada: 10, puntuacionTotal: 84,  precio: 8.0,  estado: 'disponible', titular: false },
  // Inter Alameda
  { id: 'm9',  nombre: 'Francisco Reyes',    equipo: 'Inter Alameda',    posicion: 'portero',        puntuacionJornada: 3,  puntuacionTotal: 29,  precio: 3.0,  estado: 'disponible', titular: false },
  { id: 'm10', nombre: 'Luis Cano',          equipo: 'Inter Alameda',    posicion: 'defensa',        puntuacionJornada: 6,  puntuacionTotal: 54,  precio: 4.5,  estado: 'disponible', titular: false },
  { id: 'm11', nombre: 'Andrés Mora',        equipo: 'Inter Alameda',    posicion: 'centrocampista', puntuacionJornada: 7,  puntuacionTotal: 63,  precio: 5.5,  estado: 'disponible', titular: false },
  { id: 'm12', nombre: 'Daniel Santos',      equipo: 'Inter Alameda',    posicion: 'delantero',      puntuacionJornada: 13, puntuacionTotal: 107, precio: 11.0, estado: 'disponible', titular: false },
  // Atleti Verde
  { id: 'm13', nombre: 'Guillermo Paz',      equipo: 'Atleti Verde',     posicion: 'portero',        puntuacionJornada: 5,  puntuacionTotal: 43,  precio: 3.5,  estado: 'disponible', titular: false },
  { id: 'm14', nombre: 'Álvaro Medina',      equipo: 'Atleti Verde',     posicion: 'defensa',        puntuacionJornada: 7,  puntuacionTotal: 62,  precio: 5.5,  estado: 'disponible', titular: false },
  { id: 'm15', nombre: 'Héctor Fuentes',     equipo: 'Atleti Verde',     posicion: 'centrocampista', puntuacionJornada: 10, puntuacionTotal: 87,  precio: 8.0,  estado: 'disponible', titular: false },
  { id: 'm16', nombre: 'Víctor Cruz',        equipo: 'Atleti Verde',     posicion: 'delantero',      puntuacionJornada: 9,  puntuacionTotal: 76,  precio: 7.5,  estado: 'disponible', titular: false },
  // Real Barrio
  { id: 'm17', nombre: 'Rafael Iglesias',    equipo: 'Real Barrio',      posicion: 'portero',        puntuacionJornada: 4,  puntuacionTotal: 35,  precio: 3.0,  estado: 'disponible', titular: false },
  { id: 'm18', nombre: 'Ángel Romero',       equipo: 'Real Barrio',      posicion: 'defensa',        puntuacionJornada: 4,  puntuacionTotal: 37,  precio: 3.5,  estado: 'disponible', titular: false },
  { id: 'm19', nombre: 'Pedro Alonso',       equipo: 'Real Barrio',      posicion: 'centrocampista', puntuacionJornada: 6,  puntuacionTotal: 55,  precio: 5.0,  estado: 'disponible', titular: false },
  { id: 'm20', nombre: 'Germán Lara',        equipo: 'Real Barrio',      posicion: 'delantero',      puntuacionJornada: 8,  puntuacionTotal: 68,  precio: 6.5,  estado: 'lesionado',  titular: false },
  // Sporting Alameda
  { id: 'm21', nombre: 'Manuel Flores',      equipo: 'Sporting Alameda', posicion: 'portero',        puntuacionJornada: 4,  puntuacionTotal: 35,  precio: 3.0,  estado: 'disponible', titular: false },
  { id: 'm22', nombre: 'Cristian Vargas',    equipo: 'Sporting Alameda', posicion: 'defensa',        puntuacionJornada: 5,  puntuacionTotal: 46,  precio: 4.0,  estado: 'disponible', titular: false },
  { id: 'm23', nombre: 'Raúl Guerrero',      equipo: 'Sporting Alameda', posicion: 'centrocampista', puntuacionJornada: 8,  puntuacionTotal: 69,  precio: 6.0,  estado: 'sancionado', titular: false },
  { id: 'm24', nombre: 'Borja Giménez',      equipo: 'Sporting Alameda', posicion: 'delantero',      puntuacionJornada: 7,  puntuacionTotal: 59,  precio: 5.5,  estado: 'disponible', titular: false },
  // Thundercats FC
  { id: 'm25', nombre: 'Ignacio Peña',       equipo: 'Thundercats FC',   posicion: 'defensa',        puntuacionJornada: 3,  puntuacionTotal: 28,  precio: 3.0,  estado: 'disponible', titular: false },
  { id: 'm26', nombre: 'Emilio Bravo',       equipo: 'Thundercats FC',   posicion: 'centrocampista', puntuacionJornada: 7,  puntuacionTotal: 60,  precio: 5.5,  estado: 'disponible', titular: false },
  { id: 'm27', nombre: 'Nicolás Pardo',      equipo: 'Thundercats FC',   posicion: 'delantero',      puntuacionJornada: 12, puntuacionTotal: 95,  precio: 9.5,  estado: 'disponible', titular: false },
];

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
