import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-poll-stats-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poll-stats-display.component.html',
  styleUrl: './poll-stats-display.component.scss'
})
export class PollStatsDisplayComponent implements OnChanges {
  @Input() poll: Poll | null = null;
  pollService = inject(PollService);

  stats: any = null;
  isLoading = false;
  error = '';

  // Heatmap / Calendar
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

    this.pollService.getStats(this.poll.poll_id).subscribe({
      next: (data) => {
        this.stats = data;
        if (this.poll?.type === 'date') {
          this.heatmapDays = data.days || []; // Assuming API returns 'days' array
          // If API returns heatmap object, convert it:
          if (data.heatmap) {
            this.heatmapDays = Object.keys(data.heatmap).map(date => ({
              date,
              ...data.heatmap[date]
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

  // --- CALENDAR LOGIC ---
  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    this.monthName = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(this.currentDate);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday

    this.calendarDays = [];

    // Empty slots for previous month
    for (let i = 0; i < startingDay; i++) {
      this.calendarDays.push({ empty: true });
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      // Find data for this day
      const found = this.heatmapDays.find(d => d.date === dateStr);

      this.calendarDays.push({
        date: i,
        fullDate: dateStr,
        count: found ? found.count : 0,
        voters: found ? found.voters : [],
        empty: false
      });
    }
  }

  changeMonth(offset: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.generateCalendar();
  }

  getHeatmapColor(count: number): string {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    // 5 phases of heatmap
    if (count < 2) return '#1e1b4b'; // Phase 1
    if (count < 4) return '#3730a3'; // Phase 2
    if (count < 6) return '#4f46e5'; // Phase 3
    if (count < 8) return '#818cf8'; // Phase 4
    return '#c7d2fe';                // Phase 5
  }

  showDayDetails(day: any) {
    if (!day.empty) {
      this.selectedDayDetails = day.voters || [];
    }
  }

  // --- DELETION LOGIC ---
}
