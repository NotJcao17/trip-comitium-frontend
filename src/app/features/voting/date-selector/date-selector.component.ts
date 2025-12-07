import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-date-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-selector.component.html',
  styleUrl: './date-selector.component.scss'
})
export class DateSelectorComponent implements OnInit {
  @Input() poll!: Poll;
  pollService = inject(PollService);

  selectedDates: Set<string> = new Set(); // Usamos Set para evitar duplicados
  currentMonth: Date = new Date();
  calendarDays: any[] = []; // Días a renderizar
  isSubmitting = false;
  successMessage = '';

  // Configuración (vendría del JSON config de la encuesta)
  minDate: Date = new Date(); // Hoy
  maxDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() + 1)); // 1 año

  ngOnInit() {
    this.generateCalendar();
    this.loadMyVote();
  }

  loadMyVote() {
    if (this.poll.poll_id) {
      this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
        if (vote && vote.vote_value) {
          // vote_value es un array de strings ["2025-01-01"]
          this.selectedDates = new Set(vote.vote_value);
          this.generateCalendar(); // Regenerar para pintar selección
        }
      });
    }
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);

    // Días previos (para llenar la cuadrícula)
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo

    this.calendarDays = [];

    // Rellenar vacíos iniciales
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ date: null, disabled: true });
    }

    // Días reales
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);

      // Construir string local YYYY-MM-DD manualmente
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;

      // Verificar si está bloqueado por config
      let isBlocked = false;

      // Asegurarse de que config es un objeto (por si llega como string)
      let config = this.poll.config;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error('Error parsing poll config', e);
          config = {};
        }
      }

      if (config?.startDate && config?.endDate) {
        // Comparación directa de strings (funciona bien con formato YYYY-MM-DD)
        if (dateStr < config.startDate || dateStr > config.endDate) {
          isBlocked = true;
          // console.log(`Blocking ${dateStr} because it is outside ${config.startDate} - ${config.endDate}`);
        }
      }

      this.calendarDays.push({
        day: d,
        date: dateStr,
        selected: this.selectedDates.has(dateStr),
        disabled: isBlocked,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      });
    }
  }

  toggleDate(day: any) {
    if (!day.date || day.disabled) return;

    if (this.selectedDates.has(day.date)) {
      this.selectedDates.delete(day.date);
    } else {
      this.selectedDates.add(day.date);
    }
    this.generateCalendar(); // Actualizar visual
  }

  changeMonth(delta: number) {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + delta, 1);
    this.generateCalendar();
  }

  submitVote() {
    if (!this.poll.poll_id) return;

    this.isSubmitting = true;
    const voteData = {
      pollId: this.poll.poll_id,
      voteValue: Array.from(this.selectedDates) // Convertir Set a Array
    };

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Disponibilidad guardada!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Error al guardar voto.');
      }
    });
  }
}
