import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SEOReportResponse } from '../../../../models/seo-report';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FormsModule } from '@angular/forms';
import { SeoReportDialogComponent } from './seo-report-dialog/seo-report-dialog.component';
import { SeoReportService } from '../../../../services/seo-report/seo-report.service';
import { TitleComponent } from "../../../../components/shared/title/title.component";



@Component({
  selector: 'app-seo-scan',
  standalone: true,
  imports: [FormsModule,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule, TitleComponent],
  templateUrl: './seo-scan.component.html',
  styleUrl: './seo-scan.component.css'
})
export class SeoScanComponent implements OnInit {
  titleValue = 'SEO Scanner';
  displayedColumns: string[] = ['url', 'average_score', 'total_pages_analyzed', 'status', 'actions'];
  dataSource = new MatTableDataSource<SEOReportResponse>([]);
  isLoading = false;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private seoReportService: SeoReportService,
    private router: Router,
    private dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.loadReports();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadReports() {
    this.isLoading = true;
    this.seoReportService.getAllReports().subscribe({
      next: (reports) => {
        this.dataSource.data = reports;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading SEO reports:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  openNewReportDialog() {
    const dialogRef = this.dialog.open(SeoReportDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.seoReportService.createReport(result).subscribe({
          next: (response) => {
            this.loadReports();
          },
          error: (error) => {
            console.error('Error creating report:', error);
            this.isLoading = false;
          }
        });
      }
    });
  }
  viewReport(report: SEOReportResponse) {
    console.log("report.id", report.id)
    this.router.navigate(['/tesworkflow.model.tster/seo-report', report.id]);
  }
  deleteReport(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this report?')) {
      this.seoReportService.deleteReport(id).subscribe({
        next: () => {
          this.loadReports();
        },
        error: (error) => {
          console.error('Error deleting report:', error);
        }
      });
    }
  }
  downloadReportPdf(report: SEOReportResponse, event: Event) {
    event.stopPropagation();
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`SEO Report: ${report.url}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    doc.setFontSize(14);
    doc.text('Overview', 14, 40);
    
    const scoreData = [
      ['Average Score', report.average_score.toFixed(1)],
      ['Pages Analyzed', report.total_pages_analyzed.toString()],
      ['Server', report.server_info.server],
      ['CMS', report.server_info.cms || 'Not detected']
    ];
    
    (doc as any).autoTable({
      startY: 45,
      head: [['Metric', 'Value']],
      body: scoreData,
      theme: 'striped'
    });
    if (report.pages && report.pages.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY || 45;
      doc.text('Page Details', 14, lastY + 10);
      
      const pageData = report.pages.map(page => [
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
    doc.save(`seo-report-${report.url.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
  }
  downloadReportHtml(report: SEOReportResponse, event: Event) {
    event.stopPropagation();
    window.open(`/seo-report/${report.url}/download`, '_blank');
  }
  getScoreColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 70) return 'orange';
    return 'red';
  }
  getScoreClass(score: number): string {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }
}