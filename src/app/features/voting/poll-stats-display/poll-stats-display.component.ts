import { Component, Input, OnChanges, SimpleChanges, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll, PollParticipation } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';
import { VotersListComponent } from '../../../components/voters-list/voters-list.component';
import { OptionGalleryComponent } from '../../../components/option-gallery/option-gallery.component';
import { PollOptionImage } from '../../../models/poll.interface';

@Component({
  selector: 'app-poll-stats-display',
  standalone: true,
  imports: [CommonModule, VotersListComponent, OptionGalleryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './poll-stats-display.component.html',
  styleUrl: './poll-stats-display.component.scss'
})
export class PollStatsDisplayComponent implements OnChanges {
  @Input() poll: Poll | null = null;
  private pollService = inject(PollService);

  stats: any = null;
  isLoading = false;
  error = '';

  heatmapDays: any[] = [];
  calendarDays: any[] = [];
  monthName: string = '';
  currentDate = new Date();
  selectedDayDetails: { id?: number; name: string }[] = [];
  selectedDayAbsentees: { id?: number; name: string }[] = [];
  selectedDayLabel = '';

  // Detalle de votos de tier list: una fila por tripulante, una columna por opcion.
  showTierMatrix = false;
  tierMatrixItems: string[] = [];
  tierMatrixRows: { name: string; cells: { tier: string; label: string }[] }[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['poll'] && this.poll) {
      this.loadStats();
    }
  }

  loadStats() {
    if (!this.poll?.poll_id) return;

    this.isLoading = true;
    this.error = '';
    this.stats = null;

    // Se limpia al cambiar de encuesta: si no, el detalle del dia que estaba
    // abierto se queda pegado y parece de la votacion nueva.
    this.selectedDayDetails = [];
    this.selectedDayAbsentees = [];
    this.selectedDayLabel = '';
    this.heatmapDays = [];
    this.calendarDays = [];
    this.showTierMatrix = false;
    this.tierMatrixItems = [];
    this.tierMatrixRows = [];

    this.pollService.getPollStats(this.poll.poll_id).subscribe({
      next: (data) => {
        this.stats = data;
        if (this.poll?.type === 'date') {
          this.heatmapDays = [];
          if (data && data.heatmap) {
            const h = data.heatmap;
            this.heatmapDays = Object.keys(h).map(date => ({
              date,
              ...h[date]
            }));
          }
          this.generateCalendar();
        }
        if (this.poll?.type === 'tier_list') {
          this.buildTierMatrix(data);
        }
        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las estadísticas.';
        this.isLoading = false;
      }
    });
  }

  get participation(): PollParticipation | null {
    return this.stats?.participation || null;
  }

  get participationPercent(): number {
    const p = this.participation;
    if (!p || !p.totalParticipants) return 0;
    return Math.round((p.votedCount / p.totalParticipants) * 100);
  }

  /**
   * Arma la tabla cruzada a partir de los votos crudos. El backend solo manda
   * `rawVotes` al organizador, asi que si no vienen simplemente no hay tabla.
   */
  private buildTierMatrix(data: any) {
    const fromOptions = this.poll?.options?.map(o => o.text) || [];
    this.tierMatrixItems = fromOptions.length
      ? fromOptions
      : (data?.ranking || []).map((r: any) => r.item);

    const raw = Array.isArray(data?.rawVotes) ? data.rawVotes : [];
    this.tierMatrixRows = raw.map((v: any) => {
      const tiers = (v?.tiers && typeof v.tiers === 'object') ? v.tiers : {};
      return {
        name: v?.name || 'Sin nombre',
        cells: this.tierMatrixItems.map(item => {
          // Lo que el votante dejo sin clasificar no se guarda: ausente = sin tier.
          const tier = tiers[item] ? String(tiers[item]).toUpperCase() : '';
          return { tier, label: tier || '—' };
        })
      };
    });
  }

  get hasTierMatrix(): boolean {
    return this.tierMatrixRows.length > 0 && this.tierMatrixItems.length > 0;
  }

  toggleTierMatrix() {
    this.showTierMatrix = !this.showTierMatrix;
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.currentDate);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    this.calendarDays = [];

    for (let i = 0; i < startingDay; i++) {
      this.calendarDays.push({ empty: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const found = this.heatmapDays.find(d => d.date === dateStr);

      const votersList: { id?: number; name: string }[] = (found?.voters || []).map((v: any) =>
        typeof v === 'object' ? { id: v.id, name: v.name } : { name: v }
      );

      this.calendarDays.push({
        date: i,
        fullDate: dateStr,
        count: found ? found.count : 0,
        voters: votersList,
        // Solo entre quienes ya contestaron: de los que no han votado no
        // sabemos si pueden ese dia, y contarlos como "no disponibles" mentiria.
        absentees: this.absenteesFor(votersList),
        empty: false
      });
    }
  }

  changeMonth(offset: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.generateCalendar();
  }

  getHeatmapColor(count: number): string {
    if (count === 0) return 'rgba(255,255,255,0.03)';
    if (count === 1) return 'var(--sage-800)';
    if (count <= 3) return 'var(--sage-600)';
    return 'var(--sage-400)';
  }

  /** Los votos de tier list se guardan por texto: recuperamos su descripción. */
  getOptionDescription(itemText: string): string | null {
    const opt = this.poll?.options?.find(o => o.text === itemText);
    return opt?.description || null;
  }

  /** Y sus fotos, para que el organizador pueda revisar lo que publicó. */
  getOptionImages(itemText: string): PollOptionImage[] {
    const opt = this.poll?.options?.find(o => o.text === itemText);
    return opt?.images || [];
  }

  joinNames(list: { name: string }[]): string {
    return list.map(v => v.name).join(', ');
  }

  /** Quienes ya votaron la encuesta pero no marcaron este dia. */
  private absenteesFor(available: { id?: number; name: string }[]): { id?: number; name: string }[] {
    const voted = this.participation?.voted || [];
    if (!voted.length) return [];

    const ids = new Set(available.map(v => v.id).filter(id => id !== undefined));
    const names = new Set(available.map(v => v.name));

    return voted.filter(p => !ids.has(p.id) && !names.has(p.name));
  }

  showDayDetails(day: any) {
    if (day.empty) return;
    this.selectedDayDetails = day.voters || [];
    this.selectedDayAbsentees = day.absentees || [];
    this.selectedDayLabel = this.formatDayLabel(day.fullDate);
  }

  /** "2026-10-16" -> "viernes 16 de octubre". Se parte a mano para que la
   *  fecha no se interprete en UTC y termine mostrando el dia anterior. */
  private formatDayLabel(fullDate: string): string {
    if (!fullDate) return '';
    const [y, m, d] = fullDate.split('-').map(Number);
    if (!y || !m || !d) return fullDate;

    // Intl devuelve "viernes, 16 de octubre"; la coma sobra en un titulillo.
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(y, m - 1, d)).replace(',', '');
  }
}
