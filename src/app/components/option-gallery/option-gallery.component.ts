import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollOptionImage } from '../../models/poll.interface';

/**
 * Galería de fotos de una opción: una tira de miniaturas que se recorre en
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
 *
 * Las flechas no son decoración. La barra de scroll va oculta para que la
 * tira no se vea sucia, y sin ellas en escritorio no había manera de pasar de
 * las primeras miniaturas: con diez fotos solo se llegaban a ver cinco.
 */
@Component({
  selector: 'app-option-gallery',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './option-gallery.component.html',
  styleUrl: './option-gallery.component.scss'
})
export class OptionGalleryComponent implements OnDestroy {
  @Input() images: PollOptionImage[] | null | undefined = [];

  /** Nombre de la opción, para el texto alternativo. */
  @Input() label = '';

  /** Miniaturas más pequeñas, para cuando van dentro de una tarjeta. */
  @Input() compact = false;

  @ViewChild('lightbox') lightboxRef?: ElementRef<HTMLDialogElement>;

  private zone = inject(NgZone);

  private stripEl?: HTMLElement;

  /**
   * Setter y no `ngAfterViewInit`: las fotos llegan por HTTP despues del
   * primer pintado, asi que cuando se ejecuta AfterViewInit el *ngIf todavia
   * no ha creado la tira y el listener no se enganchaba a nada. El resultado
   * era que las flechas aparecian pero ya no se actualizaban al desplazar.
   * El setter se vuelve a llamar en cuanto el elemento existe.
   */
  @ViewChild('strip')
  set strip(ref: ElementRef<HTMLElement> | undefined) {
    const el = ref?.nativeElement;
    if (el === this.stripEl) return;

    this.detachStrip();
    this.stripEl = el;
    if (!el) return;

    this.zone.runOutsideAngular(() => {
      el.addEventListener('scroll', this.onStripScroll, { passive: true });

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.syncArrows());
        this.resizeObserver.observe(el);
      }
    });

    // Fuera del ciclo de deteccion actual: la vista ya se verifico.
    setTimeout(() => this.syncArrows(), 0);
  }

  /** Enlaces que el navegador no pudo cargar. */
  private readonly broken = new Set<string>();

  activeIndex = -1;
  canScrollPrev = false;
  canScrollNext = false;

  private resizeObserver?: ResizeObserver;
  private readonly onStripScroll = () => this.syncArrows();

  get visible(): PollOptionImage[] {
    return (this.images || []).filter(img => img?.url && !this.broken.has(img.url));
  }

  get active(): PollOptionImage | null {
    return this.visible[this.activeIndex] || null;
  }

  ngOnDestroy() {
    this.detachStrip();
  }

  /** El scroll solo decide qué flechas se ven, así que se escucha fuera de la
   *  zona de Angular y solo se vuelve a entrar cuando hay que repintar una. */
  private detachStrip() {
    this.stripEl?.removeEventListener('scroll', this.onStripScroll);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  /**
   * Las flechas van superpuestas sobre los bordes de la tira, no en la fila.
   * Si ocuparan sitio, aparecer y desaparecer cambiaría el ancho disponible,
   * el ResizeObserver volvería a medir y se entraría en bucle.
   */
  private syncArrows() {
    const el = this.stripEl;
    if (!el) return;

    const restante = el.scrollWidth - el.clientWidth;
    const prev = el.scrollLeft > 2;
    const next = el.scrollLeft < restante - 2;

    if (prev === this.canScrollPrev && next === this.canScrollNext) return;

    this.zone.run(() => {
      this.canScrollPrev = prev;
      this.canScrollNext = next;
    });
  }

  /** Una foto recién cargada cambia el ancho total: hay que volver a mirar. */
  onThumbLoad() {
    this.syncArrows();
  }

  scrollStrip(direction: 1 | -1, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const el = this.stripEl;
    if (!el) return;

    // Casi una pantalla: deja una miniatura a la vista como referencia de
    // dónde se estaba.
    const paso = Math.max(el.clientWidth - 72, 90);

    // El desplazamiento suave se anima con requestAnimationFrame. Si el
    // usuario pidió menos movimiento, esa animación no debe existir; y si el
    // navegador la tiene parada, un salto seco al menos llega.
    const suave = typeof window !== 'undefined'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    el.scrollBy({ left: direction * paso, behavior: suave ? 'smooth' : 'auto' });
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

    this.syncArrows();
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
   * Cerrar tocando fuera de la foto: el fondo oscuro y el margen alrededor.
   * Solo la imagen y los botones frenan el clic.
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
