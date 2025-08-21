import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VulnerabilitiesByPeriodComponent } from './vulnerabilities-by-period.component';

describe('VulnerabilitiesByPeriodComponent', () => {
  let component: VulnerabilitiesByPeriodComponent;
  let fixture: ComponentFixture<VulnerabilitiesByPeriodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VulnerabilitiesByPeriodComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VulnerabilitiesByPeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
