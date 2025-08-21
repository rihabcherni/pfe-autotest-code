import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SecurityPreferences, SecurityPreferencesResponse, DEFAULT_ADVANCED_OPTIONS } from '../../models/security-preferences.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecurityPreferencesService {
  private apiUrl = `${environment.apiUrl}/security-preferences`;
  private advancedOptionsSubject = new BehaviorSubject<SecurityPreferences>(DEFAULT_ADVANCED_OPTIONS);
  public advancedOptions$ = this.advancedOptionsSubject.asObservable();
  constructor(private http: HttpClient) {
    this.loadInitialOptions();
  }
  private getHttpOptions() {
    const token = localStorage.getItem('access_token'); 
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }
  private handleError(error: any) {
    console.error('SecurityPreferencesService Error:', error);
    let errorMessage = 'An error occurred while processing your request.'  
    if (error.error?.detail) {
      errorMessage = error.error.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return throwError(() => new Error(errorMessage));
  }
  private loadInitialOptions(): void {
    this.getAdvancedOptions().subscribe({
      next: (options) => {
        this.advancedOptionsSubject.next(options);
      },
      error: (error) => {
        console.warn('Could not load initial options, using defaults:', error);
        this.advancedOptionsSubject.next(DEFAULT_ADVANCED_OPTIONS);
      }
    });
  }
  getAdvancedOptions(): Observable<SecurityPreferences> {
    return this.http.get<SecurityPreferencesResponse>(this.apiUrl, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to retrieve advanced options');
          }
        }),
        catchError(this.handleError)
      );
  }
  saveAdvancedOptions(options: SecurityPreferences): Observable<SecurityPreferences> {
    return this.http.post<SecurityPreferencesResponse>(this.apiUrl, options, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.advancedOptionsSubject.next(response.data);
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to save advanced options');
          }
        }),
        catchError(this.handleError)
      );
  }
  updateAdvancedOptions(options: Partial<SecurityPreferences>): Observable<SecurityPreferences> {
    return this.http.put<SecurityPreferencesResponse>(this.apiUrl, options, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.advancedOptionsSubject.next(response.data);
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to update advanced options');
          }
        }),
        catchError(this.handleError)
      );
  }
  resetToDefaults(): Observable<SecurityPreferences> {
    return this.http.post<SecurityPreferencesResponse>(`${this.apiUrl}/reset`, {}, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            this.advancedOptionsSubject.next(response.data);
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to reset to defaults');
          }
        }),
        catchError(this.handleError)
      );
  }
  getDefaults(): Observable<SecurityPreferences> {
    return this.http.get<SecurityPreferencesResponse>(`${this.apiUrl}/defaults`, this.getHttpOptions())
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          } else {
            throw new Error(response.message || 'Failed to get default options');
          }
        }),
        catchError(this.handleError)
      );
  }
  updateLocalOptions(options: SecurityPreferences): void {
    this.advancedOptionsSubject.next(options);
  }
  getCurrentOptions(): SecurityPreferences {
    return this.advancedOptionsSubject.value;
  }
  validateAdvancedOption(field: string, value: any): { isValid: boolean; errorMessage?: string } {
    const validationRules: { [key: string]: any } = {
      depth_crawl: { min: 1, max: 10, name: 'Crawl Depth' },
      zap_dc: { min: 1, max: 10, name: 'ZAP DC' },
      zap_d: { min: 1, max: 10, name: 'ZAP D' },
      wapiti_scan_time: { min: 1, max: 60, name: 'Wapiti Scan Time' },
      wapiti_level: { min: 1, max: 2, name: 'Wapiti Level' },
      sqlmap_level: { min: 1, max: 5, name: 'SQLMap Level' },
      sqlmap_risk: { min: 1, max: 3, name: 'SQLMap Risk' },
      sqlmap_threads: { min: 1, max: 20, name: 'SQLMap Threads' },
      sqlmap_technique: { pattern: /^[BEUSTQ]+$/, name: 'SQLMap Technique' },
      nikto_timeout: { min: 60, max: 3600, name: 'Nikto Timeout' },
      nuclei_rate_limit: { min: 10, max: 1000, name: 'Nuclei Rate Limit' },
      nmap_timing: { min: 0, max: 5, name: 'Nmap Timing' },
      whatweb_aggression: { min: 1, max: 4, name: 'WhatWeb Aggression' },
      pwnxss_threads: { min: 1, max: 50, name: 'PwnXSS Threads' }
    };
    const rule = validationRules[field];
    if (!rule) {
      return { isValid: true };
    }
    if (field !== 'sqlmap_technique' && (typeof value !== 'number' || isNaN(value))) {
      return { 
        isValid: false, 
        errorMessage: `${rule.name} must be a valid number` 
      };
    }
    if (rule.pattern) {
      if (!rule.pattern.test(value)) {
        return { 
          isValid: false, 
          errorMessage: `${rule.name} must contain only letters B, E, U, S, T, Q` 
        };
      }
    } else if (rule.min !== undefined && rule.max !== undefined) {
      if (value < rule.min || value > rule.max) {
        return { 
          isValid: false, 
          errorMessage: `${rule.name} must be between ${rule.min} and ${rule.max}` 
        };
      }
    }
    return { isValid: true };
  }
  validateAllOptions(options: SecurityPreferences): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    Object.keys(options).forEach(field => {
      if (field !== 'outils_securite_favoris') { 
        const validation = this.validateAdvancedOption(field, (options as any)[field]);
        if (!validation.isValid && validation.errorMessage) {
          errors.push(validation.errorMessage);
        }
      }
    });
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  deletePreferences(): Observable<any> {
    return this.http.delete(`${this.apiUrl}`, this.getHttpOptions())
      .pipe(
        map(response => {
          this.advancedOptionsSubject.next(DEFAULT_ADVANCED_OPTIONS);
          return response;
        }),
        catchError(this.handleError)
      );
  }
}