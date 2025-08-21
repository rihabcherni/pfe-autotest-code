import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { RegisterPayload, UserProfile, LoginResponse} from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl= `${environment.apiUrl}`;
  private isBrowser: boolean;
  
  constructor(private http: HttpClient, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
     this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
  private updateTokenInStorage(newToken: string): void {
    if (this.isBrowser) {
      localStorage.setItem('access_token', newToken);
    }
  }

  getUser(): {id: number; name: string; avatar: string } | null { 
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const defaultAvatar = 'assets/img/home/avatar.png';
        const avatar = payload.profile_image
          ? `${environment.apiUrl}/static/profile_images/` + payload.profile_image
          : defaultAvatar;
        return {
          id: payload.id,
          name: payload.first_name + " " + payload.last_name,
          avatar: avatar
        };
      } catch (e) {
        console.error('Invalid token', e);
        return null;
      }
    }
    return null;
  }

  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }

  registerUser(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, payload);
  }

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (this.isBrowser) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, {
        headers: this.getAuthHeaders(),
    });
  }

  getUserRole(): string | null {  
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role?.split('.').pop(); 
      return role || null;
    } catch (e) {
      console.error('Invalid token', e);
      return null;
    }
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isTester(): boolean {
    return this.getUserRole() === 'tester';
  }
  updateProfile(data: Partial<UserProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/edit-profile`, data, {
      headers: this.getAuthHeaders(),
    }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.updateTokenInStorage(response.access_token);
        }
      })
    );
  }

  logout(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      this.http.post(`${this.apiUrl}/logout`, {}, { headers }).subscribe({
        next: () => {
          this.handleLogoutSuccess('Logout successful');
        },
        error: () => {
          this.handleLogoutError('Error during logout');
        }
      });
    } else {
      this.handleLogoutWarning('No token detected');
    }
  }

  private handleLogoutSuccess(message: string): void {
    localStorage.removeItem('access_token');
    Swal.fire(message, '', 'success').then(() => {
      this.router.navigate(['/login']);
    });
  }

  private handleLogoutError(message: string): void {
    localStorage.removeItem('access_token');
    Swal.fire(message, '', 'error').then(() => {
      this.router.navigate(['/login']);
    });
  }

  private handleLogoutWarning(message: string): void {
    Swal.fire(message, '', 'warning').then(() => {
      this.router.navigate(['/login']);
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password });
  }  

  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
      const payload = {
        token: token,
        new_password: newPassword
      };
      return this.http.post(`${this.apiUrl}/reset-password`, payload);
  }

  verifyEmail(email: string, code: string): Observable<any> {
    const payload = { email, code };
    return this.http.post(`${this.apiUrl}/verify-email`, payload);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const payload = { current_password: currentPassword, new_password: newPassword };
    return this.http.post(`${this.apiUrl}/change-password`, payload, {
      headers: this.getAuthHeaders()
    });
  }
  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    let headers = new HttpHeaders();
    if (this.isBrowser) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return this.http.post(`${this.apiUrl}/upload-profile-image`, formData, { 
      headers 
    }).pipe(
      tap((response: any) => {
        if (response.access_token) {
          this.updateTokenInStorage(response.access_token);
        }
      })
    );
  }
}