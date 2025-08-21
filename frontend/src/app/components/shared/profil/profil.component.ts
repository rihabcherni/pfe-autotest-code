import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfile } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TitleComponent } from '../title/title.component';
import { environment } from '../../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from '../../../services/users/users.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog'; // optionnel si tu passes par composant custom

interface Permission {
  name: string;
  value: string;
  selected: boolean;
  disabled?: boolean; 
}
@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule,
  MatCheckboxModule,MatDialogModule,
  MatButtonModule, ReactiveFormsModule, TitleComponent, MatIconModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})

export class ProfilComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  userProfile!: UserProfile;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  titleValue = "User Profile";
  activeTab: 'profile' | 'password' = 'profile';

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  id: number =0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private usersService: UsersService  ) {}

  ngOnInit(): void {
     this.authService.getProfile().subscribe(profile => {
        this.userProfile = profile;
        this.profileForm = this.fb.group({
          first_name: [profile.first_name, Validators.required],
          last_name: [profile.last_name, Validators.required],
          email: [profile.email, [Validators.required, Validators.email]],
          phone: [profile.phone],
          address: [profile.address]
        });
      });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }
  onSubmit(): void {
    if (this.profileForm.valid) {
      this.authService.updateProfile(this.profileForm.value).subscribe({
        next: (response) => {
          if (response.user) {
            this.userProfile = response.user;
          }   
          Swal.fire('Profile updated successfully', '', 'success').then(() => {
            window.location.reload();
          });
          this.refreshUserData();
        },
        error: (error) => {
          Swal.fire('Error updating profile', error.error?.detail || 'Unknown error', 'error');
        }
      });
    }
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.previewUrl = reader.result;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.authService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        Swal.fire('Image uploaded successfully!', '', 'success').then(() => {
          window.location.reload();
        });

        
        if (response.profile_image) {
          this.userProfile.profile_image = response.profile_image;
        }
        this.selectedFile = null;
        this.previewUrl = null;        
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }        
        this.refreshUserData();
      },
      error: (error) => {
        Swal.fire('Error uploading image', error.error?.detail || 'Unknown error', 'error');
      }
    });
  }

  get profileImageUrl(): string | null {
    return this.userProfile?.profile_image
      ? `${environment.apiUrl}/static/profile_images/${this.userProfile.profile_image}`
      : null;
  }

  onSubmitChangePassword(): void {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      Swal.fire('Passwords do not match', '', 'warning');
      return;
    }

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        Swal.fire('Password changed successfully', '', 'success');
        this.passwordForm.reset();
        this.showCurrentPassword = false;
        this.showNewPassword = false;
        this.showConfirmPassword = false;
      },
      error: (error) => {
        Swal.fire('Error updating password', error.error?.detail || 'Unknown error', 'error');
      }
    });
  }
  private refreshUserData(): void {
    console.log('User data updated:', this.authService.getUser());
  }
  showEditDialog = false;
  availablePermissions: Permission[] = [
    { name: 'Security Test', value: 'securite', selected: false },
    { name: 'Functional Test', value: 'fonctionnel', selected: false },
    { name: 'SEO Test', value: 'seo', selected: false },
    { name: 'Full Test', value: 'full', selected: false },
    { name: 'Schedule Test', value: 'schedule_scan', selected: false },
    { name: 'Send Reports', value: 'send_reports', selected: false },
  ];
  isSaving= false ;
  openEditDialog(): void {
    if (this.userProfile?.permissions && this.userProfile.permissions.length > 0) {
      this.availablePermissions = this.availablePermissions.map(perm => ({
        ...perm,
        disabled: this.userProfile!.permissions!.includes(perm.value),
        selected: false
      }));
    } else {
      this.availablePermissions = this.availablePermissions.map(perm => ({
        ...perm,
        disabled: false,
        selected: false
      }));
    }

    this.showEditDialog = true;
  }
  closeEditDialog(): void {
    this.showEditDialog = false;
    this.isSaving = false;
  }
  sendAdminPermissions() {
    this.isSaving = true;
    const user = this.authService.getUser();
    if (user?.id !== undefined) {
      this.id = user.id;
    } else {
      console.warn('User ID is undefined');
    }

    const requestedPermissions = this.availablePermissions
      .filter(p => p.selected)
      .map(p => p.value);

    if (requestedPermissions.length === 0) {
      Swal.fire('No permissions selected', 'Please select at least one permission to request.', 'warning');
      this.isSaving = false;
      return;
    }
    this.usersService.requestPermissions(this.id, requestedPermissions).subscribe({
      next: () => {
        Swal.fire('Request sent', 'Your permission request has been submitted.', 'success');
        this.closeEditDialog();
      },
      error: (error) => {
        Swal.fire('Error', error.error?.detail || 'Could not send request.', 'error');
        this.isSaving = false;
      }
    });
  }
}