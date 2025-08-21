import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-download',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatSortModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './download.component.html',
  styleUrl: './download.component.css'
})
export class DownloadComponent {
  isDownloading = false;

  @Input() exportToPDF!: () => Promise<void>;
  @Input() exportToHTML!: () => Promise<void>;
  @Input() exportToCSV!: () => Promise<void>;
  @Input() downloadAllAsZip!: () => Promise<void>;

  async handleDownload(format: string) {
    if (this.isDownloading) return;
    this.isDownloading = true;

    const formatMethodMap: { [key: string]: () => Promise<void> } = {
      pdf: this.exportToPDF,
      html: this.exportToHTML,
      csv: this.exportToCSV,
      zip: this.downloadAllAsZip,
    };

    try {
      await formatMethodMap[format]?.();
    } catch (error) {
      console.error(`Error during ${format.toUpperCase()} export`, error);
    } finally {
      this.isDownloading = false;
    }
  }
}
