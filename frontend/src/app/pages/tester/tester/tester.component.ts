import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from '../../../components/shared/topbar/topbar.component';
import { SidebarComponent } from '../../../components/shared/sidebar/sidebar.component';

@Component({
  selector: 'app-tester',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, TopbarComponent, CommonModule],
  templateUrl: './tester.component.html',
  styleUrl: './tester.component.css'
})
export class TesterComponent {
  isSidebarOpen = true;

  toggleSidebar(isOpen: boolean) {
    this.isSidebarOpen = isOpen;
  }
}
