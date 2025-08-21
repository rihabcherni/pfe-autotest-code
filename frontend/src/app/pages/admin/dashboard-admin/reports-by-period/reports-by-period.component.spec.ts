import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsByPeriodComponent } from './reports-by-period.component';

describe('ReportsByPeriodComponent', () => {
  let component: ReportsByPeriodComponent;
  let fixture: ComponentFixture<ReportsByPeriodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsByPeriodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsByPeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
