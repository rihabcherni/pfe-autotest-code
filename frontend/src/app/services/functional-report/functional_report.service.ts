import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { Reports } from '../../models/report';
import { FunctionalReportDetails, StepTest, TestCase, Workflow } from '../../models/functional-report';

export interface FunctionalReport {
  id?: number;
  report_id: number;
  message_result?: string;
  project_name: string;
  workflows?: Workflow[];
}

@Injectable({
  providedIn: 'root'
})
export class FunctionalReportService {
  private apiUrl =`${environment.apiUrl}`;   
  private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('access_token'); 
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
  } 
  constructor(private http: HttpClient) {}
  createWorkflow(workflow: Workflow): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.apiUrl}/workflows/`, workflow);
  }
  getWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.apiUrl}/workflows/`);
  }
  getWorkflow(id: number): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/workflows/${id}`);
  }
  updateWorkflow(id: number, workflow: Workflow): Observable<Workflow> {
  const cleanWorkflow = {
    ...workflow,
    title: workflow.title?.trim() || '',
    description: workflow.description?.trim() || '',
    data_drawflow: workflow.data_drawflow ? this.cleanDrawflowForAPI(workflow.data_drawflow) : null
  };

  return this.http.put<Workflow>(`${this.apiUrl}/workflows/${id}`, cleanWorkflow, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(this.handleError<Workflow>('updateWorkflow'))
  );
}

private cleanDrawflowForAPI(drawflowData: any): any {
  try {
    return JSON.parse(JSON.stringify(drawflowData, (key, value) => {
      if (key === 'parent' || key === 'parentNode' || key === 'ownerDocument') {
        return undefined;
      }
      return value;
    }));
  } catch (error) {
    console.error('Error cleaning drawflow data:', error);
    return null;
  }
}

// Generic error handler
private handleError<T>(operation = 'operation', result?: T) {
  return (error: any): Observable<T> => {
    console.error(`${operation} failed:`, error);
    const userError = {
      ...error,
      userMessage: this.getUserFriendlyErrorMessage(error)
    };
    return throwError(userError);
  };
}
  private getUserFriendlyErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to server. Please check your internet connection.';
    } else if (error.status === 401) {
      return 'You are not authorized to perform this action.';
    } else if (error.status === 403) {
      return 'You do not have permission to update this workflow.';
    } else if (error.status === 404) {
      return 'The workflow was not found.';
    } else if (error.status === 422) {
      return 'Invalid data provided. Please check your input.';
    } else if (error.status >= 500) {
      return 'A server error occurred. Please try again later.';
    } else if (error.error?.detail) {
      return error.error.detail;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
  deleteWorkflow(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/workflows/${id}`);
  }
  getWorkflowStatus(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/workflows/${id}/status`);
  }
  getWorkflowExecutionStatus(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/workflows/${id}/execution-status`);
  }
  updateTestCaseStatus(id: number, status: string): Observable<TestCase> {
    return this.http.patch<TestCase>(`${this.apiUrl}/testcases/${id}/status`, { status });
  }
  updateStepTestStatus(id: number, status: string): Observable<StepTest> {
    return this.http.patch<StepTest>(`${this.apiUrl}/step_tests/${id}/status`, { status });
  }
  executeWorkflow(workflowId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/workflow/${workflowId}/execute`,
      {}, 
      { headers: this.getAuthHeaders() } 
    );
  }
  getTestCasesByWorkflow(workflowId: number): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(`${this.apiUrl}/workflows/${workflowId}/testcases`);
  }
  createTestCase(testCase: TestCase): Observable<TestCase> {
    const { id, ...testCaseData } = testCase;
    return this.http.post<TestCase>(`${this.apiUrl}/testcases/`, testCaseData);
  }
  getTestCases(): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(`${this.apiUrl}/testcases/`);
  }
  getTestCase(id: number): Observable<TestCase> {
    return this.http.get<TestCase>(`${this.apiUrl}/testcases/${id}`);
  }
  updateTestCase(id: number, testCase: TestCase): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.apiUrl}/testcases/${id}`, testCase);
  }
  deleteTestCase(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/testcases/${id}`);
  }
  createStepTest(stepTest: StepTest): Observable<StepTest> {
    const { id, ...stepTestData } = stepTest;
    return this.http.post<StepTest>(`${this.apiUrl}/step_tests/`, stepTestData);
  }
  getStepTests(): Observable<StepTest[]> {
    return this.http.get<StepTest[]>(`${this.apiUrl}/step_tests/`);
  }
  getStepTestsByTestCase(testCaseId: number): Observable<StepTest[]> {
    return this.http.get<StepTest[]>(`${this.apiUrl}/testcases/${testCaseId}/step_tests`);
  }
  updateStepTest(id: number, stepTest: StepTest): Observable<StepTest> {
    return this.http.put<StepTest>(`${this.apiUrl}/step_tests/${id}`, stepTest);
  }
  deleteStepTest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/step_tests/${id}`);
  }
  getStepTest(id: number): Observable<StepTest> {
    return this.http.get<StepTest>(`${this.apiUrl}/${id}`);
  }
  createFunctionalReport(report: FunctionalReport): Observable<FunctionalReport> {
    return this.http.post<FunctionalReport>(`${this.apiUrl}/functional-reports/details/`, report);
  }
  createReport(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/`, payload);
  }
  getFunctionalReports(userId?: number): Observable<Reports[]> {
    let params = new HttpParams();
    if (userId !== undefined) {
      params = params.set('user_id', userId.toString());
    }
    return this.http.get<Reports[]>(`${this.apiUrl}/functional-reports/`, { params });
  }
  listFunctionalReportDetails(): Observable<FunctionalReportDetails[]> {
    return this.http.get<FunctionalReportDetails[]>(`${this.apiUrl}/functional-reports/details`);
  }
  getFunctionalReportDetailsById(id: number): Observable<FunctionalReportDetails> {
    return this.http.get<FunctionalReportDetails>(`${this.apiUrl}/functional-reports/details/${id}`);
  }
  updateFunctionalReportDetails(id: number, data: { message_result?: string }): Observable<FunctionalReportDetails> {
    return this.http.put<FunctionalReportDetails>(`${this.apiUrl}/functional-reports/details/${id}`, data);
  }

  deleteFunctionalReportDetails(id: number): Observable<{ detail: string }> {
    return this.http.delete<{ detail: string }>(`${this.apiUrl}/functional-reports/details/${id}`);
  }
}