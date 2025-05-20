import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { NoteService } from './note.service';
import { Note } from './note.service';

@Injectable({ providedIn: 'root' })
export class OfflineNoteService {
  private readonly offlineKey = 'offline_notes';

  constructor(private noteService: NoteService) {
    window.addEventListener('online', () => this.syncNotes());
  }

  async saveOffline(note: Note): Promise<void> {
    const current = (await localforage.getItem<Note[]>(this.offlineKey)) || [];
    current.push(note);
    await localforage.setItem(this.offlineKey, current);
  }

  async syncNotes(): Promise<void> {
    const offlineNotes = (await localforage.getItem<Note[]>(this.offlineKey)) || [];

    for (const note of offlineNotes) {
      await this.noteService.addNote(note).toPromise();
    }

    await localforage.removeItem(this.offlineKey);
  }

  async hasOfflineNotes(): Promise<boolean> {
    const notes = await localforage.getItem<Note[]>(this.offlineKey);
    return !!notes && notes.length > 0;
  }
}
