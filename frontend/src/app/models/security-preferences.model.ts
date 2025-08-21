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

export interface SecurityPreferencesResponse {
  success: boolean;
  message: string;
  data: SecurityPreferences;
}

export interface AdvancedOptionValidation {
  field: string;
  isValid: boolean;
  errorMessage?: string;
}
export const DEFAULT_ADVANCED_OPTIONS: SecurityPreferences = {
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

export const ADVANCED_OPTIONS_VALIDATION = {
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