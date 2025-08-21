import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { SEOReportResponse } from '../../../../models/seo-report';
import { SeoReportService } from '../../../../services/seo-report/seo-report.service';

@Component({
  selector: 'app-seo-report-detail',
  standalone: true,
    imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  templateUrl: './seo-report-detail.component.html',
  styleUrl: './seo-report-detail.component.css'
})
export class SeoReportDetailComponent implements OnInit {
  report: SEOReportResponse | null = null;
  isLoading = true;
  reportId!: number;
  
  keywordEntries: [string, number][] = [];
  phraseEntries: [string, number][] = [];

  constructor(
    private route: ActivatedRoute,
    private seoReportService: SeoReportService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.reportId = +params['id'];
      this.loadReport();
    });
  }

  loadReport(): void {
    this.isLoading = true;
    this.seoReportService.getReport(this.reportId).subscribe({
      next: (report) => {
        this.report = report;
        if (report.keywords) {
          this.keywordEntries = Object.entries(report.keywords)
            .sort((a, b) => b[1] - a[1]);
        }
        
        if (report.phrases) {
          this.phraseEntries = Object.entries(report.phrases)
            .sort((a, b) => b[1] - a[1]);
        }
        
        this.isLoading = false;
        console.log(report)
      },
      error: (error) => {
        console.error('Error loading SEO report:', error);
        this.isLoading = false;
      }
    });
  }

  downloadReportPdf(): void {
    if (!this.report) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`SEO Report: ${this.report.url}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    doc.setFontSize(14);
    doc.text('Overview', 14, 40);
    
    const scoreData = [
      ['Average Score', this.report.average_score.toFixed(1)],
      ['Pages Analyzed', this.report.total_pages_analyzed.toString()],
      ['Server', this.report.server_info.server],
      ['CMS', this.report.server_info.cms || 'Not detected']
    ];
    
    (doc as any).autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: scoreData,
      theme: 'striped'
    });
    
    if (this.report.pages && this.report.pages.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY || 45;
      doc.text('Page Details', 14, lastY + 10);
      
      const pageData = this.report.pages.map(page => [
        page.url,
        page.seo_score.toFixed(1),
        page.grade,
        page.load_time_ms.toString() + 'ms'
      ]);
      
      (doc as any).autoTable({
        startY: lastY + 15,
        head: [['URL', 'Score', 'Grade', 'Load Time']],
        body: pageData,
        theme: 'striped'
      });
    }
        if (this.keywordEntries.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY || 45;
      doc.text('Top Keywords', 14, lastY + 10);
      
      const keywordData = this.keywordEntries.slice(0, 10).map(([keyword, count]) => [
        keyword,
        count.toString()
      ]);
      
      (doc as any).autoTable({
        startY: lastY + 15,
        head: [['Keyword', 'Count']],
        body: keywordData,
        theme: 'striped'
      });
    }
    
    doc.save(`seo-report-${this.report.url.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  }

  downloadReportHtml(): void {
    if (!this.report) return;
    window.open(`/seo-report/${this.reportId}/download`, '_blank');
  }

  getScoreColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  }

  getGradeClass(grade: string): string {
    switch(grade.toUpperCase()) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-lime-100 text-lime-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}