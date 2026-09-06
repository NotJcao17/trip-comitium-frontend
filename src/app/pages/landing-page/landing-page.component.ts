import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private zone = inject(NgZone);

  quickCode = '';

  @ViewChild('railSection') railSection?: ElementRef<HTMLElement>;
  @ViewChild('railTrack') railTrack?: ElementRef<HTMLElement>;
  @ViewChild('openingSection') openingSection?: ElementRef<HTMLElement>;

  /**
   * Se resuelve antes del primer render para que la plantilla no cambie
   * después de haberse verificado.
   */
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** El scroll controla el riel y el árbol (falso si se pidió menos movimiento). */
  motionDriven = !this.prefersReducedMotion;

  /** Paso visible del riel horizontal (para el indicador de progreso). */
  railStep = 0;
  readonly railStepsCount = 4;

  /**
   * Frase visible de la apertura. -1 con movimiento reducido (se leen las tres),
   * -2 mientras todavía manda la portada y no toca mostrar ninguna.
   */
  treeBeat = this.prefersReducedMotion ? -1 : -2;
  readonly treeBeatsCount = 3;

  /** El texto de la portada ya salió: deja de recibir foco y clics. */
  heroGone = false;

  /**
   * La portada se queda quieta un momento y después se va desplazando hacia
   * arriba, como si fuera una sección que sale de pantalla. Antes salía en un
   * solo scroll y no daba tiempo de leerla.
   */
  private readonly heroHold = 0.10;
  private readonly heroFadeEnd = 0.42;

  private frameId = 0;
  private listening = false;
  private onScroll = () => this.requestUpdate();
  private onResize = () => {
    this.measureRail();
    this.requestUpdate();
  };

  ngAfterViewInit() {
    // Sin movimiento: el riel se recorre a mano y las tres frases se leen juntas.
    if (typeof window === 'undefined' || this.prefersReducedMotion) return;

    this.railTrack?.nativeElement.classList.add('is-driven');

    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.listening = true;
      this.measureRail();
      // Fuera del ciclo de detección actual: la vista ya se verificó.
      setTimeout(() => this.update(), 0);
    });
  }

  ngOnDestroy() {
    if (this.listening) {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
    }
    if (this.frameId) cancelAnimationFrame(this.frameId);
  }

  private requestUpdate() {
    if (this.frameId) return;
    this.frameId = requestAnimationFrame(() => {
      this.frameId = 0;
      this.update();
    });
  }

  /**
   * El alto del bloque se ata al recorrido horizontal real: así bajar una
   * pantalla mueve el riel más o menos una pantalla, en cualquier tamaño.
   */
  private measureRail() {
    const host = this.railSection?.nativeElement;
    const track = this.railTrack?.nativeElement;
    if (!host || !track) return;

    const shift = Math.max(0, track.scrollWidth - track.clientWidth);
    const travel = Math.max(shift * 1.15, window.innerHeight * 0.9);
    host.style.height = `${Math.round(window.innerHeight + travel)}px`;
  }

  private clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  /** Progreso 0..1 de un bloque alto mientras su interior sticky ocupa la pantalla. */
  private progressOf(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    if (travel <= 0) return 0;
    const raw = -rect.top / travel;
    return raw < 0 ? 0 : raw > 1 ? 1 : raw;
  }

  private update() {
    const railHost = this.railSection?.nativeElement;
    const track = this.railTrack?.nativeElement;

    if (railHost && track) {
      const p = this.progressOf(railHost);
      const maxShift = track.scrollWidth - track.clientWidth;
      track.style.setProperty('--rail-shift', `${(p * maxShift).toFixed(2)}px`);

      const step = Math.min(
        this.railStepsCount - 1,
        Math.round(p * (this.railStepsCount - 1))
      );
      if (step !== this.railStep) {
        this.zone.run(() => (this.railStep = step));
      }
    }

    const opening = this.openingSection?.nativeElement;
    if (opening) {
      const p = this.progressOf(opening);

      // La portada aguanta, luego sube y se desvanece…
      const salida = this.clamp01((p - this.heroHold) / (this.heroFadeEnd - this.heroHold));
      opening.style.setProperty('--hero-fade', (1 - salida).toFixed(3));
      opening.style.setProperty('--hero-y', `${(-salida * 46).toFixed(2)}svh`);

      // …el fondo acompaña con un desplazamiento suave…
      opening.style.setProperty('--img-y', `${(p * 5 - 2.5).toFixed(2)}svh`);

      // …y el zoom entra cuando el texto de la portada ya salió. El máximo se
      // queda en 1.20 para no pedirle a la foto más píxeles de los que tiene.
      const zoomStart = 0.2;
      const zoom = p <= zoomStart ? 0 : (p - zoomStart) / (1 - zoomStart);
      opening.style.setProperty('--img-scale', (1.08 + zoom * 0.12).toFixed(4));

      // Las frases arrancan solapadas con el final del desvanecido para que
      // no quede ni un momento con la foto sola.
      const beatsStart = this.heroFadeEnd - 0.08;
      const beat = p < beatsStart
        ? -2
        : Math.min(
            this.treeBeatsCount - 1,
            Math.floor(((p - beatsStart) / (1 - beatsStart)) * this.treeBeatsCount)
          );

      const gone = salida >= 1;
      if (beat !== this.treeBeat || gone !== this.heroGone) {
        this.zone.run(() => {
          this.treeBeat = beat;
          this.heroGone = gone;
        });
      }
    }
  }

  isBeatVisible(index: number): boolean {
    return this.treeBeat === -1 || this.treeBeat === index;
  }

  onQuickJoin() {
    if (this.quickCode && this.quickCode.trim()) {
      this.router.navigate(['/join'], { queryParams: { code: this.quickCode.trim().toUpperCase() } });
    } else {
      this.router.navigate(['/join']);
    }
  }
}
