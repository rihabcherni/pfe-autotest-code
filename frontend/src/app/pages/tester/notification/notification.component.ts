import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../services/notification/notification.service';
import { AuthService } from '../../../services/auth/auth.service';
import { Notifications } from '../../../models/notification';
import { TitleComponent } from "../../../components/shared/title/title.component";

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notifications[] = [];
  filteredNotifications: Notifications[] = [];
  private newNotifSub!: Subscription;
  userId!: number;
  titleValue = "Notifications";
  selectedTypeFilter: string = 'all';
  selectedStatusFilter: string = 'all';

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId()!;
    if (!this.userId) {
      console.warn('No user ID found in token');
      return;
    }

    this.loadNotifications();
    this.connectToNotificationService();
  }

  ngOnDestroy(): void {
    this.newNotifSub?.unsubscribe();
    this.notificationService.disconnect?.();
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications(this.userId).subscribe({
      next: (notifs) => {
        this.notifications = notifs.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
  }

  private connectToNotificationService(): void {
    this.notificationService.connectToWebSocket(this.userId);
    this.newNotifSub = this.notificationService.notifications$.subscribe({
      next: (notif) => {
        this.notifications.unshift(notif);
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur WebSocket notifications:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(notification => {
      const typeMatch = this.selectedTypeFilter === 'all' || 
                       notification.type === this.selectedTypeFilter;
      
      const statusMatch = this.selectedStatusFilter === 'all' || 
                         (this.selectedStatusFilter === 'unread' && !notification.is_read) ||
                         (this.selectedStatusFilter === 'read' && notification.is_read);
      
      return typeMatch && statusMatch;
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  markAsRead(notification: Notifications, event?: MouseEvent) {
    event?.stopPropagation();
    
    if (!notification.is_read && notification.id) {
      notification.is_read = true;
      this.applyFilters();
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log('Notification marquée comme lue avec succès');
        },
        error: (error) => {
          console.error('Erreur lors du marquage de la notification comme lue:', error);
          notification.is_read = false;
          this.applyFilters(); 
        }
      });
    }
  }

  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.is_read);
    unreadNotifications.forEach(notification => {
      notification.is_read = true;
    });
    this.applyFilters(); 

    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => {
        console.log('Toutes les notifications marquées comme lues avec succès');
      },
      error: (error) => {
        console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
        unreadNotifications.forEach(notification => {
          notification.is_read = false;
        });
        this.applyFilters();
      }
    });
  }

  getNotificationTime(notification: Notifications): string {
    const now = new Date();
    const notifDate = new Date(notification.created_at);
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  }
}