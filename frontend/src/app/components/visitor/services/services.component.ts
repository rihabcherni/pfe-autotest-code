import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  services = [
    {
      icon: 'fas fa-shield-alt',
      title: 'Security Scan Automation',
      description: 'Automate security tests using integrated tools like ZAP, Wapiti, SQLMap, Nikto, and more to detect a wide range of vulnerabilities.'
    },
    {
      icon: 'fas fa-tasks',
      title: 'Functional Testing',
      description: 'Create and manage test scenarios, test cases, and steps to ensure comprehensive functional coverage of your applications.'
    },
    {
      icon: 'fas fa-lock',
      title: 'Authenticated Scanning',
      description: 'Perform security scans on protected areas by leveraging dynamic authentication with cookies, tokens, or passwords.'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Real-time Monitoring',
      description: 'Track scan progress in real-time via WebSocket technology and receive instant notifications for critical vulnerabilities.'
    },
    {
      icon: 'fas fa-file-alt',
      title: 'Comprehensive Reports',
      description: 'Generate detailed reports in multiple formats (JSON, PDF, CSV) and integrate with tools like Jira, Slack, and email.'
    },
    {
      icon: 'fas fa-calendar-alt',
      title: 'Scheduled Scans',
      description: 'Set up automated scanning schedules to regularly monitor your applications for new vulnerabilities.'
    }
  ];
}
