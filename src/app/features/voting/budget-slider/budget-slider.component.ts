import { Component, Input, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Poll, PollStats } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-budget-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './budget-slider.component.html',
  styleUrl: './budget-slider.component.scss'
})
export class BudgetSliderComponent implements OnInit {
  @Input({ required: true }) poll!: Poll;
  private pollService = inject(PollService);

  amount: number = 0;
  isSubmitting = false;
  successMessage = '';
  stats: PollStats | null = null;

  min = 1000;
  max = 30000;
  step = 500;
  currency = 'MXN';

  ngOnInit() {
    if (this.poll.config) {
      this.min = this.poll.config.min || 1000;
      this.max = this.poll.config.max || 30000;
      this.step = this.poll.config.step || 500;
      this.currency = this.poll.config.currency || 'MXN';
    }
    this.amount = (this.max + this.min) / 2;

    this.loadMyVote();
    this.loadStats();
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote && vote.vote_value) {
        const val = typeof vote.vote_value === 'string' ? JSON.parse(vote.vote_value) : vote.vote_value;
        if (val && val.amount) {
          this.amount = val.amount;
        }
      }
    });
  }

  loadStats() {
    if (!this.poll.poll_id) return;
    this.pollService.getPollStats(this.poll.poll_id).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => console.warn('Could not load stats:', err)
    });
  }

  submitVote() {
    if (!this.poll.poll_id || this.poll.status === 'locked' || this.isSubmitting) return;

    this.isSubmitting = true;

    const voteData = {
      pollId: this.poll.poll_id,
      voteValue: { amount: this.amount }
    };

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Tu presupuesto ha sido guardado!';
        this.loadStats();
        setTimeout(() => this.successMessage = '', 3500);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.error || 'Error al guardar el presupuesto.');
      }
    });
  }
}
