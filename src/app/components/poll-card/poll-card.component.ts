import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poll } from '../../models/poll.interface';

@Component({
  selector: 'app-poll-card',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './poll-card.component.html',
  styleUrl: './poll-card.component.scss'
})
export class PollCardComponent {
  @Input({ required: true }) poll!: Poll;
  @Input() hasVoted: boolean = false;
  @Output() voteClick = new EventEmitter<number>();

  onCardClick() {
    this.voteClick.emit(this.poll.poll_id);
  }

  getSolarIcon(): string {
    switch (this.poll.type) {
      case 'date': return 'solar:calendar-bold';
      case 'tier_list': return 'solar:ranking-bold';
      case 'slider': return 'solar:wad-of-money-bold';
      case 'multiple_choice': return 'solar:checklist-bold';
      case 'text': return 'solar:notes-bold';
      default: return 'solar:widget-bold';
    }
  }

  getTypeLabel(): string {
    switch (this.poll.type) {
      case 'date': return 'Calendario de Fechas';
      case 'tier_list': return 'Tier List';
      case 'slider': return 'Presupuesto Grupal';
      case 'multiple_choice': return 'Opción Múltiple';
      case 'text': return 'Propuesta Libre';
      default: return 'Encuesta';
    }
  }
}
