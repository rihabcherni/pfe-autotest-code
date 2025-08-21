import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoScanResultsComponent } from './seo-scan-results.component';

describe('SeoScanResultsComponent', () => {
  let component: SeoScanResultsComponent;
  let fixture: ComponentFixture<SeoScanResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoScanResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoScanResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
