import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, Participant, RosterResponse } from '../models/trip.interface';
import { environment } from '../environments/environment';

export interface CreateTripPayload {
  tripName: string;
  tripDescription?: string;
  adminName: string;
  adminPin: string;
  roomType?: 'open' | 'closed';
  roster?: string[];
}

export interface CreateTripResponse {
  message: string;
  trip: {
    id: number;
    name: string;
    shareCode: string;
    roomType?: 'open' | 'closed';
  };
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trips`;

  // 1. Crear Viaje
  createTrip(tripData: CreateTripPayload): Observable<CreateTripResponse> {
    return this.http.post<CreateTripResponse>(this.apiUrl, tripData);
  }

  // 2. Obtener Info Básica del Viaje (Público, por código)
  getTripByCode(code: string): Observable<Trip> {
    return this.http.get<Trip>(`${this.apiUrl}/${code}`);
  }

  // 3. Obtener Roster de Participantes para salas cerradas (Público)
  getRosterByCode(code: string): Observable<RosterResponse> {
    return this.http.get<RosterResponse>(`${this.apiUrl}/${code}/roster`);
  }

  // 4. Obtener participantes del viaje (Autenticado)
  getParticipants(): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/participants`);
  }

  // 5. Restablecer PIN de un participante (Solo Admin)
  resetParticipantPin(participantId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/participants/${participantId}/reset-pin`, {});
  }

  // 6. Eliminar participante (Solo Admin)
  deleteParticipant(participantId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/participants/${participantId}`);
  }
}
