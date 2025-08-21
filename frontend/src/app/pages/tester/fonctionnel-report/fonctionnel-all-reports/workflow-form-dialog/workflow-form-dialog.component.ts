import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-workflow-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule, MatInputModule, MatButtonModule],
  templateUrl: './workflow-form-dialog.component.html',
  styleUrl: './workflow-form-dialog.component.css'
})

export class WorkflowFormDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<WorkflowFormDialogComponent>
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value); 
    }
  }
}

