import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Workflow } from '../../../../models/functional-report';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { WorkflowFormDialogComponent } from '../../../../pages/tester/fonctionnel-report/fonctionnel-all-reports/workflow-form-dialog/workflow-form-dialog.component';
import { FunctionalReportService } from '../../../../services/functional-report/functional_report.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-fonctionnel-table-details',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatButtonModule,  MatExpansionModule, CommonModule, MatIconModule],
  templateUrl: './fonctionnel-table-details.component.html',
  styleUrl: './fonctionnel-table-details.component.css'
})
export class FonctionnelTableDetailsComponent implements OnInit, OnChanges {
  @Input() report: any;
  @Input() idReportDetails?: number;
  totalTests: number = 0;
  passedTests: number = 0;
  failedTests: number = 0;
  pendingTests: number = 0;

  ngOnInit() {
    this.calculateTestStats();
  }
  constructor(private router: Router,
    private snackBar: MatSnackBar,
    private functionalReportService: FunctionalReportService,
    private dialog: MatDialog,
  ) {}

  ngOnChanges() {
    this.calculateTestStats();
  }
  addWorkflow(): void {
    if (!this.idReportDetails) {
      this.showMessage('ID du rapport non disponible', 'error');
      return;
    }
    const dialogRef = this.dialog.open(WorkflowFormDialogComponent, {
      width: '400px'
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const newWorkflow: Workflow = {
          title: result.title || '',
          description: result.description || '',
          statut: 'pending',
          functional_report_id: this.idReportDetails!
        };

        this.functionalReportService.createWorkflow(newWorkflow).subscribe({
          next: (createdWorkflow) => {
            this.snackBar.open('Workflow créé avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate([
              '/tester/functional-scan',
              this.idReportDetails,
              'workflow',
              createdWorkflow.id
            ]);
          },
          error: () => {
            this.snackBar.open("Erreur lors de la création du workflow", "Fermer", { duration: 3000 });
          }
        });
      }
    });
  }
  viewWorkflows(workflow: Workflow): void {
  if (workflow.id && this.idReportDetails) {
    this.router.navigate([
      '/tester/functional-scan',
      this.idReportDetails,
      'workflow',
      workflow.id
    ]);
  } else {
    this.showMessage('workflow ID or report ID not available', 'error');
  }
}

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    const config = {
      duration: type === 'error' ? 5000 : 3000,
      panelClass: [`snackbar-${type}`],
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
    };

    this.snackBar.open(message, 'Close', config);
  }
  private calculateTestStats() {
    if (!this.report?.functional_details?.workflows) {
      return;
    }
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.pendingTests = 0;

    this.report.functional_details.workflows.forEach((workflow: any) => {
      if (workflow.test_cases && workflow.test_cases.length > 0) {
        workflow.test_cases.forEach((testCase: any) => {
          this.totalTests++;
          const testCaseStatus = this.getTestCaseEffectiveStatus(testCase);
          
          switch (testCaseStatus.toLowerCase()) {
            case 'passed':
              this.passedTests++;
              break;
            case 'failed':
              this.failedTests++;
              break;
            case 'pending':
              this.pendingTests++;
              break;
          }
        });
      } else {
        this.totalTests++;
        switch (workflow.statut?.toLowerCase()) {
          case 'passed':
            this.passedTests++;
            break;
          case 'failed':
            this.failedTests++;
            break;
          case 'pending':
            this.pendingTests++;
            break;
        }
      }
    });
  }

  private getTestCaseEffectiveStatus(testCase: any): string {
    if (!testCase.step_tests || testCase.step_tests.length === 0) {
      return testCase.statut || 'pending';
    }
    const stepStatuses = testCase.step_tests.map((step: any) => step.statut?.toLowerCase());    
    if (stepStatuses.some((status: string) => status === 'failed')) {
      return 'failed';
    }    
    if (stepStatuses.every((status: string) => status === 'passed')) {
      return 'passed';
    }
    return 'pending';
  }

  getWorkflowStats(workflow: any): { total: number, passed: number, failed: number, pending: number } {
    const stats = { total: 0, passed: 0, failed: 0, pending: 0 };
    
    if (workflow.test_cases && workflow.test_cases.length > 0) {
      workflow.test_cases.forEach((testCase: any) => {
        stats.total++;
        const status = this.getTestCaseEffectiveStatus(testCase).toLowerCase();
        
        switch (status) {
          case 'passed':
            stats.passed++;
            break;
          case 'failed':
            stats.failed++;
            break;
          case 'pending':
            stats.pending++;
            break;
        }
      });
    }
    
    return stats;
  }
  getWorkflowCompletionPercentage(workflow: any): number {
    const stats = this.getWorkflowStats(workflow);
    if (stats.total === 0) return 0;
    return Math.round(((stats.passed + stats.failed) / stats.total) * 100);
  }
  hasScreenshot(stepTest: any): boolean {
    return stepTest.screenshot_path && stepTest.screenshot_path.trim() !== '';
  }

  getExecutionDuration(dateDebut: string, dateFin: string | null): string {
    if (!dateFin) return 'En cours...';
    
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
    return `${Math.round(diffMs / 60000)}min`;
  }
}