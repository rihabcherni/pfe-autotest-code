import { Component } from '@angular/core';
import { SeoReportDetailComponent } from "../../../../components/tester/seo-report/seo-report-detail/seo-report-detail.component";
import { TitleComponent } from "../../../../components/shared/title/title.component";

@Component({
  selector: 'app-seo-scan-results',
  standalone: true,
  imports: [SeoReportDetailComponent, TitleComponent],
  templateUrl: './seo-scan-results.component.html',
  styleUrl: './seo-scan-results.component.css'
})
export class SeoScanResultsComponent {
  titleValue="SEO Scanner (Results)";
}
