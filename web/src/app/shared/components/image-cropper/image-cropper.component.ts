import { Component, HostListener, computed, input, output, signal } from '@angular/core';

const FRAME = 288;
const OUTPUT = 512;
const MAX_ZOOM = 3;

@Component({
  selector: 'app-image-cropper',
  standalone: true,
  templateUrl: './image-cropper.component.html',
})
export class ImageCropperComponent {
  readonly src = input.required<string>();

  readonly confirmar = output<Blob>();
  readonly cancelar = output<void>();

  readonly frame = FRAME;
  readonly maxZoom = MAX_ZOOM;

  private img: HTMLImageElement | null = null;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  readonly listo = signal(false);
  readonly procesando = signal(false);
  readonly zoom = signal(1);
  readonly offset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  private readonly natural = signal<{ w: number; h: number }>({ w: 1, h: 1 });

  private readonly coverScale = computed(() => {
    const { w, h } = this.natural();
    return Math.max(FRAME / w, FRAME / h);
  });

  readonly dispW = computed(() => this.natural().w * this.coverScale() * this.zoom());
  readonly dispH = computed(() => this.natural().h * this.coverScale() * this.zoom());

  constructor() {
    queueMicrotask(() => this.load());
  }

  private load(): void {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      this.img = image;
      this.natural.set({ w: image.naturalWidth, h: image.naturalHeight });
      this.centrar();
      this.listo.set(true);
    };
    image.src = this.src();
  }

  private centrar(): void {
    this.offset.set({ x: (FRAME - this.dispW()) / 2, y: (FRAME - this.dispH()) / 2 });
  }

  private clamp(o: { x: number; y: number }): { x: number; y: number } {
    return {
      x: Math.min(0, Math.max(FRAME - this.dispW(), o.x)),
      y: Math.min(0, Math.max(FRAME - this.dispH(), o.y)),
    };
  }

  onPointerDown(ev: PointerEvent): void {
    if (!this.listo()) return;
    this.dragging = true;
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(ev: PointerEvent): void {
    if (!this.dragging) return;
    const dx = ev.clientX - this.lastX;
    const dy = ev.clientY - this.lastY;
    this.lastX = ev.clientX;
    this.lastY = ev.clientY;
    this.offset.update(o => this.clamp({ x: o.x + dx, y: o.y + dy }));
  }

  @HostListener('window:pointerup')
  onPointerUp(): void {
    this.dragging = false;
  }

  onZoom(value: string): void {
    const nuevoZoom = Number(value);
    const cx = FRAME / 2;
    const cy = FRAME / 2;
    const o = this.offset();
    const ratio = nuevoZoom / this.zoom();
    this.zoom.set(nuevoZoom);
    this.offset.set(this.clamp({
      x: cx - (cx - o.x) * ratio,
      y: cy - (cy - o.y) * ratio,
    }));
  }

  onWheel(ev: WheelEvent): void {
    if (!this.listo()) return;
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.1 : -0.1;
    const nuevoZoom = Math.min(MAX_ZOOM, Math.max(1, this.zoom() + delta));
    this.onZoom(String(nuevoZoom));
  }

  guardar(): void {
    if (!this.img || !this.listo()) return;
    this.procesando.set(true);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) { this.procesando.set(false); return; }

    const k = OUTPUT / FRAME;
    const o = this.offset();
    ctx.drawImage(this.img, o.x * k, o.y * k, this.dispW() * k, this.dispH() * k);

    canvas.toBlob(blob => {
      this.procesando.set(false);
      if (blob) this.confirmar.emit(blob);
    }, 'image/png');
  }

  cerrar(): void {
    this.cancelar.emit();
  }
}
