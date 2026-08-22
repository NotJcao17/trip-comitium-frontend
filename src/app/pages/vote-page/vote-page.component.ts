import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.interface';
import { PollContainerComponent } from '../../features/voting/poll-container/poll-container.component';

@Component({
  selector: 'app-vote-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PollContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './vote-page.component.html',
  styleUrl: './vote-page.component.scss'
})
export class VotePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pollService = inject(PollService);

  tripCode: string = '';
  pollId: number = 0;
  poll: Poll | null = null;
  isLoading = true;
  error = '';

  ngOnInit() {
    this.tripCode = this.route.snapshot.paramMap.get('code') || '';
    this.pollId = Number(this.route.snapshot.paramMap.get('pollId'));

    if (this.pollId) {
      this.loadPoll();
    } else {
      this.error = 'Identificador de encuesta no válido.';
      this.isLoading = false;
    }
  }

  loadPoll() {
    this.isLoading = true;
    this.pollService.getPollById(this.pollId).subscribe({
      next: (data) => {
        this.poll = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'No se pudo cargar la encuesta.';
        this.isLoading = false;
      }
    });
  }

  getPollTypeLabel(): string {
    if (!this.poll) return '';
    switch (this.poll.type) {
      case 'date': return 'Disponibilidad de Fechas';
      case 'tier_list': return 'Tier List';
      case 'slider': return 'Presupuesto Grupal';
      case 'multiple_choice': return 'Opción Múltiple';
      case 'text': return 'Propuesta Abierta';
      default: return 'Encuesta';
    }
  }
}
