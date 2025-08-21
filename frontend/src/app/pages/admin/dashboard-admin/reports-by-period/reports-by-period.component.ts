import { AfterViewInit, Component, ElementRef, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { AdminStatisticsService, ReportsResponse } from '../../../../services/dashboard/admin-statistics.service';
import { Chart } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
type SelectedType = 'seo' | 'security' | 'functional' | 'all';

@Component({
  selector: 'app-reports-by-period',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-by-period.component.html',
  styleUrl: './reports-by-period.component.css'
})
export class ReportsByPeriodComponent implements AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;
  @Input() selectedPeriod: FilterPeriod = 'day';
  @Input() selectedType: SelectedType = 'all';
  reportType = 'all';
  period = 'day';
  reportsData: any = {};
  labels: any = {};
  constructor(private statisticsService: AdminStatisticsService) {}
  ngAfterViewInit(): void {
    this.initChart();
    this.fetchData();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedPeriod'] || changes['selectedType']) {
      this.period = this.selectedPeriod;
      this.reportType = this.selectedType;
      if (this.chart) {
        this.fetchData();
      }
    }
  }
  getLineTitleText(): string {
    if (!this.reportsData[this.reportType] || !this.reportsData[this.reportType][this.period]) {
      return 'Reports Over Time — Total: 0';
    }
    const data = this.reportsData[this.reportType][this.period];
    const total = data.reduce((a: number, b: number) => a + b, 0);
    return `Reports Over Time — Total: ${total}`;
  }

  initChart(): void {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Reports',
            data: [],
            fill: true,
            borderColor: '#2c3e50',
            backgroundColor: 'rgba(44, 62, 80, 0.3)',
            tension: 0.3,
            pointRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          title: {
            display: true,
            text: this.getLineTitleText(),
          },
        },
      },
    });
  }

  fetchData(): void {
    this.statisticsService.fetchReports().subscribe((res: ReportsResponse) => {
      this.labels = res.labels;
      this.reportsData = res.reportsData;

      const labels = this.labels[this.period];
      const data = this.reportsData[this.reportType][this.period];

      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.data.datasets[0].label = `Reports (${this.reportType.toUpperCase()})`;

      this.chart.options.plugins!.title!.text = this.getLineTitleText();
      this.chart.update();
    });
  }

  onChangePeriod(p: string): void {
    this.period = p;
    this.fetchData();
  }

  onChangeType(type: string): void {
    this.reportType = type;
    this.fetchData();
  }
}
