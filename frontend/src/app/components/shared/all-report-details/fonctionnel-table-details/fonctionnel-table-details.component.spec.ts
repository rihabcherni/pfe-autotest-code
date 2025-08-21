import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FonctionnelTableDetailsComponent } from './fonctionnel-table-details.component';

describe('FonctionnelTableDetailsComponent', () => {
  let component: FonctionnelTableDetailsComponent;
  let fixture: ComponentFixture<FonctionnelTableDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FonctionnelTableDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FonctionnelTableDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
