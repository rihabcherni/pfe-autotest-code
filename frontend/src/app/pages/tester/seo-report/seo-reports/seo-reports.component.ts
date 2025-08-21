import { Component, ViewChild } from '@angular/core';
import { TitleComponent } from "../../../../components/shared/title/title.component";
import { SeoReportDetailComponent } from "../../../../components/tester/seo-report/seo-report-detail/seo-report-detail.component";
import { MatTableDataSource } from '@angular/material/table';
import { Reports } from '../../../../models/report';
import { ReportsService } from '../../../../services/reports/reports.service';
import { AuthService } from '../../../../services/auth/auth.service';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SeoTableDetailsComponent } from '../../../../components/shared/all-report-details/seo-table-details/seo-table-details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDivider } from '@angular/material/divider';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DownloadComponent } from "../../../../components/shared/download/download.component";
import { SearchInputComponent } from "../../../../components/shared/search-input/search-input.component";
import { Router } from '@angular/router';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { SeoReportDialogComponent } from '../seo-scan/seo-report-dialog/seo-report-dialog.component';
import { MatDialog } from '@angular/material/dialog';
@Component({
  selector: 'app-seo-reports',
  standalone: true,
  imports: [MatExpansionModule, CommonModule, MatMenuModule, MatPaginator, MatDivider, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, TitleComponent,
    SeoTableDetailsComponent, DownloadComponent, SearchInputComponent],
  templateUrl: './seo-reports.component.html',
  styleUrl: './seo-reports.component.css'
})
export class SeoReportsComponent {
  titleValue="SEO Scanner (Reports)";
  searchTerm: string = '';
  defaultPageSize = 5;
  paginatedData: Reports[] = [];
  userId!: number;
  displayedColumns: string[] = ['scan_type', 'url', 'status', 'scan_started_at', 'scan_finished_at'];
  dataSource = new MatTableDataSource<Reports>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  constructor(private reportsService: ReportsService, private authService: AuthService, 
    private router: Router,  
     private http: HttpClient,private snackBar: MatSnackBar,   private dialog: MatDialog,
  ) {}
  ngOnInit() {
    this.loadReports();
  }
   viewTestResults(report: Reports): void {
    if (report.id) {
      this.router.navigate(['/tester/seo-scan-results', report.id]);
    } else {
      this.showMessage('Report ID not available', 'error');
    }
  }
    deleteReport(report: Reports, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const confirmed = confirm(`Are you sure you want to delete this report for ${report.url}?`);
    
    if (confirmed) {
      this.reportsService.deleteReport(report.id).subscribe({
        next: () => {
          const currentData = this.dataSource.data;
          const updatedData = currentData.filter(r => r.id !== report.id);
          this.dataSource.data = updatedData;
          
          this.showMessage('Report deleted successfully', 'success');
        },
        error: (err) => {
          console.error('Error deleting report:', err);
          this.showMessage('Failed to delete report', 'error');
        }
      });
    }
  }
    exportToPDF = async (): Promise<void> => {
   
  }
  exportToHTML = async (): Promise<void> => {
 
  }
  exportToCSV = async (): Promise<void> => {
  }
  downloadAllAsZip = async (): Promise<void> => {
  
  }

  openNewReportDialog(): void {
    this.dialog.open(SeoReportDialogComponent, {
      width: '600px'
    });
  }
  loadReports(): void {
    this.userId = this.authService.getUserId()!;
    if (!this.userId) {
      return;
    }
    this.reportsService.getSeoReports(this.userId).subscribe({
      next: (reports) => {
        this.dataSource.data = reports;
        console.log('Rapports Seo pour userId', this.userId, reports);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des rapports Seo', err);
      }
    });
  }
  updatePaginatedData() {
    if (!this.paginator || !this.dataSource?.filteredData) return;

    const pageSize = this.paginator.pageSize || this.defaultPageSize;
    const pageIndex = this.paginator.pageIndex || 0;
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    this.paginatedData = this.dataSource.filteredData.slice(startIndex, endIndex);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    setTimeout(() => this.updatePaginatedData(), 0);
    this.paginator.page.subscribe(() => {
      this.updatePaginatedData();
    });
  }
  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.updatePaginatedData();
  }
  hasHighRisk(report: Reports): boolean {
    return !!report.security_details && report.security_details.total_High > 0;
  }
  hasMediumRisk(report: Reports): boolean {
    return !this.hasHighRisk(report) && !!report.security_details && report.security_details.total_Medium > 0;
  }
  hasLowRisk(report: Reports): boolean {
    return !this.hasHighRisk(report) && !this.hasMediumRisk(report);
  }
  getStatusIcon(report: Reports): string {
    switch(report.status.toLowerCase()) {
      case 'completed':
        return 'check_circle';
      case 'in progress':
        return 'hourglass_top';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  }
  getStatusIconClass(report: Reports): string {
    switch(report.status.toLowerCase()) {
      case 'completed':
        return 'text-green-500';
      case 'in progress':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  }
  isDownloading = false;
  async downloadReport(report: any, format: string): Promise<void> {
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;
    
    try {
      const url = `/reports/download-report/${format}`;
      const params = {
        reportId: report.id,
      };
      this.showMessage(`Preparing ${format.toUpperCase()} report...`, 'info');
      const response = await this.http.get(url, {
        params,
        responseType: 'blob', 
        observe: 'response'
      }).toPromise();

      if (response && response.body) {
        const fileName = this.getFileNameFromResponse(response, format, report);
        
        this.downloadBlob(response.body, fileName);
        this.showMessage(`${format.toUpperCase()} report downloaded successfully!`, 'success');
      }

    } catch (error) {
      console.error('Download error:', error);
      this.handleDownloadError(error, format);
    } finally {
      this.isDownloading = false;
    }
  }

  private getFileNameFromResponse(response: any, format: string, report: any): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const reportId = report.id || 'unknown';
    return `security-report-${reportId}-${timestamp}.${format}`;
  }
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
  private handleDownloadError(error: any, format: string): void {
    let message = `Failed to download ${format.toUpperCase()} report.`;
    
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 404:
          message = `${format.toUpperCase()} format is not available for this report.`;
          break;
        case 403:
          message = 'You do not have permission to download this report.';
          break;
        case 500:
          message = 'Server error occurred while generating the report.';
          break;
        case 0:
          message = 'Network error. Please check your connection.';
          break;
        default:
          if (error.error && error.error.message) {
            message = error.error.message;
          }
      }
    }
    this.showMessage(message, 'error');
  }
  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    const config = {
      duration: type === 'error' ? 5000 : 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
    };
    this.snackBar.open(message, 'Close', config);
  }
  isFormatAvailable(format: string): boolean {
    const availableFormats = ['pdf', 'html', 'csv', 'xml', 'zip'];
    return availableFormats.includes(format.toLowerCase());
  }
  getEstimatedSize(format: string): string {
    const sizes: { [key: string]: string } = {
      'pdf': '~2-5 MB',
      'html': '~500 KB',
      'csv': '~100 KB',
      'xml': '~200 KB',
      'zip': '~3-8 MB'
    };
    return sizes[format] || 'Unknown';
  }
  exportReportToPdf(report: any): void {
    this.downloadReport(report, 'pdf');
  }
  exportReportToHtml(report: any): void {
    this.downloadReport(report, 'html');
  }
  exportReportToCsv(report: any): void {
    this.downloadReport(report, 'csv');
  }
 exportAllToCSV = async () => {
    const headers = ['ID', 'Scan Type', 'URL', 'Status', 'Schedule', 'Started At', 'Finished At'];

    const rows = this.dataSource.filteredData.map(report => [
      report.id || 'N/A',
      report.scan_type || 'N/A',
      report.url || 'N/A',
      report.status || 'N/A',
      this.getScheduleText(report.schedule_scan) || 'N/A',
      report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A',
      report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'reports.csv');
  }
    exportAllReportsToPDF = async () => {
      const doc = new jsPDF('l');
      const headers = [['ID', 'Scan Type', 'URL', 'Status', 'Schedule', 'Started At', 'Finished At']];
      const rows = this.dataSource.filteredData.map(report => [
        report.id.toString(),
        report.scan_type,
        report.url,
        report.status,
        this.getScheduleText(report.schedule_scan) || 'N/A',
        report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A',
        report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A'
      ]);
  
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        columnStyles: {
          2: { cellWidth: 40 },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 }
        }
      });
  
      doc.save('reports.pdf');
    }
    getScheduleText(isScheduled: boolean): string {
      return isScheduled ? 'Scheduled' : 'Immediate';
    }
    exportAllToHTML = async () => {
      const headers = ['ID', 'Scan Type', 'URL', 'Status', 'Schedule', 'Started At', 'Finished At'];

      const rows = this.dataSource.filteredData.map(report => {
        const startedAt = report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A';
        const finishedAt = report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A';

        return `
          <tr>
            <td>${report.id || 'N/A'}</td>
            <td>${report.scan_type || 'N/A'}</td>
            <td>${report.url || 'N/A'}</td>
            <td>${report.status || 'N/A'}</td>
            <td>${this.getScheduleText(report.schedule_scan) || 'N/A'}</td>
            <td>${startedAt}</td>
            <td>${finishedAt}</td>
          </tr>`;
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Reports List</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #fff; }
              h1 { color: #333; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; }
              th { background-color: #f2f2f2; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <h1>Reports List</h1>
            <table>
              <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows.join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      saveAs(blob, 'reports.html');
    }
  async downloadAllReportAsZip() {
    const zip = new JSZip();
    const headers = ['ID', 'Scan Type', 'URL', 'Status', 'Schedule', 'Started At', 'Finished At'];
    const csvRows = this.dataSource.filteredData.map(report => [
      report.id ?? 'N/A',
      report.scan_type ?? 'N/A',
      report.url ?? 'N/A',
      report.status ?? 'N/A',
      this.getScheduleText(report.schedule_scan) ?? 'N/A',
      report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A',
      report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A'
    ]);
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    zip.file('reports.csv', csvContent);
    const htmlTableRows = this.dataSource.filteredData.map(report => {
      const startedAt = report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A';
      const finishedAt = report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A';

      return `
        <tr>
          <td>${report.id ?? 'N/A'}</td>
          <td>${report.scan_type ?? 'N/A'}</td>
          <td>${report.url ?? 'N/A'}</td>
          <td>${report.status ?? 'N/A'}</td>
          <td>${this.getScheduleText(report.schedule_scan) ?? 'N/A'}</td>
          <td>${startedAt}</td>
          <td>${finishedAt}</td>
        </tr>`;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Reports List</title>
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Reports List</h1>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${htmlTableRows.join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    zip.file('reports.html', htmlContent);
    const pdfDoc = new jsPDF('l');
    autoTable(pdfDoc, {
      head: [headers],
      body: this.dataSource.filteredData.map(report => [
        report.id?.toString() ?? 'N/A',
        report.scan_type ?? 'N/A',
        report.url ?? 'N/A',
        report.status ?? 'N/A',
        this.getScheduleText(report.schedule_scan) ?? 'N/A',
        report.scan_started_at ? new Date(report.scan_started_at).toLocaleString() : 'N/A',
        report.scan_finished_at ? new Date(report.scan_finished_at).toLocaleString() : 'N/A'
      ]),
      styles: { fontSize: 8 },
      columnStyles: {
        2: { cellWidth: 40 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 }
      }
    });
    const pdfBlob = pdfDoc.output('blob');
    zip.file('reports.pdf', pdfBlob);
    zip.generateAsync({ type: 'blob' }).then(zipBlob => {
      saveAs(zipBlob, 'all_reports.zip');
    });
  }
}


