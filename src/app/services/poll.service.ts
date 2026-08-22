import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Poll, PollCreatePayload, PollStats } from '../models/poll.interface';
import { Vote, VoteSubmitPayload } from '../models/vote.interface';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PollService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // --- ENCUESTAS ---
  getPolls(): Observable<Poll[]> {
    return this.http.get<Poll[]>(`${this.baseUrl}/polls`);
  }

  getPollById(pollId: number): Observable<Poll> {
    return this.http.get<Poll>(`${this.baseUrl}/polls/${pollId}`);
  }

  createPoll(pollData: PollCreatePayload): Observable<{ message: string; pollId: number }> {
    return this.http.post<{ message: string; pollId: number }>(`${this.baseUrl}/polls`, pollData);
  }

  updateStatus(pollId: number, status: 'active' | 'locked' | 'hidden'): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/polls/${pollId}/status`, { status });
  }

  deletePoll(pollId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/polls/${pollId}`);
  }

  // --- VOTOS ---
  submitVote(voteData: VoteSubmitPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/votes`, voteData);
  }

  deleteVote(voteId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/votes/${voteId}`);
  }

  getMyVote(pollId: number): Observable<Vote | null> {
    return this.http.get<Vote | null>(`${this.baseUrl}/votes/${pollId}/my-vote`);
  }

  getMyVotes(): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/votes/my-votes`);
  }

  // --- ESTADÍSTICAS ---
  getPollStats(pollId: number): Observable<PollStats> {
    return this.http.get<PollStats>(`${this.baseUrl}/stats/${pollId}`);
  }

  getStats(pollId: number): Observable<PollStats> {
    return this.getPollStats(pollId);
  }
}
