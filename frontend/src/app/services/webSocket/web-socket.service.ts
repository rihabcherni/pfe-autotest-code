import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Observable, EMPTY } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private wsBaseUrl = 'ws://localhost:8001/ws'; 
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private webSocket?: WebSocketSubject<any>;
  private isBrowser: boolean;
  constructor(private http: HttpClient, @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  connect(userId: number): void {
    if (!this.isBrowser) return;
    const url = `ws://localhost:8001/ws/${userId}`;
    this.webSocket = new WebSocketSubject<any>({
      url,
      deserializer: msg => {
        try {
          return JSON.parse(msg.data);
        } catch {
          return msg.data;
        }
      }
    });
  }

  sendMessage(message: any): void {
    if (this.isBrowser && this.webSocket) {
      this.webSocket.next(message);
    } else {
      console.warn("WebSocket is not connected.");
    }
  }

  receiveMessages(): Observable<any> {
    if (this.isBrowser && this.webSocket) {
      return this.webSocket.asObservable();
    }
    return EMPTY;
  }

  closeConnection(): void {
    if (this.isBrowser && this.webSocket) {
      this.webSocket.complete();
      this.webSocket = undefined;
    }
  }
  sendStatusUpdate(userId: number, data: { 
    type: 'testcase' | 'step', 
    id: number, 
    status: 'pending' | 'running' | 'passed' | 'failed',
    workflowId: number
  }): void {
    const message = {
      event: 'status_update',
      data: {
        userId,
        ...data
      }
    };
    this.sendMessage(message);
  }
}
