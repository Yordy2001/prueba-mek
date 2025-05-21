import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environments';

export interface RegisterData {
  username: string;
  name: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/`;

  constructor(private http: HttpClient) {}

  // Registro
  register(data: RegisterData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}register`, data)
      .pipe(catchError(this.handleError));
  }

  // Login
  login(data: LoginData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}login`, data)
      .pipe(
        map((response: any) => {
          if (response && response.access_token) {
            console.log('Token:', response);
            
            localStorage.setItem('token', response.access_token);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      if (error.status === 0) {
        errorMessage = 'No se pudo conectar al servidor.';
      } else if (error.status === 400 && error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
