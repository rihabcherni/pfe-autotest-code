import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FunctionalReportDialogComponent } from './functional-report-dialog.component';

describe('FunctionalReportDialogComponent', () => {
  let component: FunctionalReportDialogComponent;
  let fixture: ComponentFixture<FunctionalReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FunctionalReportDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FunctionalReportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
