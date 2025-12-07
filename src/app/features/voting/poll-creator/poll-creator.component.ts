import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-poll-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poll-creator.component.html',
  styleUrl: './poll-creator.component.scss'
})
export class PollCreatorComponent {
  pollService = inject(PollService);
  @Output() created = new EventEmitter<void>();

  // Modelo del formulario
  title = '';
  type = 'multiple_choice'; // Default

  // Opciones dinámicas (para Multiple Choice / Tier List)
  optionsText = '';

  // Configuración (para Slider / Date)
  sliderMin = 0;
  sliderMax = 10000;
  sliderStep = 100;

  dateStart = '';
  dateEnd = '';

  isSubmitting = false;

  submit() {
    if (!this.title) return;
    this.isSubmitting = true;

    // Preparar payload
    const payload: any = {
      title: this.title,
      type: this.type,
      config: {},
      options: []
    };

    // Lógica específica por tipo
    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      // Convertir texto de opciones (separado por enters) a array
      payload.options = this.optionsText.split('\n').filter(o => o.trim() !== '');
    }

    if (this.type === 'slider') {
      payload.config = {
        min: this.sliderMin,
        max: this.sliderMax,
        step: this.sliderStep,
        currency: 'MXN'
      };
    }

    if (this.type === 'date') {
      // Configurar fechas bloqueadas o rangos aquí si quisiéramos
      payload.config = {
        startDate: this.dateStart,
        endDate: this.dateEnd
      };
    }

    this.pollService.createPoll(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.resetForm();
        this.created.emit(); // Avisar al padre
      },
      error: () => {
        this.isSubmitting = false;
        alert('Error al crear encuesta');
      }
    });
  }

  resetForm() {
    this.title = '';
    this.optionsText = '';
    this.dateStart = '';
    this.dateEnd = '';
    this.type = 'multiple_choice';
  }
}
