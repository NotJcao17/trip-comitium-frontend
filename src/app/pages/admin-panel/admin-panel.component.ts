import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PollService } from '../../services/poll.service';
import { Poll } from '../../models/poll.interface';
import { PollCreatorComponent } from '../../features/voting/poll-creator/poll-creator.component';
import { PollStatsDisplayComponent } from '../../features/voting/poll-stats-display/poll-stats-display.component';
import { ParticipantsTableComponent } from '../../features/voting/participants-table/participants-table.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, PollCreatorComponent, PollStatsDisplayComponent, ParticipantsTableComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  private pollService = inject(PollService);
  private route = inject(ActivatedRoute);

  tripCode: string = '';
  polls: Poll[] = [];
  isLoading = true;

  // Estado para mostrar/ocultar secciones
  showCreator = false;
  selectedPollStats: Poll | null = null; // Si tiene valor, muestra stats de esa encuesta

  ngOnInit() {
    this.tripCode = this.route.snapshot.paramMap.get('code') || '';
    this.loadPolls();
  }

  loadPolls() {
    this.isLoading = true;
    this.pollService.getPolls().subscribe({
      next: (data) => {
        this.polls = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Acciones de Encuesta
  toggleStatus(poll: Poll) {
    const newStatus = poll.status === 'active' ? 'locked' : 'active';
    // Optimismo UI: Actualizamos localmente rápido
    poll.status = newStatus;

    this.pollService.updateStatus(poll.poll_id!, newStatus).subscribe({
      error: () => {
        // Revertir si falla
        poll.status = newStatus === 'active' ? 'locked' : 'active';
        alert('Error al actualizar estado');
      }
    });
  }

  deletePoll(pollId: number) {
    if (!confirm('¿Seguro que quieres borrar esta encuesta? Se perderán todos los votos.')) return;

    this.pollService.deletePoll(pollId).subscribe({
      next: () => {
        this.polls = this.polls.filter(p => p.poll_id !== pollId);
        if (this.selectedPollStats?.poll_id === pollId) {
          this.selectedPollStats = null;
        }
      }
    });
  }

  openStats(poll: Poll) {
    this.selectedPollStats = poll;
    // Scroll removed to prevent layout shift as requested
  }

  onPollCreated() {
    this.showCreator = false;
    this.loadPolls(); // Recargar lista
  }
}
