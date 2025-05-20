import { Component, ViewChild, TemplateRef, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { QuillModule } from 'ngx-quill';
import { MatCardModule } from '@angular/material/card';

import { NoteService, Note } from './note.service';
import { tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { OfflineNoteService } from './offile-note.service';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatListModule,
    QuillModule,
    MatCardModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;
  dialogRef!: MatDialogRef<any>;
  noteForm!: FormGroup;
  submitted = false;
  notes: Note[] = [];

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private noteService: NoteService,
    private authService: AuthService,
    private offlineNoteService: OfflineNoteService,
    private route: Router,
  ) { }

  ngOnInit(): void {
    this.loadNotes();

    this.noteForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      content: ['', [Validators.required]]
    });
  }

  get f() {
    return this.noteForm.controls;
  }

  loadNotes() {
    this.noteService.getNotes()
      .pipe(tap((notes) => this.notes = notes))
      .subscribe((notes) => {
        this.notes = notes
      });
  }

  openDialog() {
    this.noteForm.reset();
    this.submitted = false;
    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '650px',
      disableClose: true
    });
  }

  logOut() {
    this.authService.logout();
    this.route.navigate(['/login']);
  }

  // exportNoteAsPDF(note: Note) {
  //   const element = document.createElement('div');
  //   element.innerHTML = `
  //     <h1>${note.title}</h1>
  //     <div>${note.content}</div>
  //   `;

  //   html2pdf().from(element).set({
  //     margin: 10,
  //     filename: `${note.title}.pdf`,
  //     html2canvas: { scale: 2 },
  //     jsPDF: { format: 'a4', orientation: 'portrait' }
  //   }).save();
  // }

  exportNoteAsMarkdown(note: Note) {
    // Limpia HTML básico a texto plano (puedes usar librerías para limpieza más precisa si deseas)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.description;
    const plainText = tempDiv.innerText;

    const markdown = `# ${note.title}\n\n${plainText}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${note.title}.md`;
    anchor.click();

    window.URL.revokeObjectURL(url);
  }

  async onSubmit() {
    this.submitted = true;
    if (this.noteForm.invalid) return;

    const newNote: Note = {
      title: this.noteForm.value.title,
      description: this.noteForm.value.content
    };

    if (navigator.onLine) {
      this.noteService.addNote(newNote)
        .subscribe(() => {
          this.dialogRef.close();
          this.loadNotes();
        });
    } else {
      await this.offlineNoteService.saveOffline(newNote);
      alert('Nota guardada localmente. Se sincronizará al reconectarse.');
      this.dialogRef.close();
    }
  }

  async exportNoteAsPDF(note: Note) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const titleSize = 20;
    const contentSize = 12;
    const margin = 50;

    page.drawText(note.title, {
      x: margin,
      y: height - margin,
      size: titleSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Convertir el contenido HTML a texto plano
    const plainText = this.stripHtml(note.description);

    // Dividir en líneas para ajustar el contenido
    const lines = this.splitTextIntoLines(plainText, 90);
    let currentY = height - margin - titleSize - 20;

    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y: currentY,
        size: contentSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= 20;
    }

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length > maxCharsPerLine) {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }

    if (currentLine.trim() !== '') {
      lines.push(currentLine.trim());
    }

    return lines;
  }
}
