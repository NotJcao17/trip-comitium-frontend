import { Component, Input, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Poll, PollStats } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';
import { AuthService } from '../../../services/auth.service';
import { VotersListComponent } from '../../../components/voters-list/voters-list.component';

@Component({
  selector: 'app-standard-vote',
  standalone: true,
  imports: [CommonModule, FormsModule, VotersListComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './standard-vote.component.html',
  styleUrl: './standard-vote.component.scss'
})
export class StandardVoteComponent implements OnInit {
  @Input({ required: true }) poll!: Poll;
  private pollService = inject(PollService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  selectedOptionId: number | null = null;
  textResponse: string = '';
  stats: PollStats | null = null;

  isSubmitting = false;
  successMessage = '';

  ngOnInit() {
    this.loadMyVote();
    this.loadStats();
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

  loadStats() {
    if (!this.poll.poll_id) return;
    this.pollService.getPollStats(this.poll.poll_id).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (err) => console.warn('Could not load poll stats:', err)
    });
  }

  /** Opciones cuya descripción larga está desplegada por completo. */
  private expandedDescriptions = new Set<number>();
  readonly descriptionClampLength = 220;

  isDescriptionLong(description: string | null | undefined): boolean {
    return Boolean(description && description.length > this.descriptionClampLength);
  }

  isDescriptionExpanded(optionId: number | undefined): boolean {
    return optionId ? this.expandedDescriptions.has(optionId) : false;
  }

  toggleDescription(optionId: number | undefined, event: Event) {
    event.stopPropagation();
    if (!optionId) return;
    if (this.expandedDescriptions.has(optionId)) {
      this.expandedDescriptions.delete(optionId);
    } else {
      this.expandedDescriptions.add(optionId);
    }
  }

  selectOption(id: number | undefined) {
    if (id && this.poll.status !== 'locked') {
      this.selectedOptionId = id;
    }
  }

  getVotersForOption(optionId: number | undefined): Array<{ id: number; name: string }> {
    if (!optionId || !this.stats?.votersByOption) return [];
    return this.stats.votersByOption[optionId] || [];
  }

  getVotesCount(optionId: number | undefined): number {
    if (!optionId || !this.stats?.results) return 0;
    return this.stats.results[optionId] || 0;
  }

  submitVote() {
    if (!this.poll.poll_id || this.poll.status === 'locked' || this.isSubmitting) return;

    const voteData: any = { pollId: this.poll.poll_id };

    if (this.poll.type === 'multiple_choice') {
      if (!this.selectedOptionId) return;
      voteData.optionId = this.selectedOptionId;
    } else {
      if (!this.textResponse.trim()) return;
      voteData.textResponse = this.textResponse.trim();
    }

    this.isSubmitting = true;

    this.pollService.submitVote(voteData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Tu voto ha sido registrado correctamente!';

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
        alert(err.error?.error || 'Error al guardar el voto.');
      }
    });
  }
}
