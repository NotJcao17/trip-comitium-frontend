import { Component, Input, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-tier-list-sort',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './tier-list-sort.component.html',
  styleUrl: './tier-list-sort.component.scss'
})
export class TierListSortComponent implements OnInit {
  @Input({ required: true }) poll!: Poll;
  private pollService = inject(PollService);

  tiers = [
    { id: 'S', label: 'S', color: '#f59e0b', items: [] as string[] },
    { id: 'A', label: 'A', color: 'var(--sage-400)', items: [] as string[] },
    { id: 'B', label: 'B', color: '#60a5fa', items: [] as string[] },
    { id: 'C', label: 'C', color: '#a78bfa', items: [] as string[] },
    { id: 'Unranked', label: 'Sin clasificar', color: 'var(--mono-muted)', items: [] as string[] }
  ];

  connectedLists: string[] = ['tier-S', 'tier-A', 'tier-B', 'tier-C', 'tier-Unranked'];

  isSubmitting = false;
  successMessage = '';

  ngOnInit() {
    if (this.poll.options) {
      this.tiers[4].items = this.poll.options.map(o => o.text);
    }
    this.loadMyVote();
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote && vote.vote_value) {
        let savedTiers = vote.vote_value;
        if (typeof savedTiers === 'string') {
          try { savedTiers = JSON.parse(savedTiers); } catch { savedTiers = {}; }
        }

        this.tiers.forEach(t => t.items = []);

        this.poll.options?.forEach(opt => {
          const rank = savedTiers[opt.text];
          if (rank) {
            const targetTier = this.tiers.find(t => t.id === rank);
            if (targetTier) targetTier.items.push(opt.text);
            else this.tiers[4].items.push(opt.text);
          } else {
            this.tiers[4].items.push(opt.text);
          }
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.poll.status === 'locked') return;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
  }

  submitVote() {
    if (!this.poll.poll_id || this.poll.status === 'locked' || this.isSubmitting) return;

    this.isSubmitting = true;

    const voteValue: any = {};
    this.tiers.forEach(tier => {
      if (tier.id !== 'Unranked') {
        tier.items.forEach(item => {
          voteValue[item] = tier.id;
        });
      }
    });

    this.pollService.submitVote({
      pollId: this.poll.poll_id,
      voteValue: voteValue
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '¡Tu clasificación ha sido guardada!';
        setTimeout(() => this.successMessage = '', 3500);
      },
      error: (err) => {
        this.isSubmitting = false;
        alert(err.error?.error || 'Error al guardar.');
      }
    });
  }
}
