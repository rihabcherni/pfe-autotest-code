import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoReportDialogComponent } from './seo-report-dialog.component';

describe('SeoReportDialogComponent', () => {
  let component: SeoReportDialogComponent;
  let fixture: ComponentFixture<SeoReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoReportDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
