import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DownloadComponent } from "../../../components/shared/download/download.component";
import { TitleComponent } from "../../../components/shared/title/title.component";
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { SearchInputComponent } from "../../../components/shared/search-input/search-input.component";

interface Report {
  id: number;
  scan_type: string;
  schedule_scan: boolean;
  scan_started_at: string;
  scan_finished_at: string;
  url: string;
  status: string;
  user: {
    first_name: string;
    last_name: string;
    profile_image: string;
  };
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, MatSelectModule, FormsModule, MatOptionModule, MatTableModule, MatInputModule,
    MatButtonModule, MatIconModule, MatPaginatorModule, MatSortModule, MatFormFieldModule,
    MatChipsModule, MatMenuModule, MatDialogModule, DownloadComponent, TitleComponent,
    SearchInputComponent
],
  providers: [DatePipe],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  displayedColumns: string[] = ['user','url', 'scan_type',  'status', 'schedule_scan', 'scan_started_at', 'scan_finished_at', 'actions'];
  dataSource = new MatTableDataSource<Report>([]);
  searchTerm: string = '';
  selectedScanType: string = '';
  originalReports: Report[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  titleValue = "Reports";

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.http.get<Report[]>(`${environment.apiUrl}/reports/`).subscribe({
      next: (data: Report[]) => {
        this.originalReports = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.setupSortingDataAccessor();
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        Swal.fire('Error', 'Unable to load reports.', 'error');
      }
    });
  }

  setupSortingDataAccessor() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'scan_type': return item.scan_type?.toLowerCase();
        case 'url': return item.url?.toLowerCase();
        case 'user': return `${item.user.first_name} ${item.user.last_name}`.toLowerCase();
        case 'status': return item.status?.toLowerCase();
        case 'schedule_scan': return item.schedule_scan ? 'scheduled' : 'immediate';
        case 'scan_started_at': return new Date(item.scan_started_at).getTime();
        case 'scan_finished_at': return new Date(item.scan_finished_at).getTime();
        default: return (item as any)[property];
      }
    };
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm?.trim().toLowerCase() || '';
    const scanType = this.selectedScanType;

    this.dataSource.data = this.originalReports.filter(report => {
      const matchesSearch = term === '' ||
        report.id.toString().includes(term) ||
        report.url?.toLowerCase().includes(term) ||
        report.user?.first_name?.toLowerCase().includes(term) ||
        report.user?.last_name?.toLowerCase().includes(term) ||
        report.scan_type?.toLowerCase().includes(term);

      const matchesScanType = !scanType || report.scan_type === scanType;

      return matchesSearch && matchesScanType;
    });
  }
  getScanTypeIcon(scanType: string): string {
    switch (scanType?.toLowerCase()) {
      case 'seo': return 'search';
      case 'security': return 'security';
      case 'functional': return 'settings';
      default: return 'help_outline';
    }
  }
  getScanTypeColor(scanType: string): string {
    switch (scanType?.toLowerCase()) {
      case 'seo': return 'warning';
      case 'security': return 'primary';
      case 'functional': return 'success';
      default: return 'basic';
    }
  }
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'running': return 'status-running';
      case 'failed': return 'status-failed';
      default: return 'basic';
    }
  }
  getScheduleColor(scheduled: boolean): string {
    return scheduled ? 'schedule-true' : 'schedule-false';
  }
  getScheduleText(scheduled: boolean): string {
    return scheduled ? 'Scheduled' : 'Instant';
  }
  getUserInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return '?';
    return (firstName?.charAt(0).toUpperCase() || '') + (lastName?.charAt(0).toUpperCase() || '');
  }

  deleteReport(reportId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the report.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiUrl}/reports/${reportId}/`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'The report has been deleted.', 'success');
            this.loadReports();
          },
          error: () => {
            Swal.fire('Error', 'Unable to delete the report.', 'error');
          }
        });
      }
    });
  }

  exportToCSV = async () => {
    const headers = ['ID', 'Type', 'URL', 'User', 'Status', 'Schedule', 'Started At', 'Finished At'];
    const rows = this.dataSource.filteredData.map(report => [
      report.id,
      report.scan_type,
      report.url,
      `${report.user.first_name} ${report.user.last_name}`,
      report.status,
      this.getScheduleText(report.schedule_scan),
      new Date(report.scan_started_at).toLocaleString(),
      new Date(report.scan_finished_at).toLocaleString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'reports.csv');
  }

  exportToPDF = async () => {
    const doc = new jsPDF('l');
    const headers = [['ID', 'Type', 'URL', 'User', 'Status', 'Schedule', 'Started At', 'Finished At']];
    const rows = this.dataSource.filteredData.map(report => [
      report.id.toString(),
      report.scan_type,
      report.url,
      `${report.user.first_name} ${report.user.last_name}`,
      report.status,
      this.getScheduleText(report.schedule_scan),
      new Date(report.scan_started_at).toLocaleString(),
      new Date(report.scan_finished_at).toLocaleString()
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

  exportToHTML = async () => {
    const headers = ['ID', 'Scan Type', 'URL', 'User', 'Status', 'Schedule', 'Started At', 'Finished At'];
    const rows = this.dataSource.filteredData.map(report =>
      `<tr>
        <td>${report.id}</td>
        <td>${report.scan_type}</td>
        <td>${report.url}</td>
        <td>${report.user.first_name} ${report.user.last_name}</td>
        <td>${report.status}</td>
        <td>${this.getScheduleText(report.schedule_scan)}</td>
        <td>${new Date(report.scan_started_at).toLocaleString()}</td>
        <td>${new Date(report.scan_finished_at).toLocaleString()}</td>
      </tr>`);

    const htmlContent = `
      <html>
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
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, 'reports.html');
  }
  async downloadAllAsZip() {
    const zip = new JSZip();
    const csvHeaders = ['ID', 'Scan Type', 'URL', 'User', 'Status', 'Schedule', 'Started At', 'Finished At'];
    const csvRows = this.dataSource.filteredData.map(report =>
      [
        report.id,
        report.scan_type,
        report.url,
        `${report.user.first_name} ${report.user.last_name}`,
        report.status,
        this.getScheduleText(report.schedule_scan),
        new Date(report.scan_started_at).toLocaleString(),
        new Date(report.scan_finished_at).toLocaleString()
      ]
    );
    const csvContent =
      [csvHeaders.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    zip.file('reports.csv', csvContent);
    const htmlTableRows = this.dataSource.filteredData.map(report =>
      `<tr>
        <td>${report.id}</td>
        <td>${report.scan_type}</td>
        <td>${report.url}</td>
        <td>${report.user.first_name} ${report.user.last_name}</td>
        <td>${report.status}</td>
        <td>${this.getScheduleText(report.schedule_scan)}</td>
        <td>${new Date(report.scan_started_at).toLocaleString()}</td>
        <td>${new Date(report.scan_finished_at).toLocaleString()}</td>
      </tr>`
    );
    const htmlContent = `
      <html>
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
              <tr><th>ID</th><th>Scan Type</th><th>URL</th><th>User</th><th>Status</th><th>Schedule</th><th>Started At</th><th>Finished At</th></tr>
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
      head: [['ID', 'Scan Type', 'URL', 'User', 'Status', 'Schedule', 'Started At', 'Finished At']],
      body: this.dataSource.filteredData.map(report => [
        report.id.toString(),
        report.scan_type,
        report.url,
        `${report.user.first_name} ${report.user.last_name}`,
        report.status,
        this.getScheduleText(report.schedule_scan),
        new Date(report.scan_started_at).toLocaleString(),
        new Date(report.scan_finished_at).toLocaleString()
      ]),
      styles: { fontSize: 8 },
      columnStyles: {
        2: { cellWidth: 40 },
        6: { cellWidth: 30 },
        7: { cellWidth: 30 }
      }
    });
    const pdfBlob = pdfDoc.output('blob');
    zip.file('reports.pdf', pdfBlob);

    zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
      saveAs(zipBlob, 'all_reports.zip');
    });
  }
}