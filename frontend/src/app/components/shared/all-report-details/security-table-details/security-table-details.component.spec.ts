import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityTableDetailsComponent } from './security-table-details.component';

describe('SecurityTableDetailsComponent', () => {
  let component: SecurityTableDetailsComponent;
  let fixture: ComponentFixture<SecurityTableDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityTableDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityTableDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
