export interface SEOReportRequest {
  url: string;
}
export interface ServerInfo {
  ip: string;
  os: string;
  server: string;
  backend:  string[];
  frontend:  string[];
  cms: string;
  server_software: string;
}

export interface PageDetails {
  url: string;
  seo_score: number;
  grade: string;
  load_time_ms: number;
  html_size_kb: number;
  title: string;
  meta_description: string;
  canonical: string;
  robots: string;
  favicon: string;
  internal_links: number;
  external_links: number;
  header_tags: Record<string, any>;
  images_missing_alt: string[];
  good_practices: string[];
  bad_practices: string[];
}

export interface SEOReportResponse {
  id: number;
  url: string;
  average_score: number;
  server_info: ServerInfo;
  total_pages_analyzed: number;
  crawled_links: string[];
  screenshot?: string;
  keywords?: Record<string, number>;
  phrases?: Record<string, number>;
  pages_404?: string[];
  pages: PageDetails[];
}