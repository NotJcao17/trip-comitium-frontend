import { Component, Output, EventEmitter, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../services/poll.service';

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
  optionsText = '';
  sliderMin = 1000;
  sliderMax = 30000;
  sliderStep = 500;
  dateStart = '';
  dateEnd = '';
  todayDateStr = '';

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
  }

  validate(): boolean {
    this.validationErrors = [];

    if (!this.title.trim()) {
      this.validationErrors.push('Debes ingresar una pregunta o título para la encuesta.');
    }

    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      const opts = this.optionsText.split('\n').map(o => o.trim()).filter(o => o !== '');
      if (opts.length < 2) {
        this.validationErrors.push('Debes ingresar al menos 2 opciones válidas (una por renglón).');
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
      config: {},
      options: []
    };

    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      payload.options = this.optionsText.split('\n').map(o => o.trim()).filter(o => o !== '');
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
    this.optionsText = '';
    this.type = 'multiple_choice';
    this.validationErrors = [];
  }
}
