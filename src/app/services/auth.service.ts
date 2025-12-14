import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';// Importar

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL base de tu API - que coincida con el back
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'trip_token';

  // 1. Unirse o Registrarse (Login unificado)
  joinTrip(shareCode: string, name: string, accessPin: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/join`, { shareCode, name, accessPin }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.saveToken(response.token);
        }
      })
    );
  }

  // 2. Guardar Token en localStorage
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // 3. Obtener Token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 4. Cerrar Sesión
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/']);
  }

  // 5. Verificar si está logueado
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // 6. Verificar si es Admin (Decodificando el token manualmente por simplicidad)
  isAdmin(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.isAdmin === true;
    } catch (e) {
      return false;
    }
  }
}
