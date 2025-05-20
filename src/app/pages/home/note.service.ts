import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

export interface Note {
  id?: number;
  title: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class NoteService {
  private baseUrl = `${environment.apiUrl}/notas`;

  constructor(private http: HttpClient) {}

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.baseUrl);
  }

  addNote(note: Note): Observable<Note> {
    return this.http.post<Note>(this.baseUrl, note);
  }

  updateNote(id: number, updated: Note): Observable<Note> {
    return this.http.put<Note>(`${this.baseUrl}/${id}`, updated);
  }

  deleteNote(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
