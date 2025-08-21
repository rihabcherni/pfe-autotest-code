import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoScanComponent } from './seo-scan.component';

describe('SeoScanComponent', () => {
  let component: SeoScanComponent;
  let fixture: ComponentFixture<SeoScanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoScanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoScanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
