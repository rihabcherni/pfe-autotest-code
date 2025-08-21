from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database.database import get_session
from app.models.parametres_envoi_rapports import ParametresEnvoiRapports
from app.schemas.parametres_envoi_rapports import ParametresEnvoiRapportsCreate, ParametresEnvoiRapportsOut
import json

router = APIRouter(prefix="/parametres-envoi", tags=["Parametres Envoi Rapports"])

@router.post("/", response_model=ParametresEnvoiRapportsOut)
def create_or_update_parametres(parametres: ParametresEnvoiRapportsCreate, db: Session = Depends(get_session)):
    db_param = db.query(ParametresEnvoiRapports).filter_by(user_id=parametres.user_id).first()

    if db_param:
        for field, value in parametres.dict(exclude_unset=True).items():
            if field == "liste_emails":
                setattr(db_param, field, json.dumps(value))
            elif field == "report_types":
                db_param.set_report_types(value)
            elif field == "report_formats":
                db_param.set_report_formats(value)
            else:
                setattr(db_param, field, value)
        db.commit()
        db.refresh(db_param)
    else:
        db_param = ParametresEnvoiRapports(
            user_id=parametres.user_id,
            liste_emails=json.dumps(parametres.liste_emails),
            slack_token=parametres.slack_token,
            slack_channel_id=parametres.slack_channel_id,
            jira_cle_projet=parametres.jira_cle_projet,
            jira_domain=parametres.jira_domain,
            jira_board=parametres.jira_board,
            jira_email=parametres.jira_email,
            jira_token=parametres.jira_token,
        )
        db_param.set_report_types(parametres.report_types)
        db_param.set_report_formats(parametres.report_formats)
        db.add(db_param)
        db.commit()
        db.refresh(db_param)

    db_param.liste_emails = json.loads(db_param.liste_emails)
    return {
        **db_param.__dict__,
        "liste_emails": db_param.liste_emails,
        "report_types": db_param.get_report_types(),
        "report_formats": db_param.get_report_formats()
    }

@router.get("/{user_id}", response_model=ParametresEnvoiRapportsOut)
def get_parametres_by_user(user_id: int, db: Session = Depends(get_session)):
    param = db.query(ParametresEnvoiRapports).filter_by(user_id=user_id).first()
    if not param:
        raise HTTPException(status_code=404, detail="Paramètres non trouvés")
    return {
        **param.__dict__,
        "liste_emails": json.loads(param.liste_emails),
        "report_types": param.get_report_types(),
        "report_formats": param.get_report_formats()
    }

@router.delete("/{user_id}")
def delete_parametres(user_id: int, db: Session = Depends(get_session)):
    db_param = db.query(ParametresEnvoiRapports).filter_by(user_id=user_id).first()
    if not db_param:
        raise HTTPException(status_code=404, detail="Paramètres non trouvés")
    db.delete(db_param)
    db.commit()
    return {"detail": "Paramètres supprimés avec succès"}
