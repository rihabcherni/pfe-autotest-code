import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  user: { name: string; avatar: string } | null = null;
  role: 'admin' | 'tester' | null = null;
  isUserDropdownOpen = false;

  constructor(private authService: AuthService) {
    if (this.isBrowser() && this.authService.isAuthenticated()) {
      this.user = this.authService.getUser();
      const rawRole = this.authService.getUserRole();
      if (rawRole === 'admin' || rawRole === 'tester') {
        this.role = rawRole;
      } else {
        this.role = null;
      }
    }
  }

  ngOnInit(): void {
    this.checkAuthState();
  }

  checkAuthState(): void {
    if (this.isBrowser() && this.authService.isAuthenticated()) {
      this.user = this.authService.getUser();
      const rawRole = this.authService.getUserRole();
      this.role = rawRole === 'admin' || rawRole === 'tester' ? rawRole : null;
    } else {
      this.user = null;
      this.role = null;
    }
  }
  logout(): void {
    this.authService.logout();
    this.user = null;
    this.role = null;
    this.isUserDropdownOpen = false;
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
