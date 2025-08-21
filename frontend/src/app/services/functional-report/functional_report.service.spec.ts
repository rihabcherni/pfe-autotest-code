import { TestBed } from '@angular/core/testing';

import { FunctionalReportService } from './functional_report.service';

describe('FunctionalReportService', () => {
  let service: FunctionalReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FunctionalReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
