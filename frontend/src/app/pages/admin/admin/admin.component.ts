import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../components/shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../../components/shared/topbar/topbar.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, TopbarComponent, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  isSidebarOpen = true;

  toggleSidebar(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }
}
