import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-budget-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss'
})
export class BudgetSliderComponent implements OnInit {
  @Input() poll!: Poll;
  pollService = inject(PollService);

  amount: number = 0;
  isSubmitting = false;
  successMessage = '';

  // Configuración por defecto
  min = 0;
  max = 10000;
  step = 100;
  currency = 'MXN';

  ngOnInit() {
    // Cargar configuración si existe
    if (this.poll.config) {
      this.min = this.poll.config.min || 0;
      this.max = this.poll.config.max || 10000;
      this.step = this.poll.config.step || 100;
      this.currency = this.poll.config.currency || 'MXN';
    }
    // Valor inicial a la mitad
    this.amount = (this.max + this.min) / 2;

    this.loadMyVote();
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote && vote.vote_value && vote.vote_value.amount) {
        this.amount = vote.vote_value.amount;
      }
    });
  }

  submitVote() {
    if (!this.poll.poll_id) return;

    this.isSubmitting = true;

    // Guardamos como JSON: { "amount": 5000 }
    const voteData = {
      pollId: this.poll.poll_id,
      voteValue: { amount: this.amount }
    };

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Presupuesto guardado!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Error al guardar.');
      }
    });
  }
}
