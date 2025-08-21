import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class TestimonialsComponent {
  fadeUp = 'fade-up';

  testimonials = [
    {
      name: 'Alice Morgan',
      role: 'CTO @CyberSafe',
      rating: 5,
      feedback: 'The automated vulnerability scans saved us hours each week. Seamless integration with Jira and Slack is a huge plus!'
    },
    {
      name: 'Rania El-Feki',
      role: 'QA Lead',
      rating: 4,
      feedback: 'Functional test scenarios run smoothly. I love the flexibility and the user-friendly dashboard.'
    },
    {
      name: 'Tomé Nunes',
      role: 'Security Consultant',
      rating: 4,
      feedback: 'An excellent framework for automating recon and scans. Easy to configure and extensible for advanced teams.'
    }
  ];
  
  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
  
}
