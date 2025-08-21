import { Component, OnDestroy, OnInit } from '@angular/core';
import { TitleComponent } from "../../../components/shared/title/title.component";
import { Notifications } from '../../../models/notification';
import { NotificationService } from '../../../services/notification/notification.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from "../../tester/notification/notification.component";

@Component({
  selector: 'app-notifications-admin',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './notifications-admin.component.html',
  styleUrl: './notifications-admin.component.css'
})
export class NotificationsAdminComponent {
 }