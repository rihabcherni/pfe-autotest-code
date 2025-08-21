import { TestBed } from '@angular/core/testing';

import { SeoReportService } from './seo-report.service';

describe('SeoReportService', () => {
  let service: SeoReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
