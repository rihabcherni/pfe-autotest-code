import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user';
import { environment } from '../../../environments/environment';

export interface PermissionPayload {
  user_id: number;
  permissions: string[];
}

export interface PermissionResponse {
  user_id: number;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/all_users/`);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  getUserPermissions(userId: number): Observable<PermissionResponse> {
    return this.http.get<PermissionResponse>(`${this.apiUrl}/permissions/users/${userId}`);
  }

  updateUserPermissions(payload: PermissionPayload): Observable<PermissionResponse> {
    return this.http.post<PermissionResponse>(`${this.apiUrl}/permissions/attribuer`, payload);
  }

  revokeUserPermissions(payload: PermissionPayload): Observable<any> {
    return this.http.delete(`${this.apiUrl}/permissions/revoquer`, { body: payload });
  }
  requestPermissions(userId: number, requestedPermissions: string[]) {
    return this.http.post(`${this.apiUrl}/permissions/request-permissions`, {
      user_id: userId,
      requested_permissions: requestedPermissions
    });
  }
}