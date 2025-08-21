import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoReportDetailComponent } from './seo-report-detail.component';

describe('SeoReportDetailComponent', () => {
  let component: SeoReportDetailComponent;
  let fixture: ComponentFixture<SeoReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoReportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
