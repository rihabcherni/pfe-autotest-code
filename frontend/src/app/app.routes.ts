import { Routes } from '@angular/router';
import { HomeComponent } from './pages/visitor/home/home.component';
import { ResetPasswordComponent } from './pages/visitor/reset-password/reset-password.component';
import { RegisterComponent } from './pages/visitor/register/register.component';
import { LoginComponent } from './pages/visitor/login/login.component';
import { ForgotPasswordComponent } from './pages/visitor/forgot-password/forgot-password.component';
import { Page404Component } from './pages/visitor/page-404/page-404.component';
import { VisitorComponent } from './pages/visitor/visitor/visitor.component';
import { DashboardAdminComponent } from './pages/admin/dashboard-admin/dashboard-admin.component';
import { AdminComponent } from './pages/admin/admin/admin.component';
import { TesterComponent } from './pages/tester/tester/tester.component';
import { TesterDashboardComponent } from './pages/tester/tester-dashboard/tester-dashboard.component';
import { UsersComponent } from './pages/admin/users/users.component';
import { ProfilComponent } from './components/shared/profil/profil.component'
import { PentestScanComponent } from './pages/tester/pentest-report/pentest-scan/pentest-scan.component';
import { FonctionnelTestScanComponent } from './pages/tester/fonctionnel-report/fonctionnel-test-scan/fonctionnel-test-scan.component';
import { PolicyComponent } from './pages/visitor/policy/policy.component';
import { SettingsComponent } from './pages/tester/settings/settings.component';
import { SeoScanComponent } from './pages/tester/seo-report/seo-scan/seo-scan.component';
import { ConfigurationsComponent } from './pages/tester/configurations/configurations.component';
import { VerifyEmailComponent } from './pages/visitor/verify-email/verify-email.component';
import { authGuard } from './guards/auth.guard';
import { ContactComponent } from './pages/admin/contact/contact.component';
import { CompleteScanComponent } from './pages/tester/complete-scan/complete-scan.component';
import { PentestScanResultsComponent } from './pages/tester/pentest-report/pentest-scan-results/pentest-scan-results.component';
import { SeoScanResultsComponent } from './pages/tester/seo-report/seo-scan-results/seo-scan-results.component';
import { NotificationComponent } from './pages/tester/notification/notification.component';
import { NotificationsAdminComponent } from './pages/admin/notifications-admin/notifications-admin.component';
import { ConfigurationsAdminComponent } from './pages/admin/configurations-admin/configurations-admin.component';
import { unauthGuard } from './guards/unauth.guard';
import { PentestReportsComponent } from './pages/tester/pentest-report/pentest-reports/pentest-reports.component';
import { FonctionnelAllReportsComponent } from './pages/tester/fonctionnel-report/fonctionnel-all-reports/fonctionnel-all-reports.component';
import { SeoReportsComponent } from './pages/tester/seo-report/seo-reports/seo-reports.component';
import { ReportsComponent } from './pages/admin/reports/reports.component';
import { RoleGuard } from './guards/role.guard';
import { PermissionGuard } from './guards/permission.guard';
import { ScheduleScanComponent } from './pages/tester/schedule-scan/schedule-scan.component';

export const routes: Routes = [
  { path: '', component: VisitorComponent, children: [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent, canActivate: [unauthGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [unauthGuard] },
    { path: 'verify-email', component: VerifyEmailComponent, canActivate: [unauthGuard] },
    { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [unauthGuard] },
    { path: 'reset-password', component: ResetPasswordComponent, canActivate: [unauthGuard] },
    { path: 'policy', component: PolicyComponent },
  ]},

  { 
    path: 'admin', component: AdminComponent,canActivate: [authGuard, RoleGuard], data: { expectedRole: 'admin' }, 
    children: [
      { path: 'dashboard', component: DashboardAdminComponent },
      { path: 'users', component: UsersComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'profile', component: ProfilComponent },
      { path: 'contact-messages', component: ContactComponent },
      { path: 'notifications', component: NotificationsAdminComponent },
      { path: 'configurations', component: ConfigurationsAdminComponent},
    ]
  },
  { 
    path: 'tester', component: TesterComponent, canActivate: [authGuard, RoleGuard], data: { expectedRole: 'tester' },
    children: [
      { path: 'dashboard', component: TesterDashboardComponent },
      { path: 'schedule-scan', component: ScheduleScanComponent, canActivate: [PermissionGuard], data: { permissions: ['securite'] } },

      { path: 'pentest-scan', component: PentestScanComponent, canActivate: [PermissionGuard], data: { permissions: ['securite'] } },
      { path: 'pentest-scan-results/:id', component: PentestScanResultsComponent, canActivate: [PermissionGuard], data: { permissions: ['securite'] } },
      { path: 'pentest-reports', component: PentestReportsComponent, canActivate: [PermissionGuard], data: { permissions: ['securite'] } },
    
      { path: 'functional-scan', component: FonctionnelTestScanComponent, canActivate: [PermissionGuard], data: { permissions: ['fonctionnel'] } },
      { path: 'functional-scan/:functionalReportId/workflow/:workflowId', component: FonctionnelTestScanComponent, canActivate: [PermissionGuard], data: { permissions: ['fonctionnel'] } },
      { path: 'functional-scan-reports', component: FonctionnelAllReportsComponent, canActivate: [PermissionGuard], data: { permissions: ['fonctionnel'] } },
    
      { path: 'seo-scan', component: SeoScanComponent, canActivate: [PermissionGuard], data: { permissions: ['seo'] } },
      { path: 'seo-scan-reports', component: SeoReportsComponent, canActivate: [PermissionGuard], data: { permissions: ['seo'] } },
      { path: 'seo-scan-results/:id', component: SeoScanResultsComponent , canActivate: [PermissionGuard], data: { permissions: ['seo'] } },

      { path: 'complete-scan', component: CompleteScanComponent, canActivate: [PermissionGuard], data: { permissions: ['full'] } },
      { path: 'profile', component: ProfilComponent},
      { path: 'notifications', component: NotificationComponent },
      { path: 'configurations', component: ConfigurationsComponent, canActivate: [PermissionGuard], data: { permissions: ['securite'] } },
    ]
  },
  { path: '**', component: Page404Component },
];
