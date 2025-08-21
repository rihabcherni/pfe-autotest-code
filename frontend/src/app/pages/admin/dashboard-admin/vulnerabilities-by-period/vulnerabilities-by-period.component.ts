import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';
import { AdminStatisticsService, VulnerabilityStats } from '../../../../services/dashboard/admin-statistics.service';
import { FormsModule } from '@angular/forms'; 
type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all';

@Component({
  selector: 'app-vulnerabilities-by-period',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vulnerabilities-by-period.component.html',
  styleUrl: './vulnerabilities-by-period.component.css'
})
export class VulnerabilitiesByPeriodComponent implements AfterViewInit, OnChanges {
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() selectedPeriod: FilterPeriod = 'day';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPeriod'] && !changes['selectedPeriod'].firstChange) {
      this.updateCharts();
    }
  }
  pieChart: Chart | undefined;

  chartData: { [period in FilterPeriod]: number[] } = {
    day: [0, 0, 0, 0, 0],
    week: [0, 0, 0, 0, 0],
    month: [0, 0, 0, 0, 0],
    year: [0, 0, 0, 0, 0],
    all: [0, 0, 0, 0, 0]
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private statisticsService: AdminStatisticsService
  ) {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCharts();
      this.loadStats();
    }
  }

  initializeCharts(): void {
    const pieConfig: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: ['High', 'Medium', 'Low', 'Informational', 'Other'],
        datasets: [{
          label: 'Vulnerability severity',
          data: this.chartData[this.selectedPeriod],
          backgroundColor: ['#FF6384', '#FF9F40', '#FFCD56', '#4BC0C0', '#36A2EB']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Vulnerabilities by Severity / Period'
          }
        }
      }
    };

    this.pieChart = new Chart(this.pieChartCanvas.nativeElement, pieConfig);
  }

  updateCharts(): void {
    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = this.chartData[this.selectedPeriod];
      this.pieChart.update();
    }
  }

  loadStats(): void {
    this.statisticsService.getVulnerabilityStats().subscribe((data: any) => {
      this.chartData.day = [
        data.vulnerabilitiesData.high.day,
        data.vulnerabilitiesData.medium.day,
        data.vulnerabilitiesData.low.day,
        data.vulnerabilitiesData.informational.day,
        data.vulnerabilitiesData.other.day
      ];
      this.chartData.week = [
        data.vulnerabilitiesData.high.week,
        data.vulnerabilitiesData.medium.week,
        data.vulnerabilitiesData.low.week,
        data.vulnerabilitiesData.informational.week,
        data.vulnerabilitiesData.other.week
      ];
      this.chartData.month = [
        data.vulnerabilitiesData.high.month,
        data.vulnerabilitiesData.medium.month,
        data.vulnerabilitiesData.low.month,
        data.vulnerabilitiesData.informational.month,
        data.vulnerabilitiesData.other.month
      ];
      this.chartData.year = [
        data.vulnerabilitiesData.high.year,
        data.vulnerabilitiesData.medium.year,
        data.vulnerabilitiesData.low.year,
        data.vulnerabilitiesData.informational.year,
        data.vulnerabilitiesData.other.year
      ];
      this.chartData.all = [
        data.vulnerabilitiesData.high.all,
        data.vulnerabilitiesData.medium.all,
        data.vulnerabilitiesData.low.all,
        data.vulnerabilitiesData.informational.all,
        data.vulnerabilitiesData.other.all
      ];

      this.updateCharts();
    });
  }

  onPeriodChange(period: FilterPeriod): void {
    this.selectedPeriod = period;
    this.updateCharts();
  }
}
