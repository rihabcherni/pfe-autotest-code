import { TestBed } from '@angular/core/testing';

import { CompletScanService } from './complet-scan.service';

describe('CompletScanService', () => {
  let service: CompletScanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompletScanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
