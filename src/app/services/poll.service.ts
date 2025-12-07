import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Poll } from '../models/poll.interface';
import { Vote } from '../models/vote.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = 'http://localhost:3000/api';

  private getHeaders() {
    return {
      headers: new HttpHeaders({
        'auth-token': this.authService.getToken() || ''
      })
    };
  }

  // --- ENCUESTAS ---
  getPolls(): Observable<Poll[]> {
    return this.http.get<Poll[]>(`${this.baseUrl}/polls`, this.getHeaders());
  }

  getPollById(pollId: number): Observable<Poll> {
    return this.http.get<Poll>(`${this.baseUrl}/polls/${pollId}`, this.getHeaders());
  }

  createPoll(pollData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/polls`, pollData, this.getHeaders());
  }

  updateStatus(pollId: number, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/polls/${pollId}/status`, { status }, this.getHeaders());
  }

  deletePoll(pollId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/polls/${pollId}`, this.getHeaders());
  }

  // --- VOTOS ---
  submitVote(voteData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/votes`, voteData, this.getHeaders());
  }

  deleteVote(voteId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/votes/${voteId}`, this.getHeaders());
  }

  getMyVote(pollId: number): Observable<Vote> {
    return this.http.get<Vote>(`${this.baseUrl}/votes/${pollId}/my-vote`, this.getHeaders());
  }

  getMyVotes(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/votes/my-votes`, this.getHeaders());
  }

  // --- ESTADÍSTICAS ---
  getStats(pollId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats/${pollId}`, this.getHeaders());
  }
}
