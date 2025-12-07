import { Component, Input, Output, EventEmitter } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { Poll } from '../../models/poll.interface';

    @Component({
      selector: 'app-poll-card',
      standalone: true,
      imports: [CommonModule],
      templateUrl: './poll-card.component.html',
      styleUrl: './poll-card.component.scss'
    })
    export class PollCardComponent {
      @Input() poll!: Poll;
      @Input() hasVoted: boolean = false; // Para saber si pintar un check
      @Output() voteClick = new EventEmitter<number>(); // Avisa al padre que le dieron click

      // Helper para iconos según tipo
      getIcon(): string {
        switch (this.poll.type) {
          case 'date': return 'fa-calendar-days';
          case 'slider': return 'fa-money-bill-wave';
          case 'tier_list': return 'fa-ranking-star';
          case 'multiple_choice': return 'fa-list-ul';
          case 'text': return 'fa-comment-dots';
          default: return 'fa-poll';
        }
      }

      // Helper para texto de tipo
      getTypeLabel(): string {
        switch (this.poll.type) {
          case 'date': return 'Fechas';
          case 'slider': return 'Presupuesto';
          case 'tier_list': return 'Ranking';
          case 'multiple_choice': return 'Votación';
          case 'text': return 'Opinión';
          default: return 'Encuesta';
        }
      }

      onCardClick() {
        if (this.poll.poll_id) {
          this.voteClick.emit(this.poll.poll_id);
        }
      }
    }
