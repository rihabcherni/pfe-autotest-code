
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Subject, takeUntil, forkJoin, flatMap } from 'rxjs';
import { ReportsByPeriod, TesterOverviewStats, TesteurStatisticsService, VulnerabilitiesByPeriod } from '../../../services/dashboard/testeur-statistics.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { CardsStatisticsTesterComponent } from './cards-statistics-tester/cards-statistics-tester.component';
import { TitleComponent } from '../../../components/shared/title/title.component';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-tester-dashboard',
  standalone: true,
  imports: [FormsModule,CardsStatisticsTesterComponent, TitleComponent, MatCardModule, CommonModule],
  templateUrl: './tester-dashboard.component.html',
  styleUrl: './tester-dashboard.component.css'
})
export class TesterDashboardComponent implements OnInit, OnDestroy {
onChangePeriod($event: Event) {
throw new Error('Method not implemented.');
}
onTypeChange($event: Event) {
throw new Error('Method not implemented.');
}
  @ViewChild('reportsByTypeChart', { static: false }) reportsByTypeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reportsByStatusChart', { static: false }) reportsByStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('functionalWorkflowChart', { static: false }) functionalWorkflowChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('vulnerabilityRiskChart', { static: false }) vulnerabilityRiskChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('vulnerabilitiesByPeriodChart', { static: false }) vulnerabilitiesByPeriodChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('reportsByPeriodChart', { static: false }) reportsByPeriodChart!: ElementRef<HTMLCanvasElement>;
  private reportsByPeriodChartInstance?: Chart;
  titleValue = 'Dashboard';    
  private destroy$ = new Subject<void>();
  overviewStats: TesterOverviewStats | null = null;
  vulnerabilitiesByPeriod: VulnerabilitiesByPeriod | null = null;
  reportsByPeriod: ReportsByPeriod | null = null;
  private charts: Chart[] = [];
  isLoading = true;
  error: string | null = null;
  selectedPeriod: 'day' | 'week' | 'month' | 'year' | 'all' = 'day';
  functionalSuccessRate = 0;
  completionRate = 0;
  averageScore = 0;
  totalVulnerabilities = 0;
  riskLevels: any;
  constructor(private statisticsService: TesteurStatisticsService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
    if (this.reportsByPeriodChartInstance) {
      this.reportsByPeriodChartInstance.destroy();
    }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      overview: this.statisticsService.getTesterStats(),
      vulnerabilities: this.statisticsService.getVulnerabilitiesByPeriod(),
      reports: this.statisticsService.getReportsByPeriod()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.overviewStats = data.overview;
        this.vulnerabilitiesByPeriod = data.vulnerabilities;
        this.reportsByPeriod = data.reports;
        
        this.calculateMetrics();
        this.initializeCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  private calculateMetrics(): void {
    if (!this.overviewStats) return;

    this.functionalSuccessRate = this.statisticsService.getFunctionalSuccessRate(this.overviewStats);
    this.completionRate = this.statisticsService.getCompletionRate(this.overviewStats);
    this.averageScore = this.overviewStats.seo.average_score;
    this.totalVulnerabilities = this.overviewStats.security.total_vulnerabilities_reports;
  }
  updateVulnerabilityChart(): void {
      setTimeout(() => {
      this.createVulnerabilitiesByPeriodChart();
    }, 100);
  }

  private initializeCharts(): void {
    setTimeout(() => {
      this.createReportsByTypeChart();
      this.createReportsByStatusChart();
      this.createFunctionalWorkflowChart();
      this.createVulnerabilityRiskChart();
      this.createVulnerabilitiesByPeriodChart();
      this.createReportsByPeriodChart();
    }, 100);
  }

  private createReportsByTypeChart(): void {
    if (!this.overviewStats || !this.reportsByTypeChart) return;

    const ctx = this.reportsByTypeChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.overviewStats.reports.by_type;
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['SEO', 'Functional', 'Security'],
        datasets: [{
          data: [data.seo, data.functional, data.security],
          backgroundColor: [
            '#3B82F6', 
            '#10B981',
            '#EF4444'  
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private createReportsByStatusChart(): void {
    if (!this.overviewStats || !this.reportsByStatusChart) return;

    const ctx = this.reportsByStatusChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.overviewStats.reports.by_status;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Completed', 'Running', 'Failed', 'Queued', 'Canceled'],
        datasets: [{
          label: 'Reports',
          data: [data.completed, data.running, data.failed, data.queued, data.canceled],
          backgroundColor: ['#10B981', '#3B82F6','#EF4444','#F59E0B', '#6B7280'  ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private createFunctionalWorkflowChart(): void {
    if (!this.overviewStats || !this.functionalWorkflowChart) return;

    const ctx = this.functionalWorkflowChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.overviewStats.functional;
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Success', 'Failed', 'Pending'],
        datasets: [{
          data: [data.success, data.fail, data.pending],
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B'  ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    this.charts.push(chart);
  }

  private createVulnerabilityRiskChart(): void {
    if (!this.overviewStats || !this.vulnerabilityRiskChart) return;

    const ctx = this.vulnerabilityRiskChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const data = this.overviewStats.security.by_risk;
    const chart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['High', 'Medium', 'Low', 'Informational', 'Other'],
        datasets: [{
          data: [data.high, data.medium, data.low, data.informational, data.other],
          backgroundColor: ['#DC2626','#EA580C','#D97706', '#0891B2', '#6B7280'  ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
    this.charts.push(chart);
  }
private destroyChartByCanvas(canvas: HTMLCanvasElement): void {
  const chartIndex = this.charts.findIndex(c => c.canvas === canvas);
  if (chartIndex !== -1) {
    this.charts[chartIndex].destroy();
    this.charts.splice(chartIndex, 1);
  }
}

private createVulnerabilitiesByPeriodChart(): void {
  if (!this.vulnerabilitiesByPeriod || !this.vulnerabilitiesByPeriodChart) return;

  const ctx = this.vulnerabilitiesByPeriodChart.nativeElement.getContext('2d');
  if (!ctx) return;

  this.destroyChartByCanvas(this.vulnerabilitiesByPeriodChart.nativeElement);

  const period = this.selectedPeriod;
  const data = this.vulnerabilitiesByPeriod.vulnerabilitiesData;

  const chart = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: ['High', 'Medium', 'Low', 'Informational', 'Other'],
      datasets: [
        {
          label: `Vulnerability (${period})`,
          data: [
            data.high[period],
            data.medium[period],
            data.low[period],
            data.informational[period],
            data.other[period]
          ],
          backgroundColor: [
            '#dc3545',
            '#ffc107',
            '#28a745',
            '#17a2b8',
            '#6c757d'
          ]
        }
      ]
    },
    options: {
      responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
    }
  });

  this.charts.push(chart);
}
public createReportsByPeriodChart(): void {
  if (!this.reportsByPeriod || !this.reportsByPeriodChart) return;

  const period = this.selectedPeriod;
  let labels: string[] = [];
  let datasets: any[] = [];

  const scanTypes = ['seo', 'functional', 'security'];

  if (period === 'all') {
    labels = scanTypes.map(type => type.toUpperCase());
    const allData = this.reportsByPeriod.data.all;
    datasets = [{
      label: 'Total Reports',
      data: scanTypes.map(type => allData[type] ?? 0),
      backgroundColor: scanTypes.map(type => this.getColorByScanType(type)),
      borderColor: scanTypes.map(type => this.getColorByScanType(type)),
      fill: true,
      tension: 0.3
    }];
  } else {
    const rawLabels = this.reportsByPeriod.labels[period];
    labels = rawLabels.map(String);

    const dataByPeriod = this.reportsByPeriod.data[period] as Record<string, Record<string, number>>;

    const monthNameToIndex: Record<string, number> = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
    };

    datasets = scanTypes.map(type => ({
      label: type.toUpperCase(),
      data: labels.map(label => {
        let key: string | number = label;

        if (period === 'month') {
          key = monthNameToIndex[label] ?? label;
        } else if (period === 'week' || period === 'year') {
          key = !isNaN(Number(label)) ? Number(label) : label;
        }

        return dataByPeriod?.[type]?.[key] ?? 0;
      }),
      fill: false,
      borderColor: this.getColorByScanType(type),
      backgroundColor: this.getColorByScanType(type),
      tension: 0.3
    }));
  }

  const ctx = this.reportsByPeriodChart.nativeElement.getContext('2d');
  if (!ctx) return;

  if (this.reportsByPeriodChartInstance) {
    this.reportsByPeriodChartInstance.destroy();
  }

  this.reportsByPeriodChartInstance = new Chart(ctx, {
    type: period === 'all' ? 'bar' : 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
        
      },
      scales: {
        x: {
          title: {
            display: true,
            text: period === 'all' ? 'Type Scan' : 'Period'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Nombre de rapports'
          },
          beginAtZero: true
        }
      }
    }
  });
}

private getColorByScanType(type: string): string {
  switch (type) {
    case 'seo': return '#007bff';      
    case 'functional': return '#28a745'; 
    case 'security': return '#dc3545';   
    default: return '#6c757d';          
  }
}

  refreshData(): void {
    this.destroyCharts();
    this.loadDashboardData();
  }

  private destroyCharts(): void {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }
}
