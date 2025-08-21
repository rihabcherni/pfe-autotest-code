import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { TitleComponent } from "../../../../components/shared/title/title.component";
import { Reports } from '../../../../models/report';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { DownloadComponent } from '../../../../components/shared/download/download.component';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../../services/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FonctionnelTableDetailsComponent } from "../../../../components/shared/all-report-details/fonctionnel-table-details/fonctionnel-table-details.component";
import { ReportsService } from '../../../../services/reports/reports.service';
import { SearchInputComponent } from "../../../../components/shared/search-input/search-input.component";
import saveAs from 'file-saver';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { FunctionalReportDialogComponent } from './functional-report-dialog/functional-report-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FunctionalReportService } from '../../../../services/functional-report/functional_report.service';

@Component({
  selector: 'app-fonctionnel-all-reports',
  standalone: true,
  imports: [
    MatExpansionModule, MatProgressSpinnerModule, CommonModule, MatMenuModule, MatPaginator,
    MatFormFieldModule, MatInputModule, MatIconModule,
    MatButtonModule, TitleComponent,
    DownloadComponent,
    FonctionnelTableDetailsComponent,
    SearchInputComponent
],
  templateUrl: './fonctionnel-all-reports.component.html',
  styleUrl: './fonctionnel-all-reports.component.css'
})
export class FonctionnelAllReportsComponent implements AfterViewInit, OnInit {
  titleValue = "Functional Scan (Reports)";
  userId!: number;
  displayedColumns: string[] = ['scan_type', 'url', 'status', 'scan_started_at', 'scan_finished_at'];
  dataSource = new MatTableDataSource<Reports>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  isDownloading = false;
  currentReport: Reports | null = null;
  searchTerm: string = '';
  defaultPageSize = 5;
  paginatedData: Reports[] = [];

  constructor(
    private details_functionalService: FunctionalReportService, 
    private report_service: ReportsService,private authService: AuthService,   
    private dialog: MatDialog,private snackBar: MatSnackBar  ) {}
  openNewReportDialog(): void {
    const dialogRef = this.dialog.open(FunctionalReportDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.loadReports();
          this.snackBar.open('New functional report added!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }
  ngOnInit() {
    this.loadReports();
  }

  loadReports(): void {
    this.userId = this.authService.getUserId()!;
    if (!this.userId) return;

    this.details_functionalService.getFunctionalReports(this.userId).subscribe({
      next: (reports) => {
        this.dataSource.data = reports;
        this.updatePaginatedData();
        if (this.paginator) {
          this.paginator.firstPage();
        }
      },
      error: (err) => {
        console.error('Error loading functional reports', err);
        this.snackBar.open('Error loading reports', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
  exportAllToPdf() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Functional Scan Reports Summary', 14, 20);
    
    const tableColumn = ["Scan Type", "URL", "Status"];
    const tableRows: any[] = [];
    
    this.dataSource.data.forEach(report => {
      const reportData = [
        report.scan_type,
        report.url,
        report.status
      ];
      tableRows.push(reportData);
    });
    
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] }
    });
    
    doc.save('all_functional_reports.pdf');
  }
  exportToPDF = async (): Promise<void> => {
    if (!this.currentReport) {
      this.showMessage('No report selected for export', 'error');
      return;
    }
    
    this.isDownloading = true;
    
    try {
      this.showMessage('Generating PDF report...', 'info');
      await this.generateSingleReportPDF(this.currentReport);
      this.showMessage('PDF report generated successfully!', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      this.showMessage('Failed to generate PDF report', 'error');
    } finally {
      this.isDownloading = false;
    }
  }
  exportToHTML = async (): Promise<void> => {
    if (!this.currentReport) {
      this.showMessage('No report selected for export', 'error');
      return;
    }
    
    this.isDownloading = true;
    
    try {
      this.showMessage('Generating HTML report...', 'info');
      await this.generateSingleReportHTML(this.currentReport);
      this.showMessage('HTML report generated successfully!', 'success');
    } catch (error) {
      console.error('HTML generation error:', error);
      this.showMessage('Failed to generate HTML report', 'error');
    } finally {
      this.isDownloading = false;
    }
  }
  exportToCSV = async (): Promise<void> => {
    if (!this.currentReport) {
      this.showMessage('No report selected for export', 'error');
      return;
    }
    
    this.isDownloading = true;
    
    try {
      this.showMessage('Generating CSV report...', 'info');
      await this.generateSingleReportCSV(this.currentReport);
      this.showMessage('CSV report generated successfully!', 'success');
    } catch (error) {
      console.error('CSV generation error:', error);
      this.showMessage('Failed to generate CSV report', 'error');
    } finally {
      this.isDownloading = false;
    }
  }
  downloadAllAsZip = async (): Promise<void> => {
    if (!this.currentReport) {
      this.showMessage('No report selected for export', 'error');
      return;
    }
    this.isDownloading = true;
    try {
      this.showMessage('Generating complete package...', 'info');
      await Promise.all([
        this.generateSingleReportPDF(this.currentReport, false),
        this.generateSingleReportHTML(this.currentReport, false),
        this.generateSingleReportCSV(this.currentReport, false)
      ]);  
      this.showMessage('Complete package generated successfully!', 'success');
    } catch (error) {
      console.error('Package generation error:', error);
      this.showMessage('Failed to generate complete package', 'error');
    } finally {
      this.isDownloading = false;
    }
  }
  setCurrentReport(report: Reports): void {
    this.currentReport = report;
  }
  private async generateSingleReportPDF(report: Reports, download: boolean = true): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Functional Report`, 14, 20);
        doc.setFontSize(14);
        doc.text(`Scan Type: ${report.scan_type}`, 14, 35);
        doc.text(`URL: ${report.url}`, 14, 45);
        doc.text(`Status: ${report.status}`, 14, 55);
        doc.text(`Start Date: ${new Date(report.scan_started_at).toLocaleString()}`, 14, 65);
        doc.text(`End Date: ${new Date(report.scan_finished_at).toLocaleString()}`, 14, 75);
        if (report.functional_details) {
          doc.setFontSize(16);
          doc.text('Functional Analysis', 14, 95);
          doc.setFontSize(12);
        }
        
        if (download) {
          const fileName = `Functional-report-${report.id || 'unknown'}-${new Date().toISOString().slice(0, 10)}.pdf`;
          doc.save(fileName);
        }
        
        resolve();
      }, 500); 
    });
  }
  private async generateSingleReportHTML(report: Reports, download: boolean = true): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let htmlContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Functional Report - ${report.url}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 40px; 
                background-color: #f5f5f5;
              }
              .container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 { 
                color: #2c3e50; 
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
              }
              h2 { 
                color: #34495e; 
                margin-top: 30px;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
              }
              .info-item {
                background-color: #ecf0f1;
                padding: 15px;
                border-radius: 5px;
              }
              .info-label {
                font-weight: bold;
                color: #2c3e50;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Functional Scan Report</h1>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Scan Type:</div>
                  <div>${report.scan_type}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Target URL:</div>
                  <div>${report.url}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status:</div>
                  <div>${report.status}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Scan Duration:</div>
                  <div>${new Date(report.scan_started_at).toLocaleString()} - ${new Date(report.scan_finished_at).toLocaleString()}</div>
                </div>
              </div>
        `;

        if (report.functional_details) {
          htmlContent += `
              <h2>Functional Analysis Summary</h2>
          `;
        }

        if (download) {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const fileName = `Functional-report-${report.id || 'unknown'}-${new Date().toISOString().slice(0, 10)}.html`;
          this.downloadBlob(blob, fileName);
        }
        
        resolve();
      }, 300);
    });
  }
  private async generateSingleReportCSV(report: Reports, download: boolean = true): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const csvRows = [];        
        csvRows.push([
          'Report ID',
          'Scan Type',
          'Target URL',
          'Status',
          'Start Date',
          'End Date'
        ]);
        const row = [
          report.id || 'N/A',
          report.scan_type || 'N/A',
          report.url || 'N/A',
          report.status || 'N/A',
          new Date(report.scan_started_at).toLocaleString(),
          new Date(report.scan_finished_at).toLocaleString(),
        ];
        csvRows.push(row);        
        const csvContent = csvRows.map(row => 
          row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        if (download) {
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          const fileName = `Functional-report-${report.id || 'unknown'}-${new Date().toISOString().slice(0, 10)}.csv`;
          this.downloadBlob(blob, fileName);
        }
        
        resolve();
      }, 200);
    });
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
    const availableFormats = ['pdf', 'html', 'csv', 'zip'];
    return availableFormats.includes(format.toLowerCase());
  }
  getEstimatedSize(format: string): string {
    const sizes: { [key: string]: string } = {
      'pdf': '~2-5 MB',
      'html': '~500 KB',
      'csv': '~100 KB',
      'zip': '~3-8 MB'
    };
    return sizes[format] || 'Unknown';
  }
  deleteReport(report: Reports, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const confirmed = confirm(`Are you sure you want to delete this report for ${report.url}?`);
    
    if (confirmed) {
      this.report_service.deleteReport(report.id).subscribe({
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
  capitalize(value: string | null | undefined): string {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
