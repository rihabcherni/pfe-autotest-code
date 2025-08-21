import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardsStatisticsTesterComponent } from './cards-statistics-tester.component';

describe('CardsStatisticsTesterComponent', () => {
  let component: CardsStatisticsTesterComponent;
  let fixture: ComponentFixture<CardsStatisticsTesterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardsStatisticsTesterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardsStatisticsTesterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
