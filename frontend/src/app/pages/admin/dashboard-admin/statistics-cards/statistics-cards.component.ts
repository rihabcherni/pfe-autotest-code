import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AdminStatisticsService, DashboardStats } from '../../../../services/dashboard/admin-statistics.service';

@Component({
  selector: 'app-statistics-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics-cards.component.html',
  styleUrls: ['./statistics-cards.component.css'],
})

export class StatisticsCardsComponent implements OnInit {
  dashboardStats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;
 
  constructor(private http: HttpClient, private statisticsService: AdminStatisticsService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.statisticsService.getOverviewStats()
      .subscribe({
        next: (data) => {
          this.dashboardStats = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erreur lors du chargement des statistiques';
          this.loading = false;
          console.error('Error loading dashboard stats:', err);
        }
      });
  }

  getSuccessRate(success: number, total: number): number {
    return total > 0 ? (success / total) * 100 : 0;
  }

  getPendingRate(pending: number, total: number): number {
    return total > 0 ? (pending / total) * 100 : 0;
  }

  getFailedRate(fail: number, total: number): number {
    return total > 0 ? (fail / total) * 100 : 0;
  }


  getRiskColor(riskLevel: string): string {
    const colors = {
      'high': 'danger',
      'medium': 'warning',
      'low': 'info',
      'informational': 'secondary'
    };
    return colors[riskLevel as keyof typeof colors] || 'primary';
  }
}

