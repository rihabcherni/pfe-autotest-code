import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css'] 
})
export class VerifyEmailComponent {
  email = '';
  code = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { email: string };

    if (state?.email) {
      this.email = state.email;
    }
  }

  verifyEmail() {
    this.loading = true;

    this.authService.verifyEmail(this.email, this.code).subscribe({
      next: (res) => {
        this.loading = false;
        Swal.fire('Success', res.message || 'Email successfully verified.', 'success').then(() => {
          this.router.navigate(['/login']); 
        });
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err.error.detail || 'Verification failed.', 'error');
      }
    });
  }
}
