import { Component, Output, EventEmitter, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../services/poll.service';
import { PollOptionDraft } from '../../../models/poll.interface';

@Component({
  selector: 'app-poll-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './poll-creator.component.html',
  styleUrl: './poll-creator.component.scss'
})
export class PollCreatorComponent implements OnInit {
  private pollService = inject(PollService);
  @Output() created = new EventEmitter<void>();

  title = '';
  description = '';
  type = 'multiple_choice';
  isAnonymous = false;

  // Opciones con detalles: cada renglón es una tarjeta que el grupo verá al votar
  options: PollOptionDraft[] = [
    { text: '', description: '' },
    { text: '', description: '' }
  ];
  expandedOptionIndex: number | null = null;
  readonly maxOptionDescription = 400;

  sliderMin = 1000;
  sliderMax = 30000;
  sliderStep = 500;
  dateStart = '';
  dateEnd = '';
  todayDateStr = '';

  // Interactive visual calendar for admin date selection
  creatorCurrentMonth: Date = new Date();
  creatorCalendarDays: any[] = [];

  isSubmitting = false;
  validationErrors: string[] = [];

  ngOnInit() {
    this.todayDateStr = new Date().toISOString().split('T')[0];
    
    // Fechas sugeridas por defecto para el siguiente fin de semana
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((7 - nextFriday.getDay() + 5) % 7 || 7));
    const nextSunday = new Date(nextFriday);
    nextSunday.setDate(nextSunday.getDate() + 2);

    this.dateStart = nextFriday.toISOString().split('T')[0];
    this.dateEnd = nextSunday.toISOString().split('T')[0];
    this.creatorCurrentMonth = new Date(nextFriday.getFullYear(), nextFriday.getMonth(), 1);

    this.generateCreatorCalendar();
  }

  getCreatorMonthYearLabel(): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[this.creatorCurrentMonth.getMonth()]} ${this.creatorCurrentMonth.getFullYear()}`;
  }

  changeCreatorMonth(delta: number) {
    this.creatorCurrentMonth = new Date(
      this.creatorCurrentMonth.getFullYear(),
      this.creatorCurrentMonth.getMonth() + delta,
      1
    );
    this.generateCreatorCalendar();
  }

  generateCreatorCalendar() {
    const year = this.creatorCurrentMonth.getFullYear();
    const month = this.creatorCurrentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    this.creatorCalendarDays = [];

    // Empty cells before start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.creatorCalendarDays.push({ date: null, disabled: true });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dayStr = String(dateObj.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayStr}`;

      const isPast = dateStr < this.todayDateStr;
      const isStart = dateStr === this.dateStart;
      const isEnd = dateStr === this.dateEnd;
      const isInRange = Boolean(
        this.dateStart && 
        this.dateEnd && 
        dateStr >= this.dateStart && 
        dateStr <= this.dateEnd
      );

      this.creatorCalendarDays.push({
        day: d,
        date: dateStr,
        isPast,
        isToday: dateStr === this.todayDateStr,
        isStart,
        isEnd,
        isInRange
      });
    }
  }

  onCreatorDayClick(day: any) {
    if (!day.date || day.isPast) return;

    if (!this.dateStart || (this.dateStart && this.dateEnd)) {
      // First click of a new range: set start date only
      this.dateStart = day.date;
      this.dateEnd = '';
    } else if (this.dateStart && !this.dateEnd) {
      // Second click: complete range
      if (day.date < this.dateStart) {
        this.dateEnd = this.dateStart;
        this.dateStart = day.date;
      } else {
        this.dateEnd = day.date;
      }
    }

    this.generateCreatorCalendar();
  }

  onDateInputChange() {
    if (this.dateStart) {
      const parts = this.dateStart.split('-');
      if (parts.length === 3) {
        this.creatorCurrentMonth = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    this.generateCreatorCalendar();
  }

  setPresetWeekend() {
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((7 - nextFriday.getDay() + 5) % 7 || 7));
    const nextSunday = new Date(nextFriday);
    nextSunday.setDate(nextSunday.getDate() + 2);

    this.dateStart = nextFriday.toISOString().split('T')[0];
    this.dateEnd = nextSunday.toISOString().split('T')[0];
    this.creatorCurrentMonth = new Date(nextFriday.getFullYear(), nextFriday.getMonth(), 1);
    this.generateCreatorCalendar();
  }

  setPresetWeek() {
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((7 - nextMonday.getDay() + 1) % 7 || 7));
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6);

    this.dateStart = nextMonday.toISOString().split('T')[0];
    this.dateEnd = nextSunday.toISOString().split('T')[0];
    this.creatorCurrentMonth = new Date(nextMonday.getFullYear(), nextMonday.getMonth(), 1);
    this.generateCreatorCalendar();
  }

  setPresetNextMonth() {
    const now = new Date();
    const nextMonthFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthLast = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    this.dateStart = nextMonthFirst.toISOString().split('T')[0];
    this.dateEnd = nextMonthLast.toISOString().split('T')[0];
    this.creatorCurrentMonth = new Date(nextMonthFirst.getFullYear(), nextMonthFirst.getMonth(), 1);
    this.generateCreatorCalendar();
  }

  // --- Gestión de opciones con detalles ---
  addOption() {
    this.options.push({ text: '', description: '' });
    this.expandedOptionIndex = null;
  }

  removeOption(index: number) {
    this.options.splice(index, 1);
    if (this.options.length === 0) this.addOption();
    this.expandedOptionIndex = null;
  }

  moveOption(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= this.options.length) return;
    const [moved] = this.options.splice(index, 1);
    this.options.splice(target, 0, moved);
    this.expandedOptionIndex = null;
  }

  toggleOptionDetails(index: number) {
    this.expandedOptionIndex = this.expandedOptionIndex === index ? null : index;
  }

  isOptionExpanded(index: number): boolean {
    return this.expandedOptionIndex === index || Boolean(this.options[index]?.description?.trim());
  }

  onOptionEnter(event: Event, index: number) {
    event.preventDefault();
    if (index === this.options.length - 1) this.addOption();
  }

  filledOptions(): Array<{ text: string; description: string }> {
    return this.options
      .map(o => ({
        text: (o.text || '').trim(),
        description: (o.description || '').trim()
      }))
      .filter(o => o.text !== '');
  }

  trackByIndex(index: number): number {
    return index;
  }

  validate(): boolean {
    this.validationErrors = [];

    if (!this.title.trim()) {
      this.validationErrors.push('Debes ingresar una pregunta o título para la encuesta.');
    }

    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      const opts = this.filledOptions();
      if (opts.length < 2) {
        this.validationErrors.push('Debes ingresar al menos 2 opciones con nombre.');
      }

      const names = opts.map(o => o.text.toLowerCase());
      if (new Set(names).size !== names.length) {
        this.validationErrors.push('Hay opciones repetidas. Cada opción debe tener un nombre distinto.');
      }

      if (opts.some(o => o.description.length > this.maxOptionDescription)) {
        this.validationErrors.push(`Los detalles de cada opción no pueden pasar de ${this.maxOptionDescription} caracteres.`);
      }
    }

    if (this.type === 'slider') {
      if (this.sliderMin === null || this.sliderMax === null || isNaN(this.sliderMin) || isNaN(this.sliderMax)) {
        this.validationErrors.push('Debes ingresar montos numéricos válidos para el presupuesto.');
      } else if (Number(this.sliderMin) >= Number(this.sliderMax)) {
        this.validationErrors.push('El monto mínimo debe ser menor al monto máximo.');
      } else if (Number(this.sliderMin) < 0) {
        this.validationErrors.push('El monto mínimo no puede ser negativo.');
      }
    }

    if (this.type === 'date') {
      if (!this.dateStart || !this.dateEnd) {
        this.validationErrors.push('Debes seleccionar tanto la fecha de inicio como la fecha de fin.');
      } else if (this.dateStart > this.dateEnd) {
        this.validationErrors.push('La fecha de inicio no puede ser posterior a la fecha de fin.');
      }
    }

    return this.validationErrors.length === 0;
  }

  getDaysCount(): number {
    if (!this.dateStart || !this.dateEnd || this.dateStart > this.dateEnd) return 0;
    const start = new Date(this.dateStart).getTime();
    const end = new Date(this.dateEnd).getTime();
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  submit() {
    if (!this.validate()) return;
    this.isSubmitting = true;

    const payload: any = {
      title: this.title.trim(),
      description: this.description ? this.description.trim() : null,
      type: this.type,
      isAnonymous: this.isAnonymous,
      config: {},
      options: []
    };

    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      payload.options = this.filledOptions().map(o => ({
        text: o.text,
        description: o.description || null
      }));
    }

    if (this.type === 'slider') {
      payload.config = {
        min: Number(this.sliderMin),
        max: Number(this.sliderMax),
        step: Number(this.sliderStep),
        currency: 'MXN'
      };
    }

    if (this.type === 'date') {
      payload.config = {
        startDate: this.dateStart,
        endDate: this.dateEnd
      };
    }

    this.pollService.createPoll(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.created.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.validationErrors = [err.error?.error || 'Error al crear la encuesta. Intenta nuevamente.'];
      }
    });
  }

  resetForm() {
    this.title = '';
    this.description = '';
    this.options = [
      { text: '', description: '' },
      { text: '', description: '' }
    ];
    this.expandedOptionIndex = null;
    this.type = 'multiple_choice';
    this.isAnonymous = false;
    this.validationErrors = [];
  }
}
