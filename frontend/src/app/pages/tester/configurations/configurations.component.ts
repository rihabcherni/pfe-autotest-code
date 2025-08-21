import { Component, OnInit } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ConfigurationsService } from '../../../services/configurations/configurations.service';
import { FormsModule } from '@angular/forms';  
import { CommonModule } from '@angular/common';
import { TitleComponent } from "../../../components/shared/title/title.component";
import { AuthService } from '../../../services/auth/auth.service';
@Component({
  selector: 'app-configurations',
  standalone: true,
  imports: [FormsModule, CommonModule, TitleComponent],
  templateUrl: './configurations.component.html',
  styleUrls: ['./configurations.component.css']
})

export class ConfigurationsComponent implements OnInit {
  titleValue = 'Configurations';
  userId!: number;
  token: string = '';
  channel_id: string = '';
  emails: string[] = [''];
  JIRA_EMAIL: string = '';
  JIRA_DOMAIN: string = '';
  JIRA_PROJECT_KEY: string = '';
  JIRA_BOARD: string = '';
  jira_token: string = '';

  slackError: string = '';
  emailError: string = '';
  jiraError: string = '';
  successMessage: string = '';
  selectedConfig: string | null = null;
  isEditing: boolean = false;

  report_types: string[] = [];
  report_formats: string[] = [];

  constructor(
    private configurationsService: ConfigurationsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId()!;
    if (this.userId) {
      this.loadUserConfig(this.userId);
    }
  }

  loadUserConfig(userId: number): void {
    this.configurationsService.getUserConfiguration(userId)
      .pipe(catchError(err => this.handleError(err, 'Erreur lors du chargement des configurations')))
      .subscribe(config => {
        if (config) {
          this.emails = config.liste_emails?.length ? config.liste_emails : [''];
          this.token = config.slack_token || '';
          this.channel_id = config.slack_channel_id || '';
          this.JIRA_EMAIL = config.jira_email || '';
          this.JIRA_DOMAIN = config.jira_domain || '';
          this.JIRA_PROJECT_KEY = config.jira_cle_projet || '';
          this.JIRA_BOARD = config.jira_board || '';
          this.jira_token = config.jira_token || '';
          this.report_types = config.report_types || [];
          this.report_formats = config.report_formats || [];
        }
      });
  }

  toggleAccordion(configType: string): void {
    this.selectedConfig = this.selectedConfig === configType ? null : configType;
  }

  validateEmail(email: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  validateForm(): boolean {
    let isValid = true;
    if ((this.token.trim() !== '' || this.channel_id.trim() !== '') &&
        (!this.token.trim() || !this.channel_id.trim())) {
      this.slackError = 'Veuillez remplir tous les champs Slack.';
      isValid = false;
    } else {
      this.slackError = '';
    }
    if (this.emails.some(email => email.trim() !== '') &&
        !this.emails.every(email => email.trim() !== '' && this.validateEmail(email))) {
      this.emailError = 'Veuillez entrer des adresses email valides.';
      isValid = false;
    } else {
      this.emailError = '';
    }
    const jiraFields = [this.JIRA_EMAIL, this.jira_token, this.JIRA_DOMAIN, this.JIRA_PROJECT_KEY, this.JIRA_BOARD];
    if (jiraFields.some(f => f.trim() !== '') && jiraFields.some(f => f.trim() === '')) {
      this.jiraError = 'Veuillez remplir tous les champs Jira.';
      isValid = false;
    } else {
      this.jiraError = '';
    }

    return isValid;
  }

  onSubmit(): void {
    this.successMessage = '';

    if (!this.validateForm()) {
      return;
    }

    const configData = {
      liste_emails: this.emails,
      slack_token: this.token,
      slack_channel_id: this.channel_id,
      jira_email: this.JIRA_EMAIL,
      jira_token: this.jira_token,
      jira_domain: this.JIRA_DOMAIN,
      jira_cle_projet: this.JIRA_PROJECT_KEY,
      jira_board: this.JIRA_BOARD,
      report_types: this.report_types,
      report_formats: this.report_formats,
    };

    this.configurationsService.saveConfiguration(this.userId, configData)
      .pipe(catchError(error => this.handleError(error, 'Erreur lors de la sauvegarde des configurations')))
      .subscribe(() => {
        this.successMessage = 'Configuration envoyée avec succès.';
        this.isEditing = false;
      });
  }

  private handleError(error: any, errorMessage: string): Observable<any> {
    console.error(errorMessage, error);
    return of(null);
  }

  addEmailField(): void {
    this.emails.push('');
  }

  removeEmailField(index: number): void {
    if (this.emails.length > 1) {
      this.emails.splice(index, 1);
    }
  }

  isFormValid(): boolean {
    return this.isEditing && this.validateForm();
  }

  onCheckboxChange(event: any, value: string, listType: 'report_types' | 'report_formats'): void {
    const targetList = listType === 'report_types' ? this.report_types : this.report_formats;
    if (event) {
      if (!targetList.includes(value)) {
        targetList.push(value);
      }
    } else {
      const index = targetList.indexOf(value);
      if (index > -1) {
        targetList.splice(index, 1);
      }
    }
  }
}
