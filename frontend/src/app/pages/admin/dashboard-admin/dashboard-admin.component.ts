import { Component } from '@angular/core';
import { TitleComponent } from "../../../components/shared/title/title.component";
import { CommonModule } from '@angular/common';
import { VulnerabilitiesByPeriodComponent } from './vulnerabilities-by-period/vulnerabilities-by-period.component';
import { ReportsByPeriodComponent } from './reports-by-period/reports-by-period.component';
import { StatisticsCardsComponent } from './statistics-cards/statistics-cards.component';
type FilterPeriod = 'day' | 'week' | 'month' | 'year' | 'all';
type SelectedType = 'seo' | 'security' | 'functional' | 'all';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [TitleComponent,CommonModule, VulnerabilitiesByPeriodComponent, ReportsByPeriodComponent, StatisticsCardsComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.css'
})

export class DashboardAdminComponent {
  titleValue = "Dashboard";
  selectedPeriod: FilterPeriod = 'day';
  selectedType: SelectedType = 'all';        
  riskLevels: any;
  totalRisks: any;
  onPeriodChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as FilterPeriod;
    this.selectedPeriod = value;
  }
  onTypeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (['seo', 'security', 'functional', 'all'].includes(value)) {
      this.selectedType = value as SelectedType;
    }
  }
}