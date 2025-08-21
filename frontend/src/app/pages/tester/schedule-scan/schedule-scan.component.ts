import { TitleComponent } from "../../../components/shared/title/title.component";
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from "../../../services/auth/auth.service";
import { ScanTypeConfig, ScanTypeEnum, StatutReportEnum, Report } from "../../../models/schedule";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleFormDialogComponent } from "./schedule-form-dialog/schedule-form-dialog.component";

@Component({
  selector: 'app-schedule-scan',
  standalone: true,
  imports: [
    TitleComponent, CommonModule, FormsModule, MatIconModule, MatDialogModule, 
    MatFormFieldModule, MatOptionModule, MatCheckboxModule, MatSelectModule, 
    MatInputModule, MatButtonModule, MatSnackBarModule, FormsModule, 
    ReactiveFormsModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './schedule-scan.component.html',
  styleUrl: './schedule-scan.component.css'
})
export class ScheduleScanComponent implements OnInit {
  userId!: number;
  isEditMode = false;
  selectedDayScans: Report[] = [];
  selectedDayDetails: Date | null = null;
  titleValue = "Schedule Scanner";
  currentDate = new Date();
  selectedDate: Date | null = null;
  isSubmitting = false;
  editingScan: Report | null = null;
  reports: Report[] = [];
  calendarDays: { date: Date; isCurrentMonth: boolean }[] = [];

  dayHeaders = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  reportForm!: FormGroup;

  constructor(
    private authService: AuthService, 
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.userId = this.authService.getUserId()!;
    this.initializeForm();
    this.generateSampleReports();
    this.updateCalendarDays();
  }

  initializeForm() {
    this.reportForm = this.fb.group({
      project_name: ['', [Validators.required, Validators.minLength(3)]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      schedule_date: [new Date(), Validators.required],
      schedule_time: ['09:00', Validators.required],
      scan_type: [ScanTypeEnum.SECURITY, Validators.required],
      enable_zap_manual: [false],
      authentification: [false],
      auth_type: ['basic'],
      login_page_url: [''],
      username: [''],
      password: [''],
      token: [''],
      cookies: ['']
    });
    this.reportForm.get('authentification')?.valueChanges.subscribe(authEnabled => {
      const authTypeControl = this.reportForm.get('auth_type');
      const loginPageControl = this.reportForm.get('login_page_url');
      const usernameControl = this.reportForm.get('username');
      const passwordControl = this.reportForm.get('password');
      const tokenControl = this.reportForm.get('token');
      const cookiesControl = this.reportForm.get('cookies');

      if (authEnabled) {
        authTypeControl?.setValidators([Validators.required]);
        loginPageControl?.setValidators([Validators.required, Validators.pattern(/^https?:\/\/.+/)]);
      } else {
        authTypeControl?.clearValidators();
        loginPageControl?.clearValidators();
        usernameControl?.clearValidators();
        passwordControl?.clearValidators();
        tokenControl?.clearValidators();
        cookiesControl?.clearValidators();
      }

      authTypeControl?.updateValueAndValidity();
      loginPageControl?.updateValueAndValidity();
      usernameControl?.updateValueAndValidity();
      passwordControl?.updateValueAndValidity();
      tokenControl?.updateValueAndValidity();
      cookiesControl?.updateValueAndValidity();
    });
    this.reportForm.get('auth_type')?.valueChanges.subscribe(authType => {
      const usernameControl = this.reportForm.get('username');
      const passwordControl = this.reportForm.get('password');
      const tokenControl = this.reportForm.get('token');
      const cookiesControl = this.reportForm.get('cookies');
      usernameControl?.clearValidators();
      passwordControl?.clearValidators();
      tokenControl?.clearValidators();
      cookiesControl?.clearValidators();

      if (this.reportForm.get('authentification')?.value) {
        switch (authType) {
          case 'basic':
            usernameControl?.setValidators([Validators.required]);
            passwordControl?.setValidators([Validators.required]);
            break;
          case 'token':
            tokenControl?.setValidators([Validators.required]);
            break;
          case 'cookies':
            cookiesControl?.setValidators([Validators.required]);
            break;
        }
      }

      usernameControl?.updateValueAndValidity();
      passwordControl?.updateValueAndValidity();
      tokenControl?.updateValueAndValidity();
      cookiesControl?.updateValueAndValidity();
    });
  }

  scanTypeConfigs: Record<ScanTypeEnum, ScanTypeConfig> = {
    [ScanTypeEnum.SECURITY]: {
      label: 'Security',
      icon: '<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>',
      color: 'bg-red-500',
      bgColor: 'bg-red-100'
    },
    [ScanTypeEnum.SEO]: {
      label: 'SEO',
      icon: '<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>',
      color: 'bg-green-500',
      bgColor: 'bg-green-100'
    },
    [ScanTypeEnum.FUNCTIONAL]: {
      label: 'Functional',
      icon: '<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100'
    }
  };

  statusColors: Record<StatutReportEnum, string> = {
    [StatutReportEnum.QUEUED]: 'bg-gray-100 text-gray-800',
    [StatutReportEnum.RUNNING]: 'bg-yellow-100 text-yellow-800',
    [StatutReportEnum.COMPLETED]: 'bg-green-100 text-green-800',
    [StatutReportEnum.FAILED]: 'bg-red-100 text-red-800',
    [StatutReportEnum.CANCELED]: 'bg-gray-100 text-gray-800'
  };
  scanTypeOptions = [
    { value: ScanTypeEnum.SECURITY, label: 'Sécurité' },
    { value: ScanTypeEnum.SEO, label: 'SEO' },
    { value: ScanTypeEnum.FUNCTIONAL, label: 'Fonctionnel' },
  ];
  get projectNameControl() { return this.reportForm.get('project_name'); }
  get urlControl() { return this.reportForm.get('url'); }
  get scheduleDateControl() { return this.reportForm.get('schedule_date'); }
  get scanTypeControl() { return this.reportForm.get('scan_type'); }
  get authenticationControl() { return this.reportForm.get('authentification'); }
  get authTypeControl() { return this.reportForm.get('auth_type'); }

  generateSampleReports() {
    const sampleReports: Report[] = [];
    const today = new Date();
    const urls = [
      'https://testphp.vulnweb.com',
      'https://demo.testfire.net',
      'https://zero.webappsecurity.com',
      'https://example.com',
      'https://vulnerable-app.com',
      'https://juice-shop.herokuapp.com',
      'https://scanme.nmap.org',
      'https://target1.internal',
      'https://staging.website.net',
      'https://legacy.insecure.dev'
    ];

    const scanTypes = Object.values(ScanTypeEnum);
    const statuses = Object.values(StatutReportEnum);

    urls.forEach((url, i) => {
      const scanDate = new Date(today);
      scanDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 15);

      const randomType = scanTypes[Math.floor(Math.random() * scanTypes.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      sampleReports.push({
        id: i + 1,
        user_id: this.userId,
        url: url,
        scan_type: randomType,
        authentification: Math.random() > 0.7,
        schedule_scan: true,
        schedule_date: scanDate.toISOString().split('T')[0],
        schedule_time: `${String(Math.floor(Math.random() * 12) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
        status: randomStatus,
        progression: randomStatus === StatutReportEnum.RUNNING ? Math.floor(Math.random() * 100) :
                    (randomStatus === StatutReportEnum.COMPLETED ? 100 : 0)
      });
    });

    this.reports = sampleReports;
  }

  getScanTypeBootstrapClass(scanType: ScanTypeEnum): string {
    const classes = {
      [ScanTypeEnum.SECURITY]: 'bg-danger bg-opacity-10 border border-danger border-opacity-25',
      [ScanTypeEnum.SEO]: 'bg-success bg-opacity-10 border border-success border-opacity-25',
      [ScanTypeEnum.FUNCTIONAL]: 'bg-primary bg-opacity-10 border border-primary border-opacity-25'
    };
    return classes[scanType] || 'bg-secondary bg-opacity-10';
  }

  getScanTypeLinkClass(scanType: ScanTypeEnum): string {
    const classes = {
      [ScanTypeEnum.SECURITY]: 'text-danger',
      [ScanTypeEnum.SEO]: 'text-success',
      [ScanTypeEnum.FUNCTIONAL]: 'text-primary'
    };
    return classes[scanType] || 'text-secondary';
  }

  getScanTypeIcon(scanType: ScanTypeEnum): string {
    const icons = {
      [ScanTypeEnum.SECURITY]: 'bi bi-shield-lock-fill text-danger',
      [ScanTypeEnum.SEO]: 'bi bi-search text-success',
      [ScanTypeEnum.FUNCTIONAL]: 'bi bi-lightning-fill text-primary'
    };
    return icons[scanType] || 'bi bi-question-circle text-secondary';
  }

  getStatusBootstrapClass(status: StatutReportEnum): string {
    const classes = {
      [StatutReportEnum.QUEUED]: 'text-bg-secondary',
      [StatutReportEnum.RUNNING]: 'text-bg-warning',
      [StatutReportEnum.COMPLETED]: 'text-bg-success',
      [StatutReportEnum.FAILED]: 'text-bg-danger',
      [StatutReportEnum.CANCELED]: 'text-bg-dark'
    };
    return classes[status] || 'text-bg-secondary';
  }

  getStatusAbbreviation(status: StatutReportEnum): string {
    const abbreviations = {
      [StatutReportEnum.QUEUED]: 'Q',
      [StatutReportEnum.RUNNING]: 'R',
      [StatutReportEnum.COMPLETED]: '✓',
      [StatutReportEnum.FAILED]: '✗',
      [StatutReportEnum.CANCELED]: 'C'
    };
    return abbreviations[status] || '?';
  }
  getStatusLabel(status: StatutReportEnum): string {
    const labels = {
      [StatutReportEnum.QUEUED]: 'Queued',
      [StatutReportEnum.RUNNING]: 'Running',
      [StatutReportEnum.COMPLETED]: 'Completed',
      [StatutReportEnum.FAILED]: 'Failed',
      [StatutReportEnum.CANCELED]: 'Canceled'
    };
    return labels[status] || status;
  }
  updateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];      
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }      
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    this.calendarDays = days;
  }

  navigateMonth(direction: number) {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(this.currentDate.getMonth() + direction);
    this.currentDate = newDate;
    this.updateCalendarDays();
  }

  getMonthYear(): string {
    return this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  getScansForDate(date: Date): Report[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.reports.filter(report => report.schedule_date === dateStr);
  }

  handleDateClick(day: { date: Date; isCurrentMonth: boolean }) {
    if (day.isCurrentMonth) {
      this.selectedDate = day.date;
      this.reportForm.patchValue({
        schedule_date: day.date
      });
      this.openModal();
    }
  }

openModal() {
  const dialogRef = this.dialog.open(ScheduleFormDialogComponent, {
    width: '600px',
    data: {
      selectedDate: this.selectedDate || new Date()
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.addReportFromDialog(result);
    }
  });
}
addReportFromDialog(data: any) {
  const scheduleDate = data.schedule_date instanceof Date 
    ? data.schedule_date.toISOString().split('T')[0]
    : data.schedule_date;

  const report: Report = {
    id: Math.max(...this.reports.map(r => r.id), 0) + 1,
    user_id: this.userId,
    url: data.url,
    scan_type: data.scan_type || ScanTypeEnum.SECURITY,
    authentification: data.authentification || false,
    schedule_scan: true,
    schedule_date: scheduleDate,
    schedule_time: data.schedule_time || '09:00',
    status: StatutReportEnum.QUEUED,
    progression: 0
  };

  this.reports.push(report);
  this.snackBar.open('Scan planifié avec succès!', 'Fermer', {
    duration: 3000,
    panelClass: ['success-snackbar']
  });
}

  resetForm() {
    this.reportForm.reset({
      project_name: '',
      url: '',
      schedule_date: this.selectedDate || new Date(),
      schedule_time: '09:00',
      scan_type: ScanTypeEnum.SECURITY,
      enable_zap_manual: false,
      authentification: false,
      auth_type: 'basic',
      login_page_url: '',
      username: '',
      password: '',
      token: '',
      cookies: ''
    });
    this.isEditMode = false;
    this.editingScan = null;
  }

  submit() {
    this.markFormGroupTouched(this.reportForm);
    
    if (this.reportForm.valid) {
      this.isSubmitting = true;
      setTimeout(() => {
        if (this.isEditMode && this.editingScan) {
          this.updateReport();
        } else {
          this.addReport();
        }
      }, 1000);
    } else {
      this.snackBar.open('Veuillez corriger les erreurs du formulaire', 'Fermer', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  addReport() {
    try {
      const formData = this.reportForm.value;
            const scheduleDate = formData.schedule_date instanceof Date 
        ? formData.schedule_date.toISOString().split('T')[0]
        : formData.schedule_date;

      const report: Report = {
        id: Math.max(...this.reports.map(r => r.id), 0) + 1,
        user_id: this.userId,
        url: formData.url,
        scan_type: formData.scan_type || ScanTypeEnum.SECURITY,
        authentification: formData.authentification || false,
        schedule_scan: true,
        schedule_date: scheduleDate,
        schedule_time: formData.schedule_time || '09:00',
        status: StatutReportEnum.QUEUED,
        progression: 0
      };
      
      this.reports.push(report);
      this.snackBar.open('Scan planifié avec succès!', 'Fermer', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      this.isSubmitting = false;
    } catch (error) {
      console.error('Error adding report:', error);
      this.snackBar.open('Erreur lors de la planification du scan', 'Fermer', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.isSubmitting = false;
    }
  }
  updateReport() {
    try {
      if (this.editingScan) {
        const formData = this.reportForm.value;
        const index = this.reports.findIndex(r => r.id === this.editingScan!.id);        
        if (index !== -1) {
          const scheduleDate = formData.schedule_date instanceof Date 
            ? formData.schedule_date.toISOString().split('T')[0]
            : formData.schedule_date;

          this.reports[index] = {
            ...this.reports[index],
            url: formData.url,
            scan_type: formData.scan_type,
            authentification: formData.authentification,
            schedule_date: scheduleDate,
            schedule_time: formData.schedule_time
          };
          
          this.snackBar.open('Scan mis à jour avec succès!', 'Fermer', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      }
      this.isSubmitting = false;
    } catch (error) {
      console.error('Error updating report:', error);
      this.snackBar.open('Erreur lors de la mise à jour du scan', 'Fermer', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.isSubmitting = false;
    }
  }
editScan(scan: Report, event: MouseEvent) {
  event.stopPropagation();
  event.preventDefault(); 
  
  const dialogRef = this.dialog.open(ScheduleFormDialogComponent, {
    width: '600px',
    data: {
      scanData: scan, 
      isEditMode: true
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.updateReportFromDialog(scan.id, result);
    }
  });
}
updateReportFromDialog(scanId: number, updatedData: any) {
  const index = this.reports.findIndex(r => r.id === scanId);
  if (index !== -1) {
    const scheduleDate = updatedData.schedule_date instanceof Date 
      ? updatedData.schedule_date.toISOString().split('T')[0]
      : updatedData.schedule_date;

    this.reports[index] = {
      ...this.reports[index],
      url: updatedData.url,
      scan_type: updatedData.scan_type,
      authentification: updatedData.authentification || false,
      schedule_date: scheduleDate,
      schedule_time: updatedData.schedule_time
    };

    this.snackBar.open('Scan mis à jour avec succès!', 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
  private extractProjectName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0] || 'Project';
    } catch {
      return url.replace('https://', '').replace('http://', '').split('/')[0] || 'Project';
    }
  }

  deleteScan(scanId: number, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    const scan = this.reports.find(r => r.id === scanId);
    const scanName = scan ? this.extractProjectName(scan.url) : 'ce scan';
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${scanName} ?`)) {
      const initialLength = this.reports.length;
      this.reports = this.reports.filter(report => report.id !== scanId);
      
      if (this.reports.length < initialLength) {
        this.snackBar.open('Scan supprimé avec succès!', 'Fermer', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        if ( this.selectedDayDetails) {
          this.selectedDayScans = this.getScansForDate(this.selectedDayDetails);
        }
      } else {
        this.snackBar.open('Erreur lors de la suppression', 'Fermer', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }
  quickAddScan(date: Date, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    this.selectedDate = date;
    this.reportForm.patchValue({
      schedule_date: date
    });
    this.openModal();
  }
  showDayDetails(date: Date, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    
    this.selectedDayDetails = date;
    this.selectedDayScans = this.getScansForDate(date);
  }

  getScanTypeConfig(scanType: ScanTypeEnum): ScanTypeConfig {
    return this.scanTypeConfigs[scanType];
  }

  getStatusColor(status: StatutReportEnum): string {
    return this.statusColors[status];
  }

  getDisplayUrl(url: string): string {
    return url.replace(/^https?:\/\//, '');
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  trackByDate(index: number, item: { date: Date; isCurrentMonth: boolean }): string {
    return item.date.toISOString();
  }

  getProgressColor(status: StatutReportEnum): string {
    const colors = {
      [StatutReportEnum.QUEUED]: 'bg-secondary',
      [StatutReportEnum.RUNNING]: 'bg-primary',
      [StatutReportEnum.COMPLETED]: 'bg-success',
      [StatutReportEnum.FAILED]: 'bg-danger',
      [StatutReportEnum.CANCELED]: 'bg-secondary'
    };
    return colors[status] || 'bg-secondary';
  }
  get isFormValid(): boolean {
    return this.reportForm.valid;
  }
  getFormControlError(controlName: string): string {
    const control = this.reportForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName} est requis`;
      }
      if (control.errors['pattern']) {
        return `${controlName} n'est pas valide`;
      }
      if (control.errors['minlength']) {
        return `${controlName} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères`;
      }
    }
    return '';
  }
  getCalendarWeeks(): { date: Date; isCurrentMonth: boolean }[][] {
    const weeks: { date: Date; isCurrentMonth: boolean }[][] = [];
      for (let i = 0; i < this.calendarDays.length; i += 7) {
      weeks.push(this.calendarDays.slice(i, i + 7));
    }
    
    return weeks;
  }
  trackByWeek(index: number, week: { date: Date; isCurrentMonth: boolean }[]): string {
    return week.length > 0 ? week[0].date.toISOString().split('T')[0] : `week-${index}`;
  }
}