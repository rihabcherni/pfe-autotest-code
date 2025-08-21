import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Reports } from '../../../../models/report';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-security-table-details',
  standalone: true,
  imports: [ MatTableModule,MatIconModule,CommonModule],
  templateUrl: './security-table-details.component.html',
  styleUrl: './security-table-details.component.css'
})
export class SecurityTableDetailsComponent {
  @Input() report: any;
 getRiskIconClass(risk: string): string {
    switch(risk.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }
  getRiskIcon(risk: string): string {
    switch(risk.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'help';
    }
  }
  getFullFormattedScanDuration(report: Reports): string {
    if (!report.scan_started_at || !report.scan_finished_at) {
      return '0ms';
    }
    const start = new Date(report.scan_started_at);
    const end = new Date(report.scan_finished_at);
    const durationMs = end.getTime() - start.getTime();
    const totalHours = Math.floor(durationMs / (60 * 60 * 1000));
    const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((durationMs % (60 * 1000)) / 1000);
    const milliseconds = durationMs % 1000;
    let formatted = '';
    if (totalHours > 0) {
      formatted += `${totalHours}H:`;
    }
    if (minutes > 0) {
      formatted += `${minutes}min:`;
    }
    if (seconds > 0) {
      formatted += `${seconds}sec:`;
    }
    if (milliseconds > 0 || formatted === '') {
      formatted += `${milliseconds}ms`;
    } else {
      formatted = formatted.replace(/:$/, '');
    }

    return formatted;
  }
  get totalOther(): number {
    const total = this.report?.security_details?.number_vulnerabilities || 0;
    const high = this.report?.security_details?.total_High || 0;
    const medium = this.report?.security_details?.total_Medium || 0;
    const low = this.report?.security_details?.total_Low || 0;
    const info = this.report?.security_details?.total_Informational || 0;

    const calculated = total - (high + medium + low + info);
    return calculated >= 0 ? calculated : 0;
  }
}