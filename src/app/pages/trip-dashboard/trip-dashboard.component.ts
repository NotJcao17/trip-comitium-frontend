import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../services/auth.service';
import { Trip } from '../../models/trip.interface';
import { Poll } from '../../models/poll.interface';
import { PollCardComponent } from '../../components/poll-card/poll-card.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  imports: [CommonModule, PollCardComponent, EmptyStateComponent, RouterLink],
  templateUrl: './trip-dashboard.component.html',
  styleUrl: './trip-dashboard.component.scss'
})
export class TripDashboardComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  tripService = inject(TripService);
  pollService = inject(PollService);
  authService = inject(AuthService);

  tripCode: string = '';
  tripData: Trip | null = null;
  polls: Poll[] = [];
  isLoading = true;
  error = '';

  // Simulación de votos del usuario (más adelante lo conectaremos real)
  myVotes: Set<number> = new Set();

  ngOnInit() {
    this.tripCode = this.route.snapshot.paramMap.get('code') || '';
    if (this.tripCode) {
      this.loadData();
    }
  }

  loadData() {
    this.isLoading = true;
    // 1. Cargar Info del Viaje
    this.tripService.getTripByCode(this.tripCode).subscribe({
      next: (trip) => {
        this.tripData = trip;

        // 2. Cargar Encuestas (Solo si el viaje existe)
        this.loadPolls();
      },
      error: (err) => {
        this.error = 'No pudimos cargar la información del viaje.';
        this.isLoading = false;
      }
    });
  }

  loadPolls() {
    this.pollService.getPolls().subscribe({
      next: (polls) => {
        this.polls = polls;

        // Fetch user votes to populate myVotes Set
        this.pollService.getMyVotes().subscribe({
          next: (votedPollIds) => {
            this.myVotes = new Set(votedPollIds);
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error loading votes:', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // Navegar a la votación
  goToVote(pollId: number) {
    const poll = this.polls.find(p => p.poll_id === pollId);
    if (poll && poll.status === 'locked') {
      alert('Esta encuesta está cerrada.');
      return;
    }
    this.router.navigate(['/trip', this.tripCode, 'vote', pollId]);
  }

  copyCode() {
    navigator.clipboard.writeText(this.tripCode);
    alert('Código copiado: ' + this.tripCode);
  }
}
