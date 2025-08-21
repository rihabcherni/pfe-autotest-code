import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SEOReportRequest, SEOReportResponse } from '../../models/seo-report';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SeoReportService {
  private apiUrl =`${environment.apiUrl}`;
  userId!: number;

  constructor(private http: HttpClient, private authService: AuthService) {}

  createReport(request: SEOReportRequest): Observable<SEOReportResponse> {
    this.userId = this.authService.getUserId()!;
    return this.http.post<SEOReportResponse>(`${this.apiUrl}/seo-report/user/${this.userId }`, request);
  }

  getReport(id: number): Observable<SEOReportResponse> {
    return this.http.get<SEOReportResponse>(`${this.apiUrl}/seo-report/${id}`);
  }

  getAllReports(): Observable<SEOReportResponse[]> {
    return this.http.get<SEOReportResponse[]>(`${this.apiUrl}/seo-reports`);
  }

  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seo-report/${id}`);
  }
}
