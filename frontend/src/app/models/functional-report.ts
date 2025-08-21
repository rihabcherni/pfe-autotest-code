export interface StepTest {
  id?: number;
  ordre_execution: number;
  title: string;
  description: string;
  settings?: any;         
  statut: 'pending' | 'passed' | 'failed';
  error_message?: string;
  screenshot_path?: string;
  date_debut?: string | Date;
  date_fin?: string | Date;
  test_case_id: number;
}

export interface TestCase {
  id?: number;
  title: string;
  ordre_execution: number;
  statut: 'pending' | 'passed' | 'failed' ;
  error_message?: string;
  date_debut?: string | Date;
  date_fin?: string | Date;
  date_creation?: Date;
  date_update?: Date;
  workflow_id: number;
  step_tests?: StepTest[];
}

export interface Workflow {
  id?: number;
  title: string;
  description?: string;
  statut: 'pending' | 'passed' | 'failed' ;
  date_creation?: Date;
  date_update?: Date;
  date_debut?: string | Date;
  date_fin?: string | Date;
  functional_report_id?: number;
  test_cases?: TestCase[];
  data_drawflow?: DrawflowExport;
}

export interface FunctionalReportDetails {
  id: number;
  report_id: number;
  message_result?: string;
  project_name: string;
  workflows?: any[]; 
}

export interface DrawflowNode {
  id: number;
  name: string;
  data: any;
  inputs: any;
  outputs: any;
  pos_x: number;
  pos_y: number;
  class?: string;
}

export interface DrawflowExport {
  drawflow: {
    Home: {
      data: {
        [nodeId: string]: DrawflowNode;
      };
    };
  };
}