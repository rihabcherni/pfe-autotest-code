import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleteScanComponent } from './complete-scan.component';

describe('CompleteScanComponent', () => {
  let component: CompleteScanComponent;
  let fixture: ComponentFixture<CompleteScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteScanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompleteScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
