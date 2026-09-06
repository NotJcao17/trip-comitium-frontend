import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService, RecentTrip } from '../../services/auth.service';
import { TripService } from '../../services/trip.service';

@Component({
  selector: 'app-join-trip',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './join-trip.component.html',
  styleUrl: './join-trip.component.scss'
})
export class JoinTripComponent implements OnInit {
  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  formData = {
    shareCode: '',
    name: '',
    accessPin: ''
  };

  roomType: 'open' | 'closed' | null = null;
  rosterParticipants: Array<{ id?: number; name: string; isClaimed?: boolean }> = [];
  recentTrips: RecentTrip[] = [];

  isLoading = false;
  isCheckingRoom = false;
  errorMessage = '';
  showPin = false;

  /**
   * El PIN se enmascara con CSS para no usar `type="password"`, que en Chrome
   * activa el gestor de contraseñas y su aviso de credencial filtrada por un
   * PIN de cuatro dígitos. Donde `-webkit-text-security` no exista, volvemos
   * a `type="password"` para no dejar el PIN a la vista.
   */
  readonly maskWithCss =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('-webkit-text-security', 'disc');

  ngOnInit() {
    this.recentTrips = this.authService.getRecentTrips();

    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.formData.shareCode = params['code'].toUpperCase();
        this.onCodeBlur();
      }
    });
  }

  togglePin() {
    this.showPin = !this.showPin;
  }

  onCodeBlur() {
    const code = this.formData.shareCode ? this.formData.shareCode.trim().toUpperCase() : '';
    if (!code || code.length < 4) {
      this.roomType = null;
      this.rosterParticipants = [];
      return;
    }

    this.isCheckingRoom = true;
    this.tripService.getRosterByCode(code).subscribe({
      next: (res) => {
        this.isCheckingRoom = false;
        this.roomType = res.roomType;
        this.rosterParticipants = res.participants || [];
      },
      error: () => {
        this.isCheckingRoom = false;
        this.roomType = null;
        this.rosterParticipants = [];
      }
    });
  }

  reconnectRecent(recent: RecentTrip) {
    this.formData.shareCode = recent.shareCode;
    this.formData.name = recent.participantName;
    this.onCodeBlur();
  }

  onSubmit() {
    if (this.isLoading) return;

    if (!this.formData.shareCode || !this.formData.name || !this.formData.accessPin) {
      this.errorMessage = 'Por favor completa todos los campos (Código, Nombre y PIN).';
      return;
    }

    if (!/^\d{4}$/.test(this.formData.accessPin)) {
      this.errorMessage = 'El PIN debe ser exactamente de 4 dígitos numéricos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.joinTrip(this.formData.shareCode, this.formData.name, this.formData.accessPin).subscribe({
      next: () => {
        this.router.navigate(['/trip', this.formData.shareCode.trim().toUpperCase()]);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.errorMessage = 'Código de viaje no encontrado. Verifica con tu organizador.';
        } else if (err.status === 401) {
          this.errorMessage = err.error?.error || 'PIN incorrecto. Si olvidaste tu PIN, pide al administrador restablecer tu acceso.';
        } else if (err.status === 403) {
          this.errorMessage = err.error?.error || 'Esta sala es cerrada. Selecciona tu nombre de la lista de invitados.';
        } else {
          this.errorMessage = err.error?.error || 'Error al entrar a la sala. Intenta de nuevo.';
        }
      }
    });
  }
}
