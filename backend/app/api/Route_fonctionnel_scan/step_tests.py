from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import get_session
from typing import List

from app.models.functional import StepTest, TestCase
from app.schemas.fonctionnel_scan.step_test import StepTestCreate, StepTestRead


router = APIRouter(tags=["Step-Tests"])

@router.post("/step_tests/", response_model=StepTestRead)
def create_step_test(step_test: StepTestCreate, db: Session = Depends(get_session)):
    new_step_test = StepTest(
        title=step_test.title,
        description=step_test.description,
        test_case_id=step_test.test_case_id,
        ordre_execution=step_test.ordre_execution,
        settings=step_test.settings,
        statut=step_test.statut
    )
    db.add(new_step_test)
    db.commit()
    db.refresh(new_step_test)
    return new_step_test

@router.get("/step_tests/", response_model=List[StepTestRead])
def get_all_step_tests(db: Session = Depends(get_session)):
    db_step_tests = db.query(StepTest).all()
    return db_step_tests

@router.get("/step_tests/{step_test_id}", response_model=StepTestRead)
def get_step_test(step_test_id: int, db: Session = Depends(get_session)):
    db_step_test = db.query(StepTest).filter(StepTest.id == step_test_id).first()
    if db_step_test is None:
        raise HTTPException(status_code=404, detail="StepTest not found")
    return db_step_test

@router.get("/testcases/{test_case_id}/step_tests", response_model=List[StepTestRead])
def get_step_tests_by_test_case(test_case_id: int, db: Session = Depends(get_session)):
    db_test_case = db.query(TestCase).filter(TestCase.id == test_case_id).first()
    if db_test_case is None:
        raise HTTPException(status_code=404, detail="Test case not found")
    db_step_tests = db.query(StepTest).filter(StepTest.test_case_id == test_case_id).all()
    return db_step_tests

@router.put("/step_tests/{step_test_id}", response_model=StepTestCreate)
def update_step_test(step_test_id: int, step_test: StepTestCreate, db: Session = Depends(get_session)):
    db_step_test = db.query(StepTest).filter(StepTest.id == step_test_id).first()
    if db_step_test is None:
        raise HTTPException(status_code=404, detail="StepTest not found")
    db_step_test.description = step_test.description
    db.commit()
    db.refresh(db_step_test)
    return db_step_test

@router.delete("/step_tests/{step_test_id}")
def delete_step_test(step_test_id: int, db: Session = Depends(get_session)):
    db_step_test = db.query(StepTest).filter(StepTest.id == step_test_id).first()
    if db_step_test is None:
        raise HTTPException(status_code=404, detail="StepTest not found")
    db.delete(db_step_test)
    db.commit()
    return {"message": "StepTest deleted successfully"}
