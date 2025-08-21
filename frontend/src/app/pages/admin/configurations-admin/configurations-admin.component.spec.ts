import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationsAdminComponent } from './configurations-admin.component';

describe('ConfigurationsAdminComponent', () => {
  let component: ConfigurationsAdminComponent;
  let fixture: ComponentFixture<ConfigurationsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
