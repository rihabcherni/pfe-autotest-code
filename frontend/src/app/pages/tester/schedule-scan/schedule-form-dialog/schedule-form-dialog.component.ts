
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Report, ScanTypeEnum } from '../../../../models/schedule';

export interface ScanDialogData {
  scan?: Report;
  selectedDate?: Date;
}
@Component({
  selector: 'app-schedule-form-dialog',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule],
  templateUrl: './schedule-form-dialog.component.html',
  styleUrl: './schedule-form-dialog.component.css'
})
export class ScheduleFormDialogComponent implements OnInit {
  reportForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;

  scanTypeOptions = [
    { value: ScanTypeEnum.SECURITY, label: 'SECURITY' },
    { value: ScanTypeEnum.SEO, label: 'SEO' },
    { value: ScanTypeEnum.FUNCTIONAL, label: 'Functional' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ScheduleFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ScanDialogData
  ) {
    this.isEditMode = !!data.scan;
  }

  ngOnInit() {
    this.initializeForm();
    if (this.data.scan) {
      this.populateFormForEdit();
    } else if (this.data.selectedDate) {
      this.reportForm.patchValue({
        schedule_date: this.data.selectedDate
      });
    }
  }

  initializeForm() {
    this.reportForm = this.fb.group({
      project_name: ['', [Validators.required, Validators.minLength(3)]],
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      schedule_date: [this.data.selectedDate || new Date(), Validators.required],
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

    this.setupConditionalValidators();
  }

  setupConditionalValidators() {
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

  populateFormForEdit() {
    if (this.data.scan) {
      const scan = this.data.scan;
      const scheduleDate = new Date(scan.schedule_date ?? '');

      this.reportForm.patchValue({
        project_name: this.extractProjectName(scan.url),
        url: scan.url,
        schedule_date: scheduleDate,
        schedule_time: scan.schedule_time,
        scan_type: scan.scan_type,
        authentification: scan.authentification || false,
        enable_zap_manual: false,
        auth_type: 'basic',
        login_page_url: '',
        username: '',
        password: '',
        token: '',
        cookies: ''
      });
    }
  }

  extractProjectName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').split('.')[0] || 'Project';
    } catch {
      return url.replace('https://', '').replace('http://', '').split('/')[0] || 'Project';
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (this.reportForm.valid) {
      this.isSubmitting = true;
        setTimeout(() => {
        const formData = this.reportForm.value;
        const scheduleDate = formData.schedule_date instanceof Date 
          ? formData.schedule_date.toISOString().split('T')[0]
          : formData.schedule_date;

        const result = {
          ...formData,
          schedule_date: scheduleDate,
          isEdit: this.isEditMode,
          scanId: this.data.scan?.id
        };

        this.dialogRef.close(result);
      }, 1000);
    } else {
      this.markFormGroupTouched(this.reportForm);
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
}