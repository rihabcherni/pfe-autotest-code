import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowFormDialogComponent } from './workflow-form-dialog.component';

describe('WorkflowFormDialogComponent', () => {
  let component: WorkflowFormDialogComponent;
  let fixture: ComponentFixture<WorkflowFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
