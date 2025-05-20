import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OfflineNoteService } from './pages/home/offile-note.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'prueba-front';
  constructor(
    private offlineNoteService: OfflineNoteService
  ) {
    if (navigator.onLine) {
    this.offlineNoteService.syncNotes();
  }
  }
}
