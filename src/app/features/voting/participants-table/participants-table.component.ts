import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../services/trip.service';
import { Participant } from '../../../models/trip.interface';

@Component({
  selector: 'app-participants-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participants-table.component.html',
  styleUrl: './participants-table.component.scss'
})
export class ParticipantsTableComponent implements OnInit {
  tripService = inject(TripService);

  participants: Participant[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadParticipants();
  }

  loadParticipants() {
    this.tripService.getParticipants().subscribe({
      next: (data) => {
        this.participants = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  deleteParticipant(participant: Participant) {
    if (confirm(`¿Estás seguro de eliminar a ${participant.name}?`)) {
      this.tripService.deleteParticipant(participant.participant_id!).subscribe({
        next: () => {
          this.participants = this.participants.filter(p => p.participant_id !== participant.participant_id);
        },
        error: (err) => console.error('Error deleting participant', err)
      });
    }
  }
}
