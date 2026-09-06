import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../services/auth.service';
import { Poll } from '../../models/poll.interface';
import { PollCreatorComponent } from '../../features/voting/poll-creator/poll-creator.component';
import { PollStatsDisplayComponent } from '../../features/voting/poll-stats-display/poll-stats-display.component';
import { ParticipantsTableComponent } from '../../features/voting/participants-table/participants-table.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, PollCreatorComponent, PollStatsDisplayComponent, ParticipantsTableComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  private pollService = inject(PollService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  tripCode: string = '';
  polls: Poll[] = [];
  isLoading = true;

  showCreator = false;
  selectedPollStats: Poll | null = null;

  private routeSub: Subscription | null = null;

  ngOnInit() {
    // La ruta /admin no lleva el código en la URL (a diferencia de
    // /trip/:code/admin), así que lo recuperamos de la sesión guardada.
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.tripCode = params.get('code') || this.resolveTripCodeFromSession();
    });
    this.loadPolls();
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }

  private resolveTripCodeFromSession(): string {
    const active = this.authService.getActiveTripCode();
    if (active) return active;
    const recents = this.authService.getRecentTrips();
    return recents.length > 0 ? recents[0].shareCode : '';
  }

  loadPolls() {
    this.isLoading = true;
    this.pollService.getPolls().subscribe({
      next: (data) => {
        this.polls = data || [];
        this.isLoading = false;
        if (this.polls.length > 0 && !this.selectedPollStats) {
          this.selectedPollStats = this.polls[0];
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  toggleStatus(poll: Poll) {
    const newStatus = poll.status === 'active' ? 'locked' : 'active';
    poll.status = newStatus;

    this.pollService.updateStatus(poll.poll_id!, newStatus).subscribe({
      error: () => {
        poll.status = newStatus === 'active' ? 'locked' : 'active';
        alert('Error al actualizar estado');
      }
    });
  }

  deletePoll(pollId: number) {
    if (!confirm('¿Seguro que deseas eliminar esta encuesta? Se borrarán todos los votos asociados.')) return;

    this.pollService.deletePoll(pollId).subscribe({
      next: () => {
        this.polls = this.polls.filter(p => p.poll_id !== pollId);
        if (this.selectedPollStats?.poll_id === pollId) {
          this.selectedPollStats = this.polls.length > 0 ? this.polls[0] : null;
        }
      }
    });
  }

  openStats(poll: Poll) {
    this.selectedPollStats = poll;
  }

  onPollCreated() {
    this.showCreator = false;
    this.loadPolls();
  }
}
