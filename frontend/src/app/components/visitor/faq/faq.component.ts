import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqItems = [
    { question: 'What is an automated penetration testing application?', answer: 'Our application automates penetration tests to assess the security of your systems. It detects vulnerabilities and provides detailed reports to improve the security of your infrastructure.', isOpen: false },
    { question: 'How do the functional tests integrated into the application work?', answer: 'Functional tests are integrated to ensure the application works properly under various conditions. They check performance, compatibility, and ensure that features meet defined requirements.', isOpen: false },
    { question: 'Are the generated reports customizable?', answer: 'Yes, you can customize the reports to meet your needs. You can filter vulnerabilities by type, risk level, or other specific criteria.', isOpen: false },
    { question: 'How can I integrate this application into my development workflow?', answer: 'Our application easily integrates with tools like Jira and Slack, allowing you to track detected vulnerabilities and collaborate efficiently with your development and security teams.', isOpen: false },
    { question: 'Is this application suitable for testing web applications?', answer: 'Yes, our application is designed to perform penetration testing on web applications, including testing entry points, login forms, API services, and more.', isOpen: false }
  ];
  toggleItem(index: number): void {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
    this.faqItems.forEach((item, i) => {
      if (i !== index) {
        item.isOpen = false;
      }
    });
  }
}
