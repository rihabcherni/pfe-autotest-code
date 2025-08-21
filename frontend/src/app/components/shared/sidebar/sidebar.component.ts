import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Inject, PLATFORM_ID, Input } from '@angular/core';
import { Router, RouterLink, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UsersService } from '../../../services/users/users.service';
declare var bootstrap: any;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isExpanded: boolean = true;
  @Output() toggleSidebarEvent = new EventEmitter<boolean>();
  openItem: string | null = null;
  menuItems: any[] = [];
  user: { id: number; name: string; avatar: string } | null = null;
  role: 'admin' | 'tester' | null = null;
    constructor(@Inject(PLATFORM_ID) private platformId: Object, 
    private authService: AuthService, private userService: UsersService, private router: Router
  ){
    if (this.isBrowser() && this.authService.isAuthenticated()) {
      this.user = this.authService.getUser();
      const rawRole = this.authService.getUserRole();
      if (rawRole === 'admin' || rawRole === 'tester') {
        this.role = rawRole;
      } else {
        this.role = null;
      }
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const activeRoute = this.router.url;
        for (const item of this.menuItems) {
          if (item.items && item.items.some((sub: { route: string; }) => activeRoute.startsWith(sub.route))) {
            this.openItem = item.label;
            break;
          }
        }
      }
    });
  }
    private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }

    const user = this.authService.getUser();
    const role = this.authService.getUserRole();
    this.role = role as 'admin' | 'tester' | null;

    if (role === 'admin') {
      this.menuItems = this.getMenuAdmin();
    } else if (role === 'tester' && user?.id) {
      this.userService.getUserPermissions(user.id).subscribe((response) => {
        this.menuItems = this.getMenuItemsByPermissions(response.permissions);
      });
    }
  }
  getMenuAdmin(): any[] {
    return [
      { label: 'Dashboard', icon: 'bi-speedometer2', route: '/admin/dashboard' },          
      { label: 'Users', icon: 'bi-people', route: '/admin/users' },              
      { label: 'Reports', icon: 'bi-shield-check', route: '/admin/reports' },    
      { label: 'Contact Messages', icon: 'bi-envelope', route: '/admin/contact-messages' }, 
      { label: 'Notifications', icon: 'bi-bell', route: '/admin/notifications' },
      { label: 'Profile', icon: 'bi-person', route: '/admin/profile' },          
      { label: 'Configurations', icon: 'bi-gear', route: '/admin/configurations' } 
    ];
  }

  getMenuItemsByPermissions(permissions: string[]): any[] {
    const hasSecurity = permissions.includes('securite');
    const hasSEO = permissions.includes('seo');
    const hasFunctional = permissions.includes('fonctionnel');
    const hasfull = permissions.includes('full');
    const hasSendReports = permissions.includes('send_reports');
    const hasScheduleScan = permissions.includes('schedule_scan');

    const items = [
      { label: 'Dashboard', icon: 'bi-house-door', route: '/tester/dashboard' },    
      hasSecurity && { label: 'Pentest Scan', icon: 'bi-shield-lock', route: '/tester/pentest-reports' },
      hasFunctional && { label: 'Functional Scan', icon: 'bi-check-circle', route: '/tester/functional-scan-reports' },
      hasSEO && { label: 'SEO Scan', icon: 'bi-globe2', route: '/tester/seo-scan-reports' },
      hasfull && { label: 'Full Scan', icon: 'bi-diagram-3', route: '/tester/complete-scan' },
      hasScheduleScan && { label: 'Scheduling', icon: 'bi-calendar-check', route: '/tester/schedule-scan'},
      { label: 'Notifications', icon: 'bi-bell', route: '/tester/notifications' },
      { label: 'Profile', icon: 'bi-person', route: '/tester/profile' },
      hasSendReports && { label: 'Configurations', icon: 'bi-wrench', route: '/tester/configurations' }
    ];
    return items.filter(Boolean);
  }
  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    this.toggleSidebarEvent.emit(this.isExpanded);
  }
  toggleSubMenu(label: string): void {
    this.openItem = this.openItem === label ? null : label;
  }
  logout() {
    this.authService.logout();
  }
}
