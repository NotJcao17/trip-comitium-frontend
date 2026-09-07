import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollOptionImage } from '../../models/poll.interface';

/**
 * Galería de fotos de una opción: una tira de miniaturas que se desliza en
 * horizontal y, al tocar una, la abre en grande.
 *
 * Las imágenes viven en un servicio externo, así que dos cosas dan forma a
 * todo lo demás:
 *
 *  - Un enlace se puede caer en cualquier momento. Una foto rota se retira de
 *    la tira en silencio; nunca deja el hueco ni el icono de imagen partida.
 *  - No tenemos miniaturas de verdad, se descarga el original. Por eso la
 *    tira va en scroll horizontal con carga diferida: el navegador solo pide
 *    las que se ven, y en grande se muestra una sola cada vez.
 */
@Component({
  selector: 'app-option-gallery',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './option-gallery.component.html',
  styleUrl: './option-gallery.component.scss'
})
export class OptionGalleryComponent {
  @Input() images: PollOptionImage[] | null | undefined = [];

  /** Nombre de la opción, para el texto alternativo. */
  @Input() label = '';

  /** Miniaturas más pequeñas, para cuando van dentro de una tarjeta. */
  @Input() compact = false;

  @ViewChild('lightbox') lightboxRef?: ElementRef<HTMLDialogElement>;

  /** Enlaces que el navegador no pudo cargar. */
  private readonly broken = new Set<string>();

  activeIndex = -1;

  get visible(): PollOptionImage[] {
    return (this.images || []).filter(img => img?.url && !this.broken.has(img.url));
  }

  get active(): PollOptionImage | null {
    return this.visible[this.activeIndex] || null;
  }

  thumbSrc(img: PollOptionImage): string {
    return img.thumb_url || img.url;
  }

  altFor(index: number): string {
    const total = this.visible.length;
    const base = this.label ? `${this.label} — foto` : 'Foto';
    return `${base} ${index + 1} de ${total}`;
  }

  /**
   * La miniatura y la vista grande pueden fallar por separado (una es
   * `thumb_url` y la otra `url`), pero si cualquiera de las dos se cae el
   * enlace ya no sirve para nada, así que se retira entero.
   */
  onImageError(img: PollOptionImage) {
    this.broken.add(img.url);

    if (this.activeIndex >= this.visible.length) {
      this.activeIndex = this.visible.length - 1;
    }
    if (this.visible.length === 0) this.close();
  }

  open(index: number, event: Event) {
    // Estas galerías viven dentro de tarjetas que ya reaccionan al clic
    // (seleccionar una opción, cerrar una ficha): abrir una foto no debe
    // disparar además esa acción.
    event.stopPropagation();
    event.preventDefault();

    this.activeIndex = index;
    const el = this.lightboxRef?.nativeElement;
    if (el && !el.open) el.showModal();
  }

  close() {
    const el = this.lightboxRef?.nativeElement;
    if (el?.open) el.close();
    this.activeIndex = -1;
  }

  /**
   * Cerrar tocando el fondo.
   *
   * El <dialog> se dibuja en la capa superior, pero en el árbol sigue estando
   * dentro de la tarjeta de la opción, y esa tarjeta entera es un botón de
   * «elijo esta». Sin frenar aquí, cerrar una foto acabaría votando.
   */
  onBackdropClick(event: Event) {
    event.stopPropagation();
    this.close();
  }

  step(delta: number, event?: Event) {
    event?.stopPropagation();
    const total = this.visible.length;
    if (total === 0) return;
    this.activeIndex = (this.activeIndex + delta + total) % total;
  }

  onLightboxKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.step(-1);
    }
  }

  trackByUrl(_index: number, img: PollOptionImage): string {
    return img.url;
  }
}
