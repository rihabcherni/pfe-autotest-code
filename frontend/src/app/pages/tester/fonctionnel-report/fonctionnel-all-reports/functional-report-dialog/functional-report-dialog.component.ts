import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../../../services/auth/auth.service';
import { FunctionalReportService } from '../../../../../services/functional-report/functional_report.service';

@Component({
  selector: 'app-functional-report-dialog',
  standalone: true,
  imports: [ CommonModule,MatDialogModule, MatFormFieldModule,MatOptionModule,MatCheckboxModule, MatSelectModule, MatInputModule,MatButtonModule,MatSnackBarModule,FormsModule,
    MatIconModule,ReactiveFormsModule],
  templateUrl: './functional-report-dialog.component.html',
  styleUrl: './functional-report-dialog.component.css'
})
export class FunctionalReportDialogComponent  implements OnInit{
  reportForm: FormGroup;
  isSubmitting = false;
  userId!: number;
  ngOnInit(): void {
    this.userId = this.authService.getUserId()!;
    this.reportForm.patchValue({ user_id: this.userId });
  }

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<FunctionalReportDialogComponent>,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private reportService: FunctionalReportService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
   this.reportForm = this.fb.group({
        user_id: [null],
      project_name: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      enable_zap_manual: [false],
      authentification: [false],
      auth_type: [''],
      login_page_url: [''],
      username: [''],
      password: [''],
      token: [''],
      cookies: ['']
    });

  }
  submit(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const now = new Date().toISOString();

    const payload = {
      user_id: this.reportForm.value.user_id,
      scan_type: 'functional',
      authentification: this.reportForm.value.authentification || false,
      schedule_scan: false,
      scan_started_at: now,
      scan_finished_at: null,
      url: this.reportForm.value.url,
      status: 'running',
      progression: 0,
      authentication_details: {
        login_page_url: this.reportForm.value.login_page_url || '',
        cookies: this.reportForm.value.cookies || '',
        username: this.reportForm.value.username || '',
        password: this.reportForm.value.password || '',
        token: this.reportForm.value.token || ''
      },
      security_details: null,
      seo_details: null,
      functional_details: {
        project_name: this.reportForm.value.project_name || '',
        message_result: '',
        workflows: []
      }
    };

    this.reportService.createReport(payload).subscribe({
      next: (response: any) => {
        this.snackBar.open('Functional report created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close({ success: true, report: response });
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating report:', err);
        this.snackBar.open('Error creating report', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.dialogRef.close({ success: false });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.reportForm.controls).forEach(key => {
      const control = this.reportForm.get(key);
      control?.markAsTouched();
    });
  }
}