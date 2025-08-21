import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ContactUsService } from '../../../services/contact/contact-us.service';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  contactForm!: FormGroup;
  messageSent = false;
  messageError = false;
  loading = false;

  constructor(private fb: FormBuilder, private contactService: ContactUsService) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }
  onSubmit() {
    if (this.contactForm.invalid) return;

    this.loading = true;

    this.contactService.sendMessage(this.contactForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.contactForm.reset();

        Swal.fire({
          icon: 'success',
          title: 'Message sent!',
          text: 'Your message has been successfully sent. Thank you!',
          confirmButtonColor: '#3085d6',
        });
      },
      error: () => {
        this.loading = false;

        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong while sending your message. Please try again later.',
          confirmButtonColor: '#d33',
        });
      }
    });
  }
}
