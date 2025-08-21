from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import get_session
from typing import List
from app.models.functional import TestCase, Workflow, StepTest
from app.schemas.fonctionnel_scan.test_case import  TestCaseCreate, TestCaseRead

router = APIRouter(tags=["Test-Cases"])

@router.post("/testcases/", response_model=TestCaseRead)
def create_test_case(test_case: TestCaseCreate, db: Session = Depends(get_session)):
    new_test_case = TestCase(
        title=test_case.title,
        ordre_execution=test_case.ordre_execution,
        workflow_id=test_case.workflow_id
    )
    db.add(new_test_case)
    db.flush() 
    for step in test_case.step_tests:
        new_step = StepTest(
            title=step.title,
            ordre_execution=step.ordre_execution,
            description=step.description,
            settings=step.settings,
            test_case=new_test_case
        )
        db.add(new_step)

    db.commit()
    db.refresh(new_test_case)
    return new_test_case

@router.get("/testcases/", response_model=List[TestCaseRead])
def get_all_test_cases(db: Session = Depends(get_session)):
    return db.query(TestCase).all()

@router.get("/testcases/{test_case_id}", response_model=TestCaseRead)
def get_test_case(test_case_id: int, db: Session = Depends(get_session)):
    test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    return test_case

@router.get("/workflows/{workflow_id}/testcases", response_model=List[TestCaseRead])
def get_test_cases_by_workflow(workflow_id: int, db: Session = Depends(get_session)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return db.query(TestCase).filter(TestCase.workflow_id == workflow_id).all()

@router.put("/testcases/{test_case_id}", response_model=TestCaseRead)
def update_test_case(test_case_id: int, test_case: TestCaseCreate, db: Session = Depends(get_session)):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not db_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")

    db_test_case.title = test_case.title
    db_test_case.ordre_execution = test_case.ordre_execution

    # Pour les steps : suppression des anciens steps et création des nouveaux
    db.query(StepTest).filter(StepTest.test_case_id == test_case_id).delete()
    for step in test_case.step_tests:
        new_step = StepTest(
            title=step.title,
            ordre_execution=step.ordre_execution,
            description=step.description,
            settings=step.settings,
            statut=step.statut,
            test_case=db_test_case
        )
        db.add(new_step)

    db.commit()
    db.refresh(db_test_case)
    return db_test_case

@router.delete("/testcases/{test_case_id}")
def delete_test_case(test_case_id: int, db: Session = Depends(get_session)):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if not db_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    db.delete(db_test_case)
    db.commit()
    return {"message": "Test case deleted successfully"}
