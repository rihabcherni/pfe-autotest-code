import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoTableDetailsComponent } from './seo-table-details.component';

describe('SeoTableDetailsComponent', () => {
  let component: SeoTableDetailsComponent;
  let fixture: ComponentFixture<SeoTableDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoTableDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoTableDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
