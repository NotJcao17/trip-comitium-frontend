import { Component, Output, EventEmitter, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
export class PollCreatorComponent {
  private pollService = inject(PollService);
  @Output() created = new EventEmitter<void>();

  title = '';
  type = 'multiple_choice';
  optionsText = '';
  sliderMin = 1000;
  sliderMax = 30000;
  sliderStep = 500;
  dateStart = '';
  dateEnd = '';
  isSubmitting = false;

  submit() {
    if (!this.title.trim()) return;
    this.isSubmitting = true;

    const payload: any = {
      title: this.title.trim(),
      type: this.type,
      config: {},
      options: []
    };

    if (this.type === 'multiple_choice' || this.type === 'tier_list') {
      payload.options = this.optionsText.split('\n').map(o => o.trim()).filter(o => o !== '');
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
        alert(err.error?.error || 'Error al crear la encuesta');
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
