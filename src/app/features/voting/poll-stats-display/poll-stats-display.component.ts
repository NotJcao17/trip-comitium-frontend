import { Component, Input, OnChanges, SimpleChanges, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll } from '../../../models/poll.interface';
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
  selectedDayDetails: string[] = [];

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
    this.heatmapDays = [];
    this.calendarDays = [];

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
        this.isLoading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las estadísticas.';
        this.isLoading = false;
      }
    });
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

      const votersList = found?.voters ? found.voters.map((v: any) => typeof v === 'object' ? v.name : v) : [];

      this.calendarDays.push({
        date: i,
        fullDate: dateStr,
        count: found ? found.count : 0,
        voters: votersList,
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

  showDayDetails(day: any) {
    if (!day.empty) {
      this.selectedDayDetails = day.voters || [];
    }
  }
}
