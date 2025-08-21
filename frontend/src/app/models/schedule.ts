
export enum StatutReportEnum {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
  QUEUED = 'queued'
}
export enum ScanTypeEnum {
  SECURITY = 'security',
  SEO = 'seo',
  FUNCTIONAL = 'functional',
}
export interface Report {
  id: number;
  user_id: number;
  scan_type: ScanTypeEnum;
  authentification: boolean;
  schedule_scan: boolean;
  scan_started_at?: Date;
  scan_finished_at?: Date;
  url: string;
  status: StatutReportEnum;
  progression: number;
  schedule_date?: string;
  schedule_time?: string;
}
export interface ScanTypeConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}