import { IFaseTorneo } from '../models/torneo.model';

const tbd = (id: string) => ({
  id,
  equipoLocal: null,
  equipoVisitante: null,
  golesLocal: null,
  golesVisitante: null,
  estado: 'pendiente' as const,
});

export const TORNEO_DATA: IFaseTorneo[] = [
  {
    tipo: 'octavos',
    label: 'Octavos',
    // Pos 5-12 de liguilla juegan 4 cruces → 4 pasan a cuartos
    cruces: [tbd('oct-1'), tbd('oct-2'), tbd('oct-3'), tbd('oct-4')],
  },
  {
    tipo: 'cuartos',
    label: 'Cuartos',
    // Top 4 de liguilla + 4 ganadores de octavos
    cruces: [tbd('cua-1'), tbd('cua-2'), tbd('cua-3'), tbd('cua-4')],
  },
  {
    tipo: 'semis',
    label: 'Semis',
    cruces: [tbd('sem-1'), tbd('sem-2')],
  },
  {
    tipo: 'final',
    label: 'Final',
    cruces: [tbd('fin-1')],
  },
];
