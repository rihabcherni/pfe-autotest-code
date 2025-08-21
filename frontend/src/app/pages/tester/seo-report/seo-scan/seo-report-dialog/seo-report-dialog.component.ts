import { CommonModule } from '@angular/common';
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
import { SeoReportService } from '../../../../../services/seo-report/seo-report.service';
import { AuthService } from '../../../../../services/auth/auth.service';

@Component({
  selector: 'app-seo-report-dialog',
  standalone: true,
  imports: [ CommonModule,MatDialogModule, MatFormFieldModule,MatOptionModule,MatCheckboxModule, MatSelectModule, MatInputModule,MatButtonModule,MatSnackBarModule,FormsModule,
    MatIconModule,ReactiveFormsModule],
  templateUrl: './seo-report-dialog.component.html',
  styleUrl: './seo-report-dialog.component.css'
})

export class SeoReportDialogComponent implements OnInit{
  reportForm: FormGroup;
  isSubmitting = false;
  userId!: number;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<SeoReportDialogComponent>,
    private snackBar: MatSnackBar,
    private seoReportService: SeoReportService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
   this.reportForm = this.fb.group({
      user_id: [this.userId],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    });
  }
  ngOnInit(): void {
      this.userId = this.authService.getUserId()!;
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
    scan_type: 'seo',
    authentification: this.reportForm.value.authentification || false,
    schedule_scan: false,
    scan_started_at: now,
    scan_finished_at: null,
    url: this.reportForm.value.url,
    status: 'running',
    progression: 0,
    authentication_details: null,
    security_details: null,
    seo_details: null,
    functional_details: null
  };
this.seoReportService.createReport(payload).subscribe({
      next: (response) => {
        this.snackBar.open('Rapport Seo créé avec succès!', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(response);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erreur création rapport:', err);
        this.snackBar.open('Erreur lors de la création du rapport', 'Fermer', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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
