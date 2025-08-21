import { Workflow } from "./functional-report";

export interface SecurityPreferences {
  depth_crawl: number;
  zap_dc: number;
  zap_d: number;
  wapiti_scan_time: number;
  wapiti_level: number;
  sqlmap_level: number;
  sqlmap_risk: number;
  sqlmap_threads: number;
  sqlmap_technique: string;
  nikto_timeout: number;
  nuclei_rate_limit: number;
  nmap_timing: number;
  whatweb_aggression: number;
  pwnxss_threads: number;
  outils_securite_favoris: string[];
}

export interface SEOPreferences {
  page_speed_threshold: number;
  accessibility_level: 'AA' | 'AAA';
  mobile_friendly: boolean;
  check_meta_tags: boolean;
  check_headings: boolean;
  check_images_alt: boolean;
  check_internal_links: boolean;
  check_external_links: boolean;
  max_page_size: number;
  lighthouse_categories: string[];
}

export interface FunctionalPreferences {
  browser_type: 'chrome' | 'firefox' | 'safari';
  viewport_width: number;
  viewport_height: number;
  timeout: number;
  retry_attempts: number;
  screenshot: boolean;
  video_recording: boolean;
  performance_metrics: boolean;
  network_throttling: boolean;
  device_emulation: boolean;
}
export interface ScanConfiguration {
  id?: number;
  name: string;
  scan_type: 'security' | 'seo' | 'functional';
  url: string;
  depth: number;
  authentication_required: boolean;
  schedule_enabled: boolean;
  schedule_cron?: string;
  preferences: SecurityPreferences | SEOPreferences | FunctionalPreferences;
  created_at?: Date;
  updated_at?: Date;
}
export interface SecurityReportDetails {
  id: number;
  report_id: number;
  vulnerability_count: number;
  critical_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  tools_used: string[];
  scan_duration: number;
  vulnerabilities: Vulnerability[];
}

export interface Vulnerability {
  id: number;
  name: string;
  severity: 'informational' | 'High' | 'Medium' | 'Low';
  description: string;
  solution: string;
  url: string;
  tool_found: string;
  cve?: string;
}

export interface SEOReportDetails {
  id: number;
  report_id: number;
  score: number;
  page_speed: number;
  accessibility_score: number;
  issues_found: string;
  recommendations: SEORecommendation[];
  lighthouse_data: any;
}

export interface SEORecommendation {
  category: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
  solution: string;
  impact: string;
}

export interface FunctionalReportDetails {
  id: number;
  report_id: number;
  message_result?: string;
  project_name: string;
  workflows?: Workflow[];
  test_cases_passed: number;
  test_cases_failed: number;
  total_test_cases: number;
  execution_time: number;
}

export interface AuthenticationDetails {
  id: number;
  login_page_url: string;
  cookies: string;
  username: string;
  password: string;
  token: string;
}

export interface Reports {
  id: number;
  user_id: number;
  scan_type: string;
  authentification: boolean;
  schedule_scan: boolean;
  scan_started_at: string;
  scan_finished_at: string;
  url: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progression: number;
  authentication_details?: AuthenticationDetails;
  security_details?: SecurityReportDetails;
  seo_details?: SEOReportDetails;
  functional_details?: FunctionalReportDetails;
}
export const DEFAULT_SECURITY_OPTIONS: SecurityPreferences = {
  depth_crawl: 3,
  zap_dc: 5,
  zap_d: 5,
  wapiti_scan_time: 5,
  wapiti_level: 2,
  sqlmap_level: 3,
  sqlmap_risk: 3,
  sqlmap_threads: 5,
  sqlmap_technique: 'BEUSTQ',
  nikto_timeout: 300,
  nuclei_rate_limit: 100,
  nmap_timing: 4,
  whatweb_aggression: 3,
  pwnxss_threads: 10,
  outils_securite_favoris: []
};

export const DEFAULT_SEO_OPTIONS: SEOPreferences = {
  page_speed_threshold: 90,
  accessibility_level: 'AA',
  mobile_friendly: true,
  check_meta_tags: true,
  check_headings: true,
  check_images_alt: true,
  check_internal_links: true,
  check_external_links: false,
  max_page_size: 3,
  lighthouse_categories: ['performance', 'accessibility', 'best-practices', 'seo']
};

export const DEFAULT_FUNCTIONAL_OPTIONS: FunctionalPreferences = {
  browser_type: 'chrome',
  viewport_width: 1920,
  viewport_height: 1080,
  timeout: 30000,
  retry_attempts: 3,
  screenshot: true,
  video_recording: false,
  performance_metrics: true,
  network_throttling: false,
  device_emulation: false
};

export const SECURITY_VALIDATION = {
  depth_crawl: { min: 1, max: 10 },
  zap_dc: { min: 1, max: 10 },
  zap_d: { min: 1, max: 10 },
  wapiti_scan_time: { min: 1, max: 60 },
  wapiti_level: { min: 1, max: 2 },
  sqlmap_level: { min: 1, max: 5 },
  sqlmap_risk: { min: 1, max: 3 },
  sqlmap_threads: { min: 1, max: 20 },
  sqlmap_technique: { pattern: /^[BEUSTQ]+$/ },
  nikto_timeout: { min: 60, max: 3600 },
  nuclei_rate_limit: { min: 10, max: 1000 },
  nmap_timing: { min: 0, max: 5 },
  whatweb_aggression: { min: 1, max: 4 },
  pwnxss_threads: { min: 1, max: 50 }
};
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ScanResult {
  scan_id: number;
  status: string;
  progress: number;
  estimated_time?: number;
}
export enum ScanType {
  SECURITY = 'security',
  SEO = 'seo',
  FUNCTIONAL = 'functional'
}

export enum ScanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}