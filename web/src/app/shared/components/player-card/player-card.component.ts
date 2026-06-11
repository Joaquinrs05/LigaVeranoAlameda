import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-player-card',
  standalone: true,
  templateUrl: './player-card.component.html',
})
export class PlayerCardComponent {
  @Input() nombre!: string;
  @Input() dorsal?: number;
  @Input() posicion!: string;   // 'POR' | 'DEF' | 'MC' | 'DEL'
  @Input() fotoUrl?: string;
  @Input() puntuacion?: number;
  @Input() estado: 'disponible' | 'lesionado' | 'sancionado' = 'disponible';
  @Input() seleccionado = false;
  @Input() capitan = false;
  @Input() size: 'sm' | 'md' = 'md';

  get w(): number { return this.size === 'sm' ? 80 : 90; }
  get h(): number { return this.size === 'sm' ? 108 : 122; }
  get avatarSize(): number { return this.size === 'sm' ? 48 : 54; }
  get dorsalSize(): number { return this.size === 'sm' ? 13 : 15; }
  get posSize(): number { return this.size === 'sm' ? 9 : 10; }
  get nameSize(): number { return this.size === 'sm' ? 9 : 10; }

  // Color de acento por posición — identifica el rol de un vistazo (estilo fantasy)
  get posColor(): string {
    return {
      POR: '#0c6b3d',
      DEF: '#e0610b',
      MC: '#2f6f9f',
      DEL: '#b23a48',
    }[this.posicion] ?? '#0c6b3d';
  }

  get iniciales(): string {
    return this.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }

  get primerNombre(): string {
    return this.nombre.split(' ')[0].toUpperCase();
  }
}
