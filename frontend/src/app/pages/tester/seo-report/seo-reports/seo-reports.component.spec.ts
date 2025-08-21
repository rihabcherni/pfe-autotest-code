import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoReportsComponent } from './seo-reports.component';

describe('SeoReportsComponent', () => {
  let component: SeoReportsComponent;
  let fixture: ComponentFixture<SeoReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
