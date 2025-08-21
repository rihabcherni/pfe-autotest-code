import { FunctionalReportDetails } from "./functional-report";
import { SecurityReportDetails } from "./pentest-scan";

export interface SEOReportDetails {
  id?: number;
  url: string;
  average_score: number;
  server_info: ServerInfo;
  total_pages_analyzed: number;
  crawled_links: string[];
  screenshot: string;
  keywords: Keywords;
  phrases: Phrases;
  pages_404: string[];
  pages: SeoPage[];
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
  status: string;
  progression: number;
  authentication_details?: AuthenticationDetails;
  security_details?: SecurityReportDetails;
  seo_details?: SEOReportDetails;
  functional_details?: FunctionalReportDetails;
}
export interface ServerInfo {
  ip: string;
  os: string;
  server: string;
  backend: string[];
  frontend: string[];
  cms: string;
  hostname: string;
  x_powered_by: string;
  set_cookie: string;
  raw_headers: RawHeaders;
  port?: number;
  protocol?: string;
  response_time?: number;
  uptime?: number;
  security_headers?: SecurityHeaders;
}

export interface RawHeaders {
  [key: string]: string;
}

export interface SecurityHeaders {
  'strict-transport-security'?: string;
  'content-security-policy'?: string;
  'x-frame-options'?: string;
  'x-content-type-options'?: string;
  'x-xss-protection'?: string;
  'referrer-policy'?: string;
}

export interface Keywords {
  [keyword: string]: KeywordInfo;
}

export interface KeywordInfo {
  count: number;
  density: number;
  positions: number[];
  relevance_score?: number;
}

export interface Phrases {
  [phrase: string]: PhraseInfo;
}

export interface PhraseInfo {
  count: number;
  pages: string[];
  context?: string[];
}

export interface SeoPage {
  url: string;
  title: string;
  meta_description: string;
  h1_tags: string[];
  h2_tags: string[];
  h3_tags: string[];
  images: ImageInfo[];
  links: LinkInfo[];
  word_count: number;
  load_time: number;
  status_code: number;
  canonical_url?: string;
  meta_keywords?: string;
  og_tags?: OpenGraphTags;
  twitter_cards?: TwitterCardTags;
  schema_markup?: SchemaMarkup[];
  internal_links_count?: number;
  external_links_count?: number;
  broken_links?: string[];
}

export interface ImageInfo {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  file_size?: number;
  format?: string;
  loading_type?: 'lazy' | 'eager';
  has_alt: boolean;
  has_title: boolean;
}

export interface LinkInfo {
  href: string;
  text: string;
  title?: string;
  rel?: string;
  target?: string;
  type: 'internal' | 'external';
  status_code?: number;
  is_nofollow?: boolean;
  anchor_text?: string;
}

export interface OpenGraphTags {
  'og:title'?: string;
  'og:description'?: string;
  'og:image'?: string;
  'og:url'?: string;
  'og:type'?: string;
  'og:site_name'?: string;
}

export interface TwitterCardTags {
  'twitter:card'?: string;
  'twitter:title'?: string;
  'twitter:description'?: string;
  'twitter:image'?: string;
  'twitter:site'?: string;
  'twitter:creator'?: string;
}

export interface SchemaMarkup {
  type: string;
  data: any;
  valid: boolean;
  errors?: string[];
}

export interface MetaAnalysis {
  total_pages: number;
  pages_with_meta_description: number;
  pages_with_title: number;
  pages_with_h1: number;
  duplicate_titles: string[];
  duplicate_meta_descriptions: string[];
  missing_meta_descriptions: string[];
  missing_titles: string[];
}