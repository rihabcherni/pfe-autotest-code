import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, Input, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../../services/auth/auth.service';
import { RouterLink } from '@angular/router';
import { Notifications } from '../../../models/notification';
import { NotificationService } from '../../../services/notification/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {
  userId!: number;
  isDarkMode = false;
  user: { name: string; avatar: string } | null = null;
  role: 'admin' | 'tester' | null = null;
  isNotificationOpen = false;
  isUserDropdownOpen = false;
  isFullscreen = false;
  notificationCount = 0;
  notifications: Notifications[] = [];
  newNotifSub?: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    if (this.isBrowser() && this.authService.isAuthenticated()) {
      this.user = this.authService.getUser();
      const rawRole = this.authService.getUserRole();
      if (rawRole === 'admin' || rawRole === 'tester') {
        this.role = rawRole;
      } else {
        this.role = null;
      }
      this.userId = this.authService.getUserId()!;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser()) {
      document.addEventListener('click', this.handleDocumentClick.bind(this));
      this.isFullscreen = !!document.fullscreenElement;
      this.loadSavedPreferences();
    }
    if (this.userId) {
      this.loadNotifications();
      this.connectToNotificationService();
    }
  }

  ngOnDestroy() {
    if (this.newNotifSub) {
      this.newNotifSub.unsubscribe();
    }
    this.notificationService.disconnect?.();
    
    if (this.isBrowser()) {
      document.removeEventListener('click', this.handleDocumentClick.bind(this));
    }
  }

  private handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.popup-wrap.noti') && this.isNotificationOpen) {
      this.isNotificationOpen = false;
    }
    if (!target.closest('.popup-wrap.user') && this.isUserDropdownOpen) {
      this.isUserDropdownOpen = false;
    }
  }
  private loadNotifications(): void {
    this.notificationService.getNotifications(this.userId).subscribe({
      next: (notifs) => {
        this.notifications = notifs
          .filter(n => n.type !== 'progression') 
          .sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        this.updateNotificationCount();
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
        if (notif.type !== 'progression') { 
          this.notifications.unshift(notif);
          this.updateNotificationCount();
        }
      },
      error: (error) => {
        console.error('Erreur WebSocket notifications:', error);
      }
    });
  }
  private updateNotificationCount(): void {
    this.notificationCount = this.notifications.filter(n => !n.is_read).length;
  }

  loadSavedPreferences() {
    if (!this.isBrowser()) return;
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        this.isDarkMode = true;
        document.body.classList.add('dark');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
  }

  toggleDarkMode() {
    if (!this.isBrowser()) return;
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark');
    try {
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  toggleNotificationDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) {
      this.isUserDropdownOpen = false;
    }
  }

  toggleUserDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    if (this.isUserDropdownOpen) {
      this.isNotificationOpen = false;
    }
  }

  toggleFullscreen() {
    if (!this.isBrowser()) return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      this.isFullscreen = true;
    } else {
      document.exitFullscreen?.();
      this.isFullscreen = false;
    }
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange() {
    if (this.isBrowser()) {
      this.isFullscreen = !!document.fullscreenElement;
    }
  }

  markAsRead(notification: Notifications, event?: MouseEvent) {
    event?.stopPropagation();
    
    if (!notification.is_read && notification.id) {
      notification.is_read = true;
      this.updateNotificationCount();
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          console.log('Notification marked as read');
        },
        error: (error) => {
          console.error('Error', error);
          notification.is_read = false;
          this.updateNotificationCount();
        }
      });
    }
  }
  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.is_read);
    unreadNotifications.forEach(notification => {
      notification.is_read = true;
    });
    this.updateNotificationCount();
    this.notificationService.markAllAsRead(this.userId).subscribe({
      next: () => {
        console.log('All notifactions are readed');
      },
      error: (error) => {
        console.error('Error:', error);
        unreadNotifications.forEach(notification => {
          notification.is_read = false;
        });
        this.updateNotificationCount();
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

  logout() {
    this.authService.logout();
  }
}