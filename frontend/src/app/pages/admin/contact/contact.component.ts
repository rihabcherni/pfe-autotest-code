import { Component, OnInit, ViewChild } from '@angular/core';
import { ContactUsService } from '../../../services/contact/contact-us.service';
import { ContactMessage } from '../../../models/contact';

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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { MatMenuModule } from '@angular/material/menu';
import { DownloadComponent } from "../../../components/shared/download/download.component";
import { TitleComponent } from "../../../components/shared/title/title.component";
import { SearchInputComponent } from "../../../components/shared/search-input/search-input.component";

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule, MatMenuModule,
    MatSortModule,
    MatFormFieldModule,
    DownloadComponent,
    TitleComponent,
    SearchInputComponent
],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'subject', 'message'];
  dataSource = new MatTableDataSource<ContactMessage>([]);
  searchTerm: string = '';
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  titleValue="Contact message";

  constructor(private contactService: ContactUsService) {}
  ngOnInit() {
    this.loadMessages();
  }
  loadMessages() {
    this.contactService.getMessages('', 1).subscribe((data: ContactMessage[]) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }
  getInitials(name: string): string {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }
  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }
  exportToCSV = async () => {
    const headers = ['Name', 'Email', 'Subject', 'Message'];
    const rows = this.dataSource.filteredData.map(msg => [
      msg.name, msg.email, msg.subject, msg.message
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([decodeURIComponent(encodeURI(csvContent))], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'messages.csv');
  }
  exportToPDF = async () => {
    const doc = new jsPDF();
    const headers = [['Name', 'Email', 'Subject', 'Message']];
    const rows = this.dataSource.filteredData.map(msg => [
      msg.name, msg.email, msg.subject, msg.message
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
    });

    doc.save('messages.pdf');
  }
  exportToHTML = async () => {
    const response = await fetch('assets/templates/table-template.html');
    const template = await response.text();

    const headers = ['Name', 'Email', 'Subject', 'Message'];
    const thead = headers.map(h => `<th>${h}</th>`).join('');
    const title= "List of contact messages"
    const tbody = this.dataSource.filteredData.map(msg =>
      `<tr>
        <td>${msg.name}</td>
        <td>${msg.email}</td>
        <td>${msg.subject}</td>
        <td>${msg.message}</td>
      </tr>`
    ).join('');

    const filledTemplate = template
      .replace('{{title}}', title)
      .replace('{{thead}}', thead)
      .replace('{{tbody}}', tbody);

    const blob = new Blob([filledTemplate], { type: 'text/html;charset=utf-8' });
    saveAs(blob, 'messages.html');
  };
  async downloadAllAsZip() {
    const zip = new JSZip();
    const csvHeaders = ['Name', 'Email', 'Subject', 'Message'];
    const csvRows = this.dataSource.filteredData.map(msg =>
      [msg.name, msg.email, msg.subject, msg.message]
    );
    const csvContent =
      [csvHeaders.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    zip.file('messages.csv', csvContent);
    const response = await fetch('assets/templates/table-template.html');
    const template = await response.text();
    const thead = csvHeaders.map(h => `<th>${h}</th>`).join('');
    const tbody = this.dataSource.filteredData.map(msg =>
      `<tr>
        <td>${msg.name}</td>
        <td>${msg.email}</td>
        <td>${msg.subject}</td>
        <td>${msg.message}</td>
      </tr>`
    ).join('');
    const filledTemplate = template
      .replace('{{thead}}', thead)
      .replace('{{tbody}}', tbody);
    zip.file('messages.html', filledTemplate);
    const pdfDoc = new jsPDF();
    autoTable(pdfDoc, {
      head: [csvHeaders],
      body: this.dataSource.filteredData.map(msg => [
        msg.name, msg.email, msg.subject, msg.message
      ])
    });
    const pdfBlob = pdfDoc.output('blob');
    zip.file('messages.pdf', pdfBlob);
    zip.generateAsync({ type: 'blob' }).then(zipBlob => {
      saveAs(zipBlob, 'all_messages.zip');
    });
  }
}