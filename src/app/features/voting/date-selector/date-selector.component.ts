import { Component, Input, OnInit, HostListener, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Poll, PollStats } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-date-selector',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './date-selector.component.html',
  styleUrl: './date-selector.component.scss'
})
export class DateSelectorComponent implements OnInit {
  @Input({ required: true }) poll!: Poll;
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedDates: Set<string> = new Set();
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  isSubmitting = false;
  successMessage = '';
  stats: PollStats | null = null;

  // Drag-to-select state
  isDragging = false;
  dragSelectMode: 'select' | 'deselect' = 'select';

  ngOnInit() {
    this.generateCalendar();
    this.loadMyVote();
    this.loadStats();
  }

  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onWindowPointerUp() {
    this.isDragging = false;
  }

  loadMyVote() {
    if (this.poll.poll_id) {
      this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
        if (vote && vote.vote_value) {
          let dates = vote.vote_value;
          if (typeof dates === 'string') {
            try { dates = JSON.parse(dates); } catch { dates = []; }
          }
          if (Array.isArray(dates)) {
            this.selectedDates = new Set(dates);
            this.generateCalendar();
          }
        }
      });
    }
  }

  loadStats() {
    if (!this.poll.poll_id) return;
    this.pollService.getPollStats(this.poll.poll_id).subscribe({
      next: (data) => {
        this.stats = data;
        this.generateCalendar();
      },
      error: (err) => console.warn('Could not load date stats:', err)
    });
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    this.calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: null, disabled: true });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;

      let isBlocked = false;
      let config = this.poll.config;
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch { config = {}; }
      }

      if (config?.startDate && config?.endDate) {
        if (dateStr < config.startDate || dateStr > config.endDate) {
          isBlocked = true;
        }
      }

      const voteInfo = this.stats?.heatmap ? this.stats.heatmap[dateStr] : null;
      const count = voteInfo ? (typeof voteInfo === 'number' ? voteInfo : voteInfo.count) : 0;

      this.calendarDays.push({
        day: d,
        date: dateStr,
        selected: this.selectedDates.has(dateStr),
        disabled: isBlocked,
        isToday: dateStr === todayStr,
        voteCount: count
      });
    }
  }

  onCellPointerDown(day: any, event: PointerEvent) {
    if (!day.date || day.disabled || this.poll.status === 'locked') return;

    this.isDragging = true;
    if (this.selectedDates.has(day.date)) {
      this.dragSelectMode = 'deselect';
      this.selectedDates.delete(day.date);
    } else {
      this.dragSelectMode = 'select';
      this.selectedDates.add(day.date);
    }
    day.selected = this.selectedDates.has(day.date);
  }

  onCellPointerEnter(day: any) {
    if (!this.isDragging || !day.date || day.disabled || this.poll.status === 'locked') return;

    if (this.dragSelectMode === 'select') {
      this.selectedDates.add(day.date);
    } else {
      this.selectedDates.delete(day.date);
    }
    day.selected = this.selectedDates.has(day.date);
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging || this.poll.status === 'locked') return;
    const touch = event.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cell = element.closest('.calendar-day-cell') as HTMLElement;
    if (cell && cell.dataset['date']) {
      const dateStr = cell.dataset['date'];
      const targetDay = this.calendarDays.find(d => d.date === dateStr);
      if (targetDay && !targetDay.disabled) {
        if (this.dragSelectMode === 'select') {
          this.selectedDates.add(dateStr);
        } else {
          this.selectedDates.delete(dateStr);
        }
        targetDay.selected = this.selectedDates.has(dateStr);
      }
    }
  }

  toggleDate(day: any) {
    // Fallback click handler if not dragged
    if (!day.date || day.disabled || this.poll.status === 'locked') return;

    if (this.selectedDates.has(day.date)) {
      this.selectedDates.delete(day.date);
    } else {
      this.selectedDates.add(day.date);
    }
    day.selected = this.selectedDates.has(day.date);
  }

  changeMonth(delta: number) {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + delta, 1);
    this.generateCalendar();
  }

  submitVote() {
    if (!this.poll.poll_id || this.poll.status === 'locked' || this.isSubmitting) return;

    this.isSubmitting = true;
    const voteData = {
      pollId: this.poll.poll_id,
      voteValue: Array.from(this.selectedDates)
    };

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Tus fechas disponibles han sido guardadas!';

        // Redirigir al dashboard con feedback
        const tripCode = this.route.snapshot.paramMap.get('code') || this.authService.getActiveTripCode();
        setTimeout(() => {
          if (tripCode) {
            this.router.navigate(['/trip', tripCode], { 
              queryParams: { voted: '1', title: this.poll.title } 
            });
          } else {
            this.router.navigate(['/dashboard'], { 
              queryParams: { voted: '1', title: this.poll.title } 
            });
          }
        }, 600);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.error || 'Error al guardar disponibilidad.');
      }
    });
  }
}
