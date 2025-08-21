import { Component, Input } from '@angular/core';
import { TesterOverviewStats } from '../../../../services/dashboard/testeur-statistics.service';

@Component({
  selector: 'app-cards-statistics-tester',
  standalone: true,
  imports: [],
  templateUrl: './cards-statistics-tester.component.html',
  styleUrl: './cards-statistics-tester.component.css'
})
export class CardsStatisticsTesterComponent {
  @Input() overviewStats!: TesterOverviewStats;
  @Input() completionRate!: number;
  @Input() averageScore!: number;
  @Input() functionalSuccessRate!: number;
  @Input() totalVulnerabilities!: number;
}
