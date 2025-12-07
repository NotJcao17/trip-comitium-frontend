import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Poll } from '../../../models/poll.interface';
import { PollService } from '../../../services/poll.service';

@Component({
  selector: 'app-tier-list-sort',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './tier-list-sort.component.html',
  styleUrl: './tier-list-sort.component.scss'
})
export class TierListSortComponent implements OnInit {
  @Input() poll!: Poll;
  pollService = inject(PollService);

  // Estructura de Tiers
  // Estructura de Tiers
  tiers = [
    { id: 'S', label: 'S', color: 'var(--tier-s)', items: [] as string[] },
    { id: 'A', label: 'A', color: 'var(--tier-a)', items: [] as string[] },
    { id: 'B', label: 'B', color: 'var(--tier-b)', items: [] as string[] },
    { id: 'D', label: 'D', color: 'var(--tier-d)', items: [] as string[] },
    { id: 'E', label: 'E', color: 'var(--tier-e)', items: [] as string[] },
    { id: 'Unranked', label: 'Pool', color: '#334155', items: [] as string[] } // Banco inicial
  ];

  // IDs de las listas conectadas para el Drag&Drop
  connectedLists: string[] = ['pool-list', 'tier-S', 'tier-A', 'tier-B', 'tier-D', 'tier-E'];

  isSubmitting = false;
  successMessage = '';

  ngOnInit() {
    // Llenar el banco inicial con las opciones de la encuesta
    if (this.poll.options) {
      this.tiers[5].items = this.poll.options.map(o => o.text);
    }
    this.loadMyVote();
  }

  loadMyVote() {
    if (!this.poll.poll_id) return;
    this.pollService.getMyVote(this.poll.poll_id).subscribe(vote => {
      if (vote && vote.vote_value) {
        // Reconstruir estado desde el JSON guardado { "Pizza": "S", "Sushi": "A" }
        const savedTiers = vote.vote_value;

        // Limpiar banco
        this.tiers[5].items = [];

        // Distribuir items
        this.poll.options?.forEach(opt => {
          const rank = savedTiers[opt.text];
          if (rank) {
            const targetTier = this.tiers.find(t => t.id === rank);
            if (targetTier) targetTier.items.push(opt.text);
          } else {
            this.tiers[5].items.push(opt.text); // Si no tenía rank, al banco
          }
        });
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {
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
    if (!this.poll.poll_id) return;

    this.isSubmitting = true;

    // Convertir la estructura visual a JSON para guardar { Item: Rank }
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
        this.successMessage = '¡Ranking guardado!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isSubmitting = false;
        alert('Error al guardar.');
      }
    });
  }
}
