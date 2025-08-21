import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ReportsResponse {
  labels: { [period: string]: string[] };
  reportsData: { [reportType: string]: { [period: string]: number[] } };
}
export interface VulnerabilityStats {
  day: number[];
  week: number[];
  month: number[];
  year: number[];
  all: number[];
}
export interface DashboardStats {
  total_users: number;
  reports: {
    total: number;
    by_type: {
      seo: number;
      functional: number;
      security: number;
    };
    by_status: {
      running: number;
      completed: number;
      failed: number;
      canceled: number;
      queued: number;
    };
  };
  seo: {
    average_score: number;
  };
  functional: {
    total: number;
    success: number;
    fail: number;
    pending: number;
  };
  security: {
    total_vulnerabilities_reports: number;
    by_risk: {
      high: number;
      medium: number;
      low: number;
      informational: number;
      other: number;
    };
  };
}
@Injectable({
  providedIn: 'root'
})
export class AdminStatisticsService {
  private apiUrl = `${environment.apiUrl}/admin/stats`;   
  constructor(private http: HttpClient) {}


  fetchReports(): Observable<ReportsResponse> {
    return this.http.get<ReportsResponse>(`${this.apiUrl}/reports-by-period`);
  }

  getVulnerabilityStats(): Observable<VulnerabilityStats> {
    return this.http.get<VulnerabilityStats>(`${this.apiUrl}/vulnerabilities-by-period`);
  }

  getOverviewStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/overview`);
  }
}
