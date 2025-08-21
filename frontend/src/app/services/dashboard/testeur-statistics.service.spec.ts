import { TestBed } from '@angular/core/testing';

import { TesteurStatisticsService } from './testeur-statistics.service';

describe('TesteurStatisticsService', () => {
  let service: TesteurStatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TesteurStatisticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
