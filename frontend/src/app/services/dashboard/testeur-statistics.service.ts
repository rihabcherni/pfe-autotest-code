import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface ReportsResponse {
  labels: { [period: string]: string[] };
  reportsData: { [reportType: string]: { [period: string]: number[] } };
}
export interface TesterOverviewStats {
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

export interface VulnerabilitiesByPeriod {
  labels: {
    day: string[];
    week: string[];
    month: string[];
    year: string[];
  };
  vulnerabilitiesData: {
    high: { [key: string]: number };
    medium: { [key: string]: number };
    low: { [key: string]: number };
    informational: { [key: string]: number };
    other: { [key: string]: number };
  };
}

export interface ReportsByPeriod {
  labels: {
    day: string[];
    week: number[];
    month: string[];
    year: number[];
  };
  data: {
    day: { [scanType: string]: { [date: string]: number } };
    week: { [scanType: string]: { [week: number]: number } };
    month: { [scanType: string]: { [month: number]: number } };
    year: { [scanType: string]: { [year: number]: number } };
    all: { [scanType: string]: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class TesteurStatisticsService {
  private apiUrl = `${environment.apiUrl}/tester/stats`;  
   private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token'); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  } 
  constructor(private http: HttpClient) {}
  getTesterStats(): Observable<TesterOverviewStats> {
    return this.http.get<TesterOverviewStats>(`${this.apiUrl}/overview`, {
      headers: this.getAuthHeaders()
    });
  }
 
  getVulnerabilitiesByPeriod(): Observable<VulnerabilitiesByPeriod> {
    return this.http.get<VulnerabilitiesByPeriod>(`${this.apiUrl}/vulnerabilities-by-period`, {
      headers: this.getAuthHeaders()
    });
  }

  getReportsByPeriod(): Observable<ReportsByPeriod> {
    return this.http.get<ReportsByPeriod>(`${this.apiUrl}/reports-by-period`, {
      headers: this.getAuthHeaders()
    });
  }
  fetchReports(): Observable<ReportsResponse> {
    return this.http.get<ReportsResponse>(`${this.apiUrl}/reports-by-period`, {
      headers: this.getAuthHeaders()
    });
  }
  getFunctionalSuccessRate(stats: TesterOverviewStats): number {
    const total = stats.functional.total;
    if (total === 0) return 0;
    return Math.round((stats.functional.success / total) * 100);
  }

  getCompletionRate(stats: TesterOverviewStats): number {
    const total = stats.reports.total;
    if (total === 0) return 0;
    return Math.round((stats.reports.by_status.completed / total) * 100);
  }

  getVulnerabilityDistribution(stats: TesterOverviewStats): {
    high: number;
    medium: number;
    low: number;
    informational: number;
    other: number;
  } {
    const total = stats.security.total_vulnerabilities_reports;
    if (total === 0) {
      return { high: 0, medium: 0, low: 0, informational: 0, other: 0 };
    }

    const risks = stats.security.by_risk;
    return {
      high: Math.round((risks.high / total) * 100),
      medium: Math.round((risks.medium / total) * 100),
      low: Math.round((risks.low / total) * 100),
      informational: Math.round((risks.informational / total) * 100),
      other: Math.round((risks.other / total) * 100)
    };
  }

  getMostUsedScanType(stats: TesterOverviewStats): string {
    const types = stats.reports.by_type;
    const max = Math.max(types.seo, types.functional, types.security);
    
    if (types.seo === max) return 'seo';
    if (types.functional === max) return 'functional';
    return 'security';
  }
}