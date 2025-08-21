import os
from fastapi.staticfiles import StaticFiles
import uvicorn
from fastapi import FastAPI
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from app.configuration import utils
from app.configuration.config import configure_cors
from app.api.Route_user import router as router_user
from app.api.Route_authentification import router as router_authentification
from app.api.Route_security_scan import router as router_scan
from app.api.Route_seo import router as router_seo
from app.api.Route_config import router as router_config
from app.api.Route_report import router as router_report
from app.api.Route_contact import router as router_contact
from app.api.Route_notification import router as router_notification
from app.api.Route_fonctionnel_scan.functional_report import router as router_functional_report 
from app.api.Route_fonctionnel_scan.workflow import router as router_workflow
from app.api.Route_fonctionnel_scan.test_cases import router as router_test_cases
from app.api.Route_fonctionnel_scan.step_tests import router as router_step_tests
from app.api.Route_admin_dashboard import router as router_admin_dashboard
from app.api.Route_tester_dashboard import router as router_tester_dashboard
from app.api.Route_security_preferences import router as router_preferences_utilisateur
from app.api.Route_parametres_envoi_rapports import router as router_parametres_envoi_rapports
from app.api.Route_permissions import router as router_permissions
from app.database.database import Base, engine, get_session
from contextlib import asynccontextmanager

load_dotenv()

class Controller:
    Base.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Starting up app...")
    db: Session = next(get_session())
    utils.add_administrator(db)
    yield
    print("🔻 Shutting down app...")

combined_app = FastAPI(
    title="Vulnerability Scanner & Testing Automation API",
    description="This API provides endpoints for automated vulnerability scanning, functional testing, security testing, user management, reporting, and authentication.",
    lifespan=lifespan
)
configure_cors(combined_app)
routers = [    
    router_authentification,
    router_user,
    router_permissions,

    router_preferences_utilisateur,
    router_parametres_envoi_rapports,
    router_config,

    router_admin_dashboard,
    router_tester_dashboard,

    router_scan,
    router_report,
    router_seo,
    
    router_functional_report,
    router_workflow,
    router_test_cases,
    router_step_tests,

    router_notification,
    router_contact,
]
for router in routers:
    combined_app.include_router(router)

combined_app.mount("/static", StaticFiles(directory="static"), name="static")
if __name__ == "__main__":
    APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT = int(os.getenv("APP_PORT", 8000))
    uvicorn.run("main:combined_app", host=APP_HOST, port=APP_PORT, reload=True)
