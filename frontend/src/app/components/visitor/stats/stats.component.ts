import { Component } from '@angular/core';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent {
  nbTargetsScanned = 75;
  nbVulnerabilitiesDetected = 124;
  nbSecurityTestsExecuted = 380;
  nbFunctionalTestsExecuted = 210;
}
