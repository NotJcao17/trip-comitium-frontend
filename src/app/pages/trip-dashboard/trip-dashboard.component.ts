import { Component, OnInit, OnDestroy, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TripService } from '../../services/trip.service';
import { PollService } from '../../services/poll.service';
import { AuthService } from '../../services/auth.service';
import { Trip, Participant } from '../../models/trip.interface';
import { Poll } from '../../models/poll.interface';
import { PollCardComponent } from '../../components/poll-card/poll-card.component';

@Component({
  selector: 'app-trip-dashboard',
  standalone: true,
  imports: [CommonModule, PollCardComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './trip-dashboard.component.html',
  styleUrl: './trip-dashboard.component.scss'
})
export class TripDashboardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripService = inject(TripService);
  private pollService = inject(PollService);
  authService = inject(AuthService);

  tripCode: string = '';
  tripData: Trip | null = null;
  participants: Participant[] = [];
  polls: Poll[] = [];
  myVotes: Set<number> = new Set();
  
  isLoading = true;
  error = '';
  copiedCode = false;
  feedbackMessage = '';

  private routeSub: Subscription | null = null;

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const codeFromUrl = params.get('code');
      if (codeFromUrl) {
        this.tripCode = codeFromUrl;
      } else {
        const active = this.authService.getActiveTripCode();
        if (active) {
          this.tripCode = active;
        } else {
          const recents = this.authService.getRecentTrips();
          this.tripCode = recents.length > 0 ? recents[0].shareCode : '';
        }
      }

      // Feedback de votación
      const voted = this.route.snapshot.queryParamMap.get('voted');
      const title = this.route.snapshot.queryParamMap.get('title');
      if (voted === '1') {
        this.feedbackMessage = title ? `¡Tu voto en "${title}" fue registrado exitosamente!` : '¡Tu voto ha sido guardado!';
        setTimeout(() => this.feedbackMessage = '', 5000);
      }

      if (this.tripCode) {
        this.loadData();
      } else {
        this.isLoading = false;
        this.error = 'No se encontró un código de viaje activo.';
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadData() {
    this.isLoading = true;
    this.error = '';

    this.tripService.getTripByCode(this.tripCode).subscribe({
      next: (trip) => {
        this.tripData = trip;
        this.loadParticipants();
        this.loadPolls();
      },
      error: (err) => {
        this.error = err.error?.error || 'No pudimos cargar la información del viaje.';
        this.isLoading = false;
      }
    });
  }

  loadParticipants() {
    this.tripService.getParticipants().subscribe({
      next: (parts) => {
        this.participants = parts || [];
      },
      error: (err) => {
        console.warn('Error loading participants:', err);
      }
    });
  }

  loadPolls() {
    this.pollService.getPolls().subscribe({
      next: (polls) => {
        this.polls = polls || [];
        this.pollService.getMyVotes().subscribe({
          next: (votedPollIds) => {
            this.myVotes = new Set(votedPollIds || []);
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goToVote(pollId: number) {
    this.router.navigate(['/trip', this.tripCode, 'vote', pollId]);
  }

  copyCode() {
    navigator.clipboard.writeText(this.tripCode);
    this.copiedCode = true;
    setTimeout(() => {
      this.copiedCode = false;
    }, 2500);
  }
}
