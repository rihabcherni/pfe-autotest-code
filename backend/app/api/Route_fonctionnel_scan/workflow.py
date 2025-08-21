from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.Route_fonctionnel_scan.test_execution_service import TestExecutionService
from app.configuration.auth_bearer import get_current_user
from app.database.database import get_session
from app.models.functional import TestCase, Workflow
from app.models.user import User
from app.schemas.fonctionnel_scan.test_case import TestCaseRead
from app.schemas.fonctionnel_scan.workflow import WorkflowCreate, WorkflowRead
from sqlalchemy.exc import IntegrityError

router = APIRouter(tags=["Workflows"])

@router.post("/workflows/", response_model=WorkflowRead)
def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_session)):
    db_workflow = Workflow(**workflow.dict())
    db.add(db_workflow)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid input: possibly missing 'functional_report_id'")
    db.refresh(db_workflow)
    return db_workflow
 
@router.get("/workflows/", response_model=List[WorkflowRead])
def get_all_workflows(db: Session = Depends(get_session)):
    return db.query(Workflow).all()

@router.get("/workflows/{workflow_id}", response_model=WorkflowRead)
def get_workflow(workflow_id: int, db: Session = Depends(get_session)):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return db_workflow

@router.put("/workflows/{workflow_id}", response_model=WorkflowRead)
def update_workflow(workflow_id: int, workflow: WorkflowCreate, db: Session = Depends(get_session)):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db_workflow.title = workflow.title
    db_workflow.description = workflow.description
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.delete("/workflows/{workflow_id}")
def delete_workflow(workflow_id: int, db: Session = Depends(get_session)):
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(db_workflow)
    db.commit()
    return {"message": "Workflow deleted successfully"}


@router.get("/workflows/{workflow_id}/test-cases", response_model=List[TestCaseRead])
def get_test_cases_by_workflow(workflow_id: int, db: Session = Depends(get_session)):
    test_cases = db.query(TestCase).filter(TestCase.workflow_id == workflow_id).all()
    if not test_cases:
        raise HTTPException(status_code=404, detail="No test cases found for this workflow.")
    return test_cases

@router.get("/workflows/{workflow_id}/status")
def get_workflow_status(workflow_id: int, db: Session = Depends(get_session)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow non trouvé")

    total_steps = sum(len(tc.step_tests) for tc in workflow.test_cases)
    passed_steps = sum(
        len([s for s in tc.step_tests if s.statut == "passed"])
        for tc in workflow.test_cases
    )
    failed_steps = sum(
        len([s for s in tc.step_tests if s.statut == "failed"])
        for tc in workflow.test_cases
    )

    return {
        "workflow_id": workflow_id,
        "status": workflow.statut,
        "total_steps": total_steps,
        "passed_steps": passed_steps,
        "failed_steps": failed_steps,
        "pending_steps": total_steps - passed_steps - failed_steps,
        "date_debut": workflow.date_debut,
        "date_fin": workflow.date_fin
    }

@router.post("/workflow/{workflow_id}/execute")
def execute_workflow(
    workflow_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    background_tasks.add_task(execute_workflow_task, workflow_id, current_user.id, db)
    return {
        "message": f"Execution workflow {workflow_id} start for user {current_user.id}"
    }

def execute_workflow_task(workflow_id: int, user_id: int, db: Session):
    try:
        execution_service = TestExecutionService(db, user_id)
        execution_service.execute_workflow_by_id(workflow_id)
    finally:
        db.close()

@router.get("/workflows/{workflow_id}/execution-status")
def get_workflow_execution_status(workflow_id: int, db: Session = Depends(get_session)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow non trouvé")

    execution_details = []
    
    for test_case in sorted(workflow.test_cases, key=lambda x: x.ordre_execution):
        test_case_detail = {
            "test_case_id": test_case.id,
            "title": test_case.title,
            "status": test_case.statut,
            "date_debut": test_case.date_debut,
            "date_fin": test_case.date_fin,
            "error_message": test_case.error_message,
            "steps": []
        }
        
        for step in sorted(test_case.step_tests, key=lambda x: x.ordre_execution):
            step_detail = {
                "step_id": step.id,
                "title": step.title,
                "status": step.statut,
                "date_debut": step.date_debut,
                "date_fin": step.date_fin,
                "error_message": step.error_message,
                "screenshot_path": step.screenshot_path
            }
            test_case_detail["steps"].append(step_detail)
        
        execution_details.append(test_case_detail)

    total_steps = sum(len(tc.step_tests) for tc in workflow.test_cases)
    completed_steps = sum(
        len([s for s in tc.step_tests if s.statut in ["passed", "failed"]])
        for tc in workflow.test_cases
    )
    
    progress_percentage = (completed_steps / total_steps * 100) if total_steps > 0 else 0

    return {
        "workflow_id": workflow_id,
        "title": workflow.title,
        "status": workflow.statut,
        "date_debut": workflow.date_debut,
        "date_fin": workflow.date_fin,
        "progress_percentage": round(progress_percentage, 2),
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "execution_details": execution_details
    }