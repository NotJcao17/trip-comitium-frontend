import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../services/trip.service';
import { Participant } from '../../../models/trip.interface';

@Component({
  selector: 'app-participants-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './participants-table.component.html',
  styleUrl: './participants-table.component.scss'
})
export class ParticipantsTableComponent implements OnInit {
  private tripService = inject(TripService);

  participants: Participant[] = [];
  isLoading = true;
  isAdding = false;
  newParticipantName = '';
  feedbackMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.loadParticipants();
  }

  loadParticipants() {
    this.tripService.getParticipants().subscribe({
      next: (data) => {
        this.participants = data || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  addParticipant() {
    const cleanName = this.newParticipantName.trim();
    if (!cleanName) return;

    this.isAdding = true;
    this.errorMessage = '';
    this.feedbackMessage = '';

    this.tripService.addParticipant(cleanName).subscribe({
      next: (res) => {
        this.isAdding = false;
        this.newParticipantName = '';
        this.feedbackMessage = res.message || `"${cleanName}" agregado exitosamente.`;
        if (res.participant) {
          this.participants.push(res.participant);
        } else {
          this.loadParticipants();
        }
        setTimeout(() => this.feedbackMessage = '', 4000);
      },
      error: (err) => {
        this.isAdding = false;
        this.errorMessage = err.error?.error || 'No se pudo agregar al participante.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  resetPin(participant: Participant) {
    const id = participant.participant_id || participant.id;
    if (!id) return;

    if (confirm(`¿Deseas restablecer el PIN de ${participant.name}? Podrá registrar una nueva clave al volver a entrar.`)) {
      this.tripService.resetParticipantPin(id).subscribe({
        next: (res) => {
          this.feedbackMessage = res.message || `PIN de ${participant.name} restablecido.`;
          this.loadParticipants();
          setTimeout(() => this.feedbackMessage = '', 4000);
        },
        error: (err) => {
          alert(err.error?.error || 'No se pudo restablecer el PIN.');
        }
      });
    }
  }

  deleteParticipant(participant: Participant) {
    const id = participant.participant_id || participant.id;
    if (!id) return;

    if (confirm(`¿Estás seguro de eliminar a ${participant.name} del viaje? Sus votos también se borrarán.`)) {
      this.tripService.deleteParticipant(id).subscribe({
        next: () => {
          this.participants = this.participants.filter(p => (p.participant_id || p.id) !== id);
          this.feedbackMessage = `${participant.name} ha sido eliminado.`;
          setTimeout(() => this.feedbackMessage = '', 3000);
        },
        error: (err) => console.error('Error deleting participant', err)
      });
    }
  }
}
