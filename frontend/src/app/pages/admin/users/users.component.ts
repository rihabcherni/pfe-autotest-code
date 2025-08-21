import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableDataSource } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { DownloadComponent } from "../../../components/shared/download/download.component";
import { User } from '../../../models/user';
import { UsersService } from '../../../services/users/users.service';
import { TitleComponent } from "../../../components/shared/title/title.component";
import Swal from 'sweetalert2';
import { SearchInputComponent } from "../../../components/shared/search-input/search-input.component";

interface Permission {
  name: string;
  value: string;
  selected: boolean;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatMenuModule,
    MatSortModule,
    MatFormFieldModule,
    MatChipsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTooltipModule,
    DownloadComponent,
    TitleComponent,
    SearchInputComponent
],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'phone', 'address', 'role', 'status','permissions', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  searchTerm: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  titleValue="Users";

  showEditDialog = false;
  selectedUser: User | null = null;
  availablePermissions: Permission[] = [
    { name: 'Security Test', value: 'securite', selected: false },
    { name: 'Functional Test', value: 'fonctionnel', selected: false },
    { name: 'SEO Test', value: 'seo', selected: false },
    { name: 'Full Test', value: 'full', selected: false },
    { name: 'Schedule Test', value: 'schedule_scan', selected: false },
    { name: 'Send Reports', value: 'send_reports', selected: false },
  ];
  isSaving = false;

  constructor(private userService: UsersService) {}
  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe((data: User[]) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return `${item.first_name} ${item.last_name}`.toLowerCase();
        case 'email':
          return item.email?.toLowerCase();
        case 'phone':
          return item.phone;
        case 'address':
          return item.address?.toLowerCase();
        case 'status':
          return item.is_verified ? 'verified' : 'pending';
        case 'role':
          return item.role?.toLowerCase();
        case 'permissions':
          return item.permissions;
        default:
          return (item as any)[property];
      }
    };
  }
  getInitials(firstName: string, lastName: string): string {
    if (!firstName && !lastName) return '?';
    const first = firstName?.charAt(0).toUpperCase() || '';
    const last = lastName?.charAt(0).toUpperCase() || '';
    return first + last;
  }
  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }
  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'accent';
      case 'tester':
        return 'primary';
      default:
        return 'basic';
    }
  }

  getStatusColor(isVerified: boolean): string {
    return isVerified ? 'primary' : 'warn';
  }

  getStatusText(isVerified: boolean): string {
    return isVerified ? 'Verified' : 'Pending';
  }

  getPermissionsArray(permissions: string | string[] | undefined): string[] {
    if (!permissions) return [];
    if (Array.isArray(permissions)) return permissions;
    if (typeof permissions === 'string') {
      try {
        return JSON.parse(permissions);
      } catch {
        return permissions.split(',').map(p => p.trim()).filter(p => p);
      }
    }
    return [];
  }

  editUserPermissions(user: User) {
    this.selectedUser = user;
    this.showEditDialog = true;
    this.availablePermissions.forEach(perm => {
      perm.selected = false;
    });
    
    this.userService.getUserPermissions(user.id).subscribe({
      next: (response) => {
        const userPermissions = response.permissions || [];
        this.availablePermissions.forEach(perm => {
          perm.selected = userPermissions.includes(perm.value);
        });
      },
      error: (error) => {
        console.error('Error loading user permissions:', error);
      }
    });
  }

  closeEditDialog() {
    this.showEditDialog = false;
    this.selectedUser = null;
    this.isSaving = false;
  }

  savePermissions() {
    if (!this.selectedUser) return;
    
    this.isSaving = true;
    const selectedPermissions = this.availablePermissions
      .filter(perm => perm.selected)
      .map(perm => perm.value);

    const payload = {
      user_id: this.selectedUser.id,
      permissions: selectedPermissions
    };

    this.userService.updateUserPermissions(payload).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Success!',
          text: 'User permissions updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.closeEditDialog();
        this.loadUsers(); 
      },
      error: (error) => {
        console.error('Error updating permissions:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to update user permissions. Please try again.',
          icon: 'error'
        });
        this.isSaving = false;
      }
    });
  }

  deleteUser(userId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the user.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(userId).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'The user has been deleted.', 'success');
            this.loadUsers();
          },
          error: () => {
            Swal.fire('Error', 'Unable to delete the user.', 'error');
          }
        });
      }
    });
  }

  exportToCSV = async () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Permissions'];
    const rows = this.dataSource.filteredData.map(user => [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.address,
      user.role,
      this.getStatusText(user.is_verified),
      this.getPermissionsArray(user.permissions).join(', ')
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'users.csv');
  }

  exportToPDF = async () => {
    const doc = new jsPDF();
    const headers = [['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Permissions']];
    const rows = this.dataSource.filteredData.map(user => [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.address,
      user.role,
      this.getStatusText(user.is_verified),
      this.getPermissionsArray(user.permissions).join(', ')
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
    });

    doc.save('users.pdf');
  }

  exportToHTML = async () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Permissions'];
    const rows = this.dataSource.filteredData.map(user =>
      `<tr>
        <td>${user.first_name}</td>
        <td>${user.last_name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.address}</td>
        <td>${user.role}</td>
        <td>${this.getStatusText(user.is_verified)}</td>
        <td>${this.getPermissionsArray(user.permissions).join(', ')}</td>
      </tr>`
    );

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Users List</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Users List</h1>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    saveAs(blob, 'users.html');
  }

  async downloadAllAsZip() {
    const zip = new JSZip();
    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Permissions'];
    const csvRows = this.dataSource.filteredData.map(user =>
      [user.first_name, user.last_name, user.email, user.phone, user.address, user.role, this.getStatusText(user.is_verified), this.getPermissionsArray(user.permissions).join(', ')]
    );
    const csvContent =
      [csvHeaders.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    zip.file('users.csv', csvContent);
    const htmlTableRows = this.dataSource.filteredData.map(user =>
      `<tr>
        <td>${user.first_name}</td>
        <td>${user.last_name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td>${user.address}</td>
        <td>${user.role}</td>
        <td>${this.getStatusText(user.is_verified)}</td>
        <td>${this.getPermissionsArray(user.permissions).join(', ')}</td>
      </tr>`
    );
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Users List</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Users List</h1>
          <table>
            <thead>
              <tr><th>First Name</th><th>Last Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Role</th><th>Status</th><th>Permissions</th></tr>
            </thead>
            <tbody>
              ${htmlTableRows.join('')}
            </tbody>
          </table>
        </body>
      </html>`;
    zip.file('users.html', htmlContent);
    const pdfDoc = new jsPDF();
    autoTable(pdfDoc, {
      head: [['First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 'Permissions']],
      body: this.dataSource.filteredData.map(user => [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.address,
        user.role,
        this.getStatusText(user.is_verified),
        this.getPermissionsArray(user.permissions).join(', ')
      ])
    });
    const pdfBlob = pdfDoc.output('blob');
    zip.file('users.pdf', pdfBlob);

    zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
      saveAs(zipBlob, 'all_users.zip');
    });
  }
getStatusClass(isVerified: boolean): string {
  return isVerified ? 'badge-verified' : 'badge-pending';
}

getRoleClass(role: string): string {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'badge-admin';
    case 'user':
    default:
      return 'badge-user';
  }
}
}