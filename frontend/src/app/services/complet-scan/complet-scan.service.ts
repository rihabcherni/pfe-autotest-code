import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { ScanConfiguration, ScanResult, Reports } from '../../models/complet-scan';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompletScanService {
  getReportUrl(reportId: number) {
    throw new Error('Method not implemented.');
  }

  private baseUrl = `${environment.apiUrl}/complet-scan`;

  constructor(private http: HttpClient) {}

  startScan(config: ScanConfiguration): Promise<ScanResult> {
    return lastValueFrom(this.http.post<ScanResult>(`${this.baseUrl}/start`, config));
  }

  getScanProgress(scanId: number): Promise<{ progress: number; status: string }> {
    return lastValueFrom(this.http.get<{ progress: number; status: string }>(`${this.baseUrl}/progress/${scanId}`));
  }

  getScanHistory(): Promise<Reports[]> {
    return lastValueFrom(this.http.get<Reports[]>(`${this.baseUrl}/history`));
  }

  downloadReport(reportId: number): Promise<void> {
    return lastValueFrom(
      this.http.get(`${this.baseUrl}/report/${reportId}/download`, {
        responseType: 'blob'
      }).pipe()
    ).then(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `scan-report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    });
  }

  cancelScan(scanId: number): Promise<void> {
    return lastValueFrom(this.http.post<void>(`${this.baseUrl}/scan/cancel/${scanId}`, {}));
  }
}
