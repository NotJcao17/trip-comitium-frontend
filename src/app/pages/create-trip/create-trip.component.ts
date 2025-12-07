import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TripService } from '../../services/trip.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-trip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-trip.component.html',
  styleUrl: './create-trip.component.scss'
})
export class CreateTripComponent {
  tripService = inject(TripService);
  authService = inject(AuthService);
  router = inject(Router);

  // Modelo del formulario
  formData = {
    tripName: '',
    tripDescription: '',
    adminName: '',
    adminPin: ''
  };

  isLoading = false;
  errorMessage = '';
  showPin = false;

  togglePin() {
    this.showPin = !this.showPin;
  }

  onSubmit() {
    if (this.isLoading) return;

    // Validación simple
    if (!this.formData.tripName || !this.formData.adminName || !this.formData.adminPin) {
      this.errorMessage = 'Por favor completa los campos obligatorios.';
      return;
    }

    // Validar PIN de 4 dígitos
    if (!/^\d{4}$/.test(this.formData.adminPin)) {
      this.errorMessage = 'El PIN debe ser de 4 números exactos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.tripService.createTrip(this.formData).subscribe({
      next: (res) => {
        // El backend devuelve el token, lo guardamos
        if (res.token) {
          localStorage.setItem('trip_token', res.token); // O usar authService.saveToken si lo hiciste público
        }
        // Redirigir al panel de admin del nuevo viaje
        this.router.navigate(['/trip', res.trip.shareCode, 'admin']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || 'Error al crear el viaje. Intenta de nuevo.';
      }
    });
  }
}
