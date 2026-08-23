import { Component, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './create-trip.component.html',
  styleUrl: './create-trip.component.scss'
})
export class CreateTripComponent {
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private router = inject(Router);

  formData = {
    tripName: '',
    tripDescription: '',
    adminName: '',
    adminPin: '',
    roomType: 'closed' as 'closed' | 'open'
  };

  rosterList: string[] = [];
  newFriendName: string = '';

  isLoading = false;
  errorMessage = '';
  showPin = false;

  togglePin() {
    this.showPin = !this.showPin;
  }

  setRoomType(type: 'closed' | 'open') {
    this.formData.roomType = type;
  }

  addFriend() {
    const trimmed = this.newFriendName.trim();
    if (trimmed && !this.rosterList.includes(trimmed)) {
      this.rosterList.push(trimmed);
      this.newFriendName = '';
    }
  }

  removeFriend(index: number) {
    this.rosterList.splice(index, 1);
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.formData.tripName || !this.formData.adminName || !this.formData.adminPin) {
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }

    if (!/^\d{4}$/.test(this.formData.adminPin)) {
      this.errorMessage = 'El PIN debe ser exactamente de 4 dígitos numéricos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.tripService.createTrip({
      tripName: this.formData.tripName,
      tripDescription: this.formData.tripDescription,
      adminName: this.formData.adminName,
      adminPin: this.formData.adminPin,
      roomType: this.formData.roomType,
      roster: this.formData.roomType === 'closed' ? this.rosterList : []
    }).subscribe({
      next: (res) => {
        if (res.token) {
          this.authService.saveToken(res.token);
          this.authService.saveRecentTrip({
            shareCode: res.trip.shareCode,
            tripName: res.trip.name,
            participantName: this.formData.adminName,
            isAdmin: true,
            roomType: res.trip.roomType || this.formData.roomType,
            token: res.token,
            lastVisited: Date.now()
          });
        }
        this.router.navigate(['/trip', res.trip.shareCode]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Error al crear la sala. Intenta de nuevo.';
      }
    });
  }
}
