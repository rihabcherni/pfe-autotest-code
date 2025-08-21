import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { Notifications } from '../../models/notification';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications/user`;
  private wsBaseUrl = 'ws://localhost:8001/ws'; 
  private socket$?: WebSocketSubject<Notifications>;

  private notificationSubject = new Subject<Notifications>();
  public notifications$ = this.notificationSubject.asObservable();

  private isBrowser: boolean;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; 

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  getNotifications(userId: number): Observable<Notifications[]> {
    return this.http.get<Notifications[]>(`${this.apiUrl}/${userId}`);
  }
  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/notifications/${notificationId}/read`, {});
  }
  markAllAsRead(userId: number): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/notifications/user/${userId}/mark-all-read`, {});
  }
  connectToWebSocket(userId: number): void {
    if (!this.isBrowser || this.socket$) return; 
    const wsUrl = `${this.wsBaseUrl}/${userId}`;
    this.socket$ = webSocket<Notifications>({
      url: wsUrl,
      deserializer: e => {
        try {
          const data = JSON.parse(e.data);          
          if (!data.created_at) {
            data.created_at = new Date().toISOString();
          }
          
          return data as Notifications;
        } catch (err) {
          console.error("❌ Erreur de parsing JSON WebSocket :", err);
          return { 
            message: e.data, 
            type: 'error', 
            user_id: userId, 
            created_at: new Date().toISOString(),
            id: Date.now() 
          } as Notifications;
        }
      },
      openObserver: {
        next: () => {
          this.reconnectAttempts = 0;
        }
      },
      closeObserver: {
        next: () => {
          console.warn('⚠️ WebSocket fermé');
          this.attemptReconnect(userId);
        }
      }
    });

    this.socket$.subscribe({
      next: (notification: Notifications) => {
        this.notificationSubject.next(notification);
      },
      error: err => {
        console.error('❌ WebSocket error:', err);
        this.socket$ = undefined;
        this.attemptReconnect(userId);
      },
      complete: () => {
        console.warn('ℹ️ WebSocket connection closed');
        this.socket$ = undefined;
      }
    });
  }

  private attemptReconnect(userId: number): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;      
      setTimeout(() => {
        this.connectToWebSocket(userId);
      }, this.reconnectInterval);
    } else {
      console.error('❌ Impossible de se reconnecter au WebSocket après plusieurs tentatives');
    }
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    this.reconnectAttempts = 0;
  }

  sendMessage(message: string): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.next({ message } as any);
    }
  }

  isConnected(): boolean {
    return this.socket$ ? !this.socket$.closed : false;
  }
}