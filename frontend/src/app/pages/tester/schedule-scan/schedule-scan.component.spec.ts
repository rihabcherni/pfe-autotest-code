import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleScanComponent } from './schedule-scan.component';

describe('ScheduleScanComponent', () => {
  let component: ScheduleScanComponent;
  let fixture: ComponentFixture<ScheduleScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleScanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
