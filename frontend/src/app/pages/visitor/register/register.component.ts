import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {  AuthService } from '../../../services/auth/auth.service';
import Swal from 'sweetalert2';
import { RegisterPayload } from '../../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  registerForm: FormGroup;
  loading = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { match: true };
  }

onSubmit() {
  this.loading = true;
  if (this.registerForm.valid) {
    const formData = this.registerForm.value;
    const payload: RegisterPayload = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
      role: "tester",
      address: formData.address
    };

    this.authService.registerUser(payload).subscribe({
      next: (res) => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: 'You have been registered successfully!',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/verify-email'], {
            state: { email: payload.email }
          });
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: err.error?.detail || 'An unexpected error occurred. Please try again.',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK'
        });
        console.error('Registration failed:', err);
      }
    });
  } else {
    this.loading = false;
    Swal.fire({
      icon: 'warning',
      title: 'Invalid Form',
      text: 'Please fill in all required fields correctly.',
      confirmButtonColor: '#f0ad4e',
      confirmButtonText: 'OK'
    });
  }
}
}
