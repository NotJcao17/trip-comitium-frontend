import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip.interface';
import { AuthService } from './auth.service';
import { Participant } from '../models/trip.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/trips`;

  // Helper para poner el token en los headers
  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'auth-token': token || ''
      })
    };
  }

  // 1. Crear Viaje
  createTrip(tripData: { tripName: string, tripDescription: string, adminName: string, adminPin: string }): Observable<any> {
    return this.http.post(this.apiUrl, tripData);
  }

  // 2. Obtener Info Básica del Viaje (Público, por código)
  getTripByCode(code: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${code}`);
  }

  getParticipants(): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/participants`, this.getHeaders());
  }

  deleteParticipant(participantId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/participants/${participantId}`, this.getHeaders());
  }
}
