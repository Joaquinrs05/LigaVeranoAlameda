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
    tipo: 'cuartos',
    label: 'Cuartos de Final',
    // Top 8 de la liga
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
