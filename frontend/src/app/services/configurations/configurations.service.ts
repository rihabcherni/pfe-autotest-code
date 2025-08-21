import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

export interface ConfigurationData {
  user_id: number;
  liste_emails?: string[];
  slack_token?: string;
  slack_channel_id?: string;
  jira_cle_projet?: string;
  jira_domain?: string;
  jira_board?: string;
  jira_email?: string;
  jira_token?: string;
  report_types?: string[];
  report_formats?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationsService {
  private apiUrl = `${environment.apiUrl}/parametres-envoi`;

  constructor(private http: HttpClient) {}

  private getHttpOptions() {
    const token = localStorage.getItem('access_token');
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  /**
   * 🔐 Chiffrement AES du token (ex: Slack, Jira)
   */
  private encryptToken(token: string): { encryptedToken: string, encryptionKey: string, iv: string } {
    const encryptionKey = CryptoJS.lib.WordArray.random(16);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encryptedToken = CryptoJS.AES.encrypt(token, encryptionKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    return {
      encryptedToken,
      encryptionKey: encryptionKey.toString(),
      iv: iv.toString(CryptoJS.enc.Hex)
    };
  }
  getUserConfiguration(userId: number): Observable<ConfigurationData> {
    return this.http.get<ConfigurationData>(`${this.apiUrl}/${userId}`, this.getHttpOptions());
  }
  saveConfiguration(userId: number, configData: Partial<ConfigurationData>): Observable<any> {
    const payload = {
      user_id: userId,
      ...configData
    };
    return this.http.post<any>(`${this.apiUrl}/`, payload, this.getHttpOptions());
  }
  updateConfiguration(userId: number, configData: Partial<ConfigurationData>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${userId}`, configData, this.getHttpOptions());
  }
  deleteConfiguration(userId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`, this.getHttpOptions());
  }
  configureSlack(token: string, channel_id: string): Observable<any> {
    const { encryptedToken, encryptionKey, iv } = this.encryptToken(token);
    const request = { encryptedToken, channel_id, encryptionKey, iv };
    return this.http.post<any>(`${environment.apiUrl}/config_slack/`, request, this.getHttpOptions());
  }

  configureJira(email: string, token: string, domain: string, projectKey: string, board: string): Observable<any> {
    const { encryptedToken, encryptionKey, iv } = this.encryptToken(token);
    const request = {
      JIRA_EMAIL: email,
      encryptedToken,
      JIRA_DOMAIN: domain,
      encryptionKey,
      iv,
      JIRA_PROJECT_KEY: projectKey,
      JIRA_BOARD: board
    };
    return this.http.post<any>(`${environment.apiUrl}/config_jira/`, request, this.getHttpOptions());
  }

  configureEmails(emails: string[]): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/config_emails/`, { emails }, this.getHttpOptions());
  }
}
