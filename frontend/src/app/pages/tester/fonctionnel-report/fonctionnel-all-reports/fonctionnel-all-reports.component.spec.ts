import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FonctionnelAllReportsComponent } from './fonctionnel-all-reports.component';

describe('FonctionnelAllReportsComponent', () => {
  let component: FonctionnelAllReportsComponent;
  let fixture: ComponentFixture<FonctionnelAllReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FonctionnelAllReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FonctionnelAllReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
