import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-standard-vote',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './standard-vote.component.html',
  styleUrl: './standard-vote.component.scss'
})
export class StandardVoteComponent implements OnInit {
  @Input() poll!: Poll;
  pollService = inject(PollService);

  selectedOptionId: number | null = null;
  textResponse: string = '';

  isSubmitting = false;
  successMessage = '';

  ngOnInit() {
    this.loadMyVote();
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote) {
        if (this.poll.type === 'multiple_choice') {
          this.selectedOptionId = vote.option_id || null;
        } else if (this.poll.type === 'text') {
          this.textResponse = vote.text_response || '';
        }
      }
    });
  }

  submitVote() {
    if (!this.poll.poll_id) return;

    this.isSubmitting = true;

    // Preparamos el payload según el tipo
    const voteData: any = { pollId: this.poll.poll_id };

    if (this.poll.type === 'multiple_choice') {
      if (!this.selectedOptionId) return;
      voteData.optionId = this.selectedOptionId;
    } else {
      if (!this.textResponse.trim()) return;
      voteData.textResponse = this.textResponse;
    }

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Voto registrado!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Error al guardar.');
      }
    });
  }

  selectOption(id: number | undefined) {
    if (id) this.selectedOptionId = id;
  }
}
