import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface RecentTrip {
  shareCode: string;
  tripName: string;
  participantName: string;
  isAdmin?: boolean;
  roomType?: string;
  token?: string;
  lastVisited: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'trip_token';
  private recentTripsKey = 'tc_recent_trips';

  // 1. Unirse o Registrarse (Login unificado)
  joinTrip(shareCode: string, name: string, accessPin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/join`, { shareCode, name, accessPin }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.saveToken(response.token);
          this.saveRecentTrip({
            shareCode: response.trip?.shareCode || shareCode.toUpperCase(),
            tripName: response.trip?.name || 'Viaje Activo',
            participantName: response.user?.name || name,
            isAdmin: Boolean(response.user?.isAdmin),
            roomType: response.trip?.roomType,
            token: response.token,
            lastVisited: Date.now()
          });
        }
      })
    );
  }

  // 2. Guardar Token en localStorage
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // 3. Obtener Token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 4. Obtener Información del Usuario del Token
  getUser(): { id: number; name: string; isAdmin: boolean; tripId: number } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  // 5. Cerrar Sesión
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/']);
  }

  // 6. Verificar si está logueado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // 7. Verificar si es Admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user ? Boolean(user.isAdmin) : false;
  }

  // 8. Persistencia de Viajes Recientes en este dispositivo
  getRecentTrips(): RecentTrip[] {
    try {
      const raw = localStorage.getItem(this.recentTripsKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveRecentTrip(trip: RecentTrip): void {
    try {
      const list = this.getRecentTrips().filter(t => t.shareCode !== trip.shareCode);
      list.unshift(trip);
      localStorage.setItem(this.recentTripsKey, JSON.stringify(list.slice(0, 8)));
    } catch (e) {
      console.warn('No se pudo guardar en recientes:', e);
    }
  }

  removeRecentTrip(shareCode: string): void {
    try {
      const list = this.getRecentTrips().filter(t => t.shareCode !== shareCode);
      localStorage.setItem(this.recentTripsKey, JSON.stringify(list));
    } catch (e) {
      console.warn('No se pudo eliminar de recientes:', e);
    }
  }

  switchToTrip(trip: RecentTrip): void {
    if (trip.token) {
      this.saveToken(trip.token);
    }
    trip.lastVisited = Date.now();
    this.saveRecentTrip(trip);
    this.router.navigate(['/trip', trip.shareCode]);
  }

  getActiveTripCode(): string | null {
    const recents = this.getRecentTrips();
    return recents.length > 0 ? recents[0].shareCode : null;
  }
}
