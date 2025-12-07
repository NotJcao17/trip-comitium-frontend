import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.interface';
import { PollContainerComponent } from '../../features/voting/poll-container/poll-container.component';

@Component({
  selector: 'app-vote-page',
  standalone: true,
  imports: [CommonModule, RouterLink, PollContainerComponent],
  templateUrl: './vote-page.component.html',
  styleUrl: './vote-page.component.scss'
})
export class VotePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private pollService = inject(PollService);

  pollId: number = 0;
  tripCode: string = '';
  poll: Poll | null = null;
  isLoading = true;
  error = '';

  ngOnInit() {
    // 1. Obtener parámetros de la URL
    this.tripCode = this.route.snapshot.paramMap.get('code') || '';
    const idParam = this.route.snapshot.paramMap.get('pollId');

    if (idParam) {
      this.pollId = +idParam;
      this.loadPoll();
    } else {
      this.error = 'ID de encuesta inválido';
      this.isLoading = false;
    }
  }

  loadPoll() {
    // 2. Llamar al servicio (que ahora conecta con tu Backend real)
    this.pollService.getPollById(this.pollId).subscribe({
      next: (data) => {
        if (data.status === 'locked') {
          this.error = 'Esta encuesta ya ha finalizado.';
          this.isLoading = false;
          return;
        }
        this.poll = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No pudimos cargar la encuesta. Verifica tu conexión.';
        this.isLoading = false;
      }
    });
  }
}
