import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FonctionnelTestScanComponent } from './fonctionnel-test-scan.component';
import { MatButtonModule } from '@angular/material/button';

describe('FonctionnelTestScanComponent', () => {
  let component: FonctionnelTestScanComponent;
  let fixture: ComponentFixture<FonctionnelTestScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FonctionnelTestScanComponent, MatButtonModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FonctionnelTestScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
