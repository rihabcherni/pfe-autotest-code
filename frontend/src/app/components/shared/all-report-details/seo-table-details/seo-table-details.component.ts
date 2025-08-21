import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-seo-table-details',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './seo-table-details.component.html',
  styleUrls: ['./seo-table-details.component.css']
})
export class SeoTableDetailsComponent {
  @Input() report: any;
  apiUrl = `${environment.apiUrl}`;
  objectKeys = Object.keys;
  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.style.display = 'none';
  }
  getFilteredKeywords(): string[] {
    return this.report?.seo_details?.keywords
      ? Object.keys(this.report.seo_details.keywords)
          .filter(key => this.report.seo_details.keywords[key] > 2)
      : [];
  }
  getFilteredPhrases(): string[] {
    return this.report?.seo_details?.phrases
      ? Object.keys(this.report.seo_details.phrases)
          .filter(phrase => this.report.seo_details.phrases[phrase] > 2)
      : [];
  }
}
