import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reports } from '../../models/report';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;
  constructor(private http: HttpClient) {}
   createReport(reportData: Partial<Reports>): Observable<Reports> {
    return this.http.post<Reports>(`${this.apiUrl}`, reportData);
  }
  getReports(): Observable<Reports[]> {
    return this.http.get<Reports[]>(`${this.apiUrl}`);
  }
  getReportById(id: number): Observable<Reports> {
    return this.http.get<Reports>(`${this.apiUrl}/${id}`);
  }
  getSecurityReports(userId?: number): Observable<Reports[]> {
    return this.http.get<Reports[]>(`${this.apiUrl}/type/security`, {
      params: userId ? { user_id: userId.toString() } : {}
    });
  }
  getSeoReports(userId?: number): Observable<Reports[]> {
    return this.http.get<Reports[]>(`${this.apiUrl}/type/seo`, {
      params: userId ? { user_id: userId.toString() } : {}
    });
  }
  getFullReports(userId?: number): Observable<Reports[]> {
    return this.http.get<Reports[]>(`${this.apiUrl}/type/full`, {
      params: userId ? { user_id: userId.toString() } : {}
    });
  }
  getReportsByUser(userId: number): Observable<Reports[]> {
    return this.http.get<Reports[]>(`${this.apiUrl}/user/${userId}`);
  }
  getReportByUser(userId: number, reportId: number): Observable<Reports> {
    return this.http.get<Reports>(`${this.apiUrl}/user/${userId}/report/${reportId}`);
  }
  deleteReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${reportId}`);
  }
  downloadHtmlReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-report/html`, { responseType: 'blob' });
  }
  downloadCsvReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-report/csv`, { responseType: 'blob' });
  }
  downloadXmlReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-report/xml`, { responseType: 'blob' });
  }
  downloadPdfReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-report/pdf`, { responseType: 'blob' });
  }
  downloadZipReport(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download-report/zip`, { responseType: 'blob' });
  }
}
