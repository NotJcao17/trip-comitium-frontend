import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-join-trip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './join-trip.component.html',
  styleUrl: './join-trip.component.scss'
})
export class JoinTripComponent {
  authService = inject(AuthService);
  router = inject(Router);

  formData = {
    shareCode: '',
    name: '',
    accessPin: ''
  };

  isLoading = false;
  errorMessage = '';
  showPin = false;

  togglePin() {
    this.showPin = !this.showPin;
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.formData.shareCode || !this.formData.name || !this.formData.accessPin) {
      this.errorMessage = 'Todos los campos son necesarios.';
      return;
    }

    // Validar PIN de 4 dígitos
    if (!/^\d{4}$/.test(this.formData.accessPin)) {
      this.errorMessage = 'El PIN debe ser de 4 números exactos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.joinTrip(this.formData.shareCode, this.formData.name, this.formData.accessPin).subscribe({
      next: (res) => {
        // Login exitoso, el token ya se guardó en el servicio
        this.router.navigate(['/trip', this.formData.shareCode]);
      },
      error: (err) => {
        this.isLoading = false;
        // Si el error es 401, es credenciales. Si es 404, viaje no existe.
        if (err.status === 404) {
          this.errorMessage = 'Código de viaje no encontrado.';
        } else if (err.status === 401) {
          this.errorMessage = 'Nombre ocupado o PIN incorrecto.';
        } else {
          this.errorMessage = 'Ocurrió un error. Intenta de nuevo.';
        }
      }
    });
  }
}
