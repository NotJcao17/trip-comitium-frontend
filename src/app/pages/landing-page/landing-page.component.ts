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

  /**
   * Teléfonos y tabletas. Animar la escala de la foto obliga al navegador a
   * rasterizarla otra vez en cada cuadro y ahí se va el presupuesto entero:
   * en esos equipos la portada se mueve solo en vertical. El CSS fija la
   * escala con la misma condición.
   */
  private readonly lowPower =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 779px), (pointer: coarse)').matches;

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
  private forceNext = false;

  /** Medidas de la ventana: pedirlas dentro del cuadro no aporta nada. */
  private viewportW = typeof window !== 'undefined' ? window.innerWidth : 0;
  private viewportH = typeof window !== 'undefined' ? window.innerHeight : 0;

  /** Último scroll atendido, para no repetir el trabajo sin que nada se mueva. */
  private lastY = -1;

  /**
   * Último valor escrito de cada variable CSS. Volver a escribir el mismo
   * invalida el estilo de todo el bloque para dejarlo igual que estaba.
   */
  private readonly varCache = new Map<string, string>();

  private onScroll = () => this.requestUpdate();
  private onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    // En móvil, mostrar u ocultar la barra del navegador dispara `resize`.
    // Volver a medir el riel ahí recalcula el diseño de una página de varias
    // pantallas justo mientras se está bajando, que es cuando se nota.
    const soloBarraDelNavegador = w === this.viewportW && Math.abs(h - this.viewportH) < 140;

    this.viewportW = w;
    this.viewportH = h;

    if (!soloBarraDelNavegador) this.measureRail();
    this.requestUpdate(true);
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

  private requestUpdate(force = false) {
    if (force) this.forceNext = true;
    if (this.frameId) return;
    this.frameId = requestAnimationFrame(() => {
      this.frameId = 0;
      const forzado = this.forceNext;
      this.forceNext = false;
      this.update(forzado);
    });
  }

  /** Escribe una variable CSS solo si cambió de valor. */
  private setVar(el: HTMLElement, name: string, value: string) {
    if (this.varCache.get(name) === value) return;
    this.varCache.set(name, value);
    el.style.setProperty(name, value);
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
    const travel = Math.max(shift * 1.15, this.viewportH * 0.9);
    host.style.height = `${Math.round(this.viewportH + travel)}px`;
  }

  private clamp01(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  /** Progreso 0..1 de un bloque alto mientras su interior sticky ocupa la pantalla. */
  private progressOf(el: HTMLElement): number {
    const rect = el.getBoundingClientRect();
    const travel = rect.height - this.viewportH;
    if (travel <= 0) return 0;
    const raw = -rect.top / travel;
    return raw < 0 ? 0 : raw > 1 ? 1 : raw;
  }

  private update(force = false) {
    const y = window.scrollY;
    if (!force && y === this.lastY) return;
    this.lastY = y;

    const railHost = this.railSection?.nativeElement;
    const track = this.railTrack?.nativeElement;
    const opening = this.openingSection?.nativeElement;

    // Todas las medidas juntas y después todas las escrituras: intercalarlas
    // obliga al navegador a recalcular el diseño en mitad del cuadro, y con
    // dos bloques de varias pantallas de alto eso se paga caro.
    const railP = railHost ? this.progressOf(railHost) : 0;
    const maxShift = track ? track.scrollWidth - track.clientWidth : 0;
    const openP = opening ? this.progressOf(opening) : 0;

    let step = this.railStep;
    let beat = this.treeBeat;
    let gone = this.heroGone;

    if (track) {
      this.setVar(track, '--rail-shift', `${(railP * maxShift).toFixed(2)}px`);
      step = Math.min(
        this.railStepsCount - 1,
        Math.round(railP * (this.railStepsCount - 1))
      );
    }

    if (opening) {
      // La portada aguanta, luego sube y se desvanece…
      const salida = this.clamp01((openP - this.heroHold) / (this.heroFadeEnd - this.heroHold));
      this.setVar(opening, '--hero-fade', (1 - salida).toFixed(3));
      this.setVar(opening, '--hero-y', `${(-salida * 46).toFixed(2)}svh`);

      // …el fondo acompaña con un desplazamiento suave…
      this.setVar(opening, '--img-y', `${(openP * 5 - 2.5).toFixed(2)}svh`);

      // …y el zoom entra cuando el texto de la portada ya salió. El máximo se
      // queda en 1.20 para no pedirle a la foto más píxeles de los que tiene.
      // En móvil no hay zoom: es lo que hacía que el recorrido se sintiera duro.
      if (!this.lowPower) {
        const zoomStart = 0.2;
        const zoom = openP <= zoomStart ? 0 : (openP - zoomStart) / (1 - zoomStart);
        this.setVar(opening, '--img-scale', (1.08 + zoom * 0.12).toFixed(4));
      }

      // Las frases arrancan solapadas con el final del desvanecido para que
      // no quede ni un momento con la foto sola.
      const beatsStart = this.heroFadeEnd - 0.08;
      beat = openP < beatsStart
        ? -2
        : Math.min(
            this.treeBeatsCount - 1,
            Math.floor(((openP - beatsStart) / (1 - beatsStart)) * this.treeBeatsCount)
          );

      gone = salida >= 1;
    }

    // Una sola entrada al ciclo de Angular por cuadro, y solo si algo cambió.
    if (step !== this.railStep || beat !== this.treeBeat || gone !== this.heroGone) {
      this.zone.run(() => {
        this.railStep = step;
        this.treeBeat = beat;
        this.heroGone = gone;
      });
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
