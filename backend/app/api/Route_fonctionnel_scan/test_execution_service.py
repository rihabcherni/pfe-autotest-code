from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.api.Route_fonctionnel_scan.selenium_service import SeleniumTestEngine
from app.models.functional import StepTest, TestCase, Workflow
from app.schemas.fonctionnel_scan.step_test import StatutEnum
import json

from app.services.notifier import Notifier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestExecutionService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
        self.selenium_engine = None
        self.notifier = Notifier()

    def execute_workflow_by_id(self, workflow_id: int) -> bool:
        try:
            workflow = self.db.query(Workflow).filter(Workflow.id == workflow_id).first()
            if not workflow:
                logger.error(f"Workflow {workflow_id} not found.")
                if self.user_id:
                    self.notifier.send_error(f"Workflow {workflow_id} not found", self.db, self.user_id)
                return False

            logger.info(f"Starting execution of workflow {workflow_id}: {workflow.title}")
            if self.user_id:
                self.notifier.send_info(f"Starting execution of workflow '{workflow.title}'", self.db, self.user_id)

            self.selenium_engine = SeleniumTestEngine(headless=False)
            self.selenium_engine.setup_driver()

            success = self.execute_workflow(workflow)
            if self.user_id:
                status_text = "passed" if success else "failed"
                if success:
                    self.notifier.send_success(f"Workflow '{workflow.title}' {status_text}", self.db, self.user_id)
                else:
                    self.notifier.send_error(f"Workflow '{workflow.title}' {status_text}", self.db, self.user_id)

            logger.info(f"Workflow execution {workflow_id} finished. Success: {success}")
            return success

        except Exception as e:
            logger.error(f"Error during execution of workflow {workflow_id}: {str(e)}")
            if self.user_id:
                self.notifier.send_error(f"❌ Error during execution of workflow {workflow_id}: {str(e)}", self.db, self.user_id)
            return False
        finally:
            if self.selenium_engine:
                self.selenium_engine.quit()

    def execute_workflow(self, workflow: Workflow) -> bool:
        try:
            workflow.start_date = datetime.utcnow()
            workflow.statut = StatutEnum.pending
            self.db.commit()

            logger.info(f"Workflow '{workflow.title}' execution started")
            success = True
            sorted_test_cases = sorted(workflow.test_cases, key=lambda x: x.ordre_execution)

            logger.info(f"Number of test cases to execute: {len(sorted_test_cases)}")
            if self.user_id:
                self.notifier.send_info(f"📋 {len(sorted_test_cases)} test cases to execute in workflow '{workflow.title}'", self.db, self.user_id)

            for i, test_case in enumerate(sorted_test_cases, 1):
                logger.info(f"Executing test case {test_case.id}: {test_case.title}")
                if self.user_id:
                    self.notifier.send_info(f"⏳ Executing test case {i}/{len(sorted_test_cases)}: '{test_case.title}'", self.db, self.user_id)

                test_case_success = self.execute_test_case(test_case)
                if self.user_id:
                    status_text = "passed" if test_case_success else "failed"
                    self.notifier.send_progress(f"Test case {test_case.id}:{status_text} '{test_case.title}' ({i}/{len(sorted_test_cases)})", self.db, self.user_id)

                if not test_case_success:
                    success = False
                    logger.warning(f"Test case {test_case.id} failed")
                    if self.user_id:
                        self.notifier.send_warning(f"⚠️ Test case '{test_case.title}' failed - Stopping execution", self.db, self.user_id)
                    break
                else:
                    logger.info(f"Test case {test_case.id} passed")

            workflow.statut = StatutEnum.passed if success else StatutEnum.failed
            workflow.end_date = datetime.utcnow()
            self.db.commit()

            logger.info(f"Workflow '{workflow.title}' completed with status: {workflow.statut}")
            return success

        except Exception as e:
            workflow.statut = StatutEnum.failed
            workflow.end_date = datetime.utcnow()
            self.db.commit()
            logger.error(f"Error during workflow execution {workflow.id}: {str(e)}")
            if self.user_id:
                self.notifier.send_error(f"❌ Critical error in workflow '{workflow.title}': {str(e)}", self.db, self.user_id)
            return False

    def execute_test_case(self, test_case: TestCase) -> bool:
        try:
            test_case.start_date = datetime.utcnow()
            test_case.statut = StatutEnum.pending
            self.db.commit()
            success = True
            sorted_steps = sorted(test_case.step_tests, key=lambda x: x.ordre_execution)

            logger.info(f"Test case '{test_case.title}' - {len(sorted_steps)} steps to execute")

            for i, step in enumerate(sorted_steps, 1):
                logger.info(f"Executing step {step.id}: {step.title} (order: {step.ordre_execution})")
                step_success = self.execute_step(step)
                if self.user_id:
                    status_emoji = "✅" if step_success else "❌"
                    if step_success:
                        self.notifier.send_progress(f"Step {step.id}:passed {step.title} ({i}/{len(sorted_steps)})", self.db, self.user_id)
                    else:
                        self.notifier.send_warning(f"Step {step.id}:failed '{step.title}'", self.db, self.user_id)
                if not step_success:
                    success = False
                    logger.warning(f"Step {step.id} failed - Stopping test case execution")
                    break
                else:
                    logger.info(f"Step {step.id} passed")

            test_case.statut = StatutEnum.passed if success else StatutEnum.failed
            test_case.end_date = datetime.utcnow()
            self.db.commit()

            return success

        except Exception as e:
            test_case.statut = StatutEnum.failed
            test_case.end_date = datetime.utcnow()
            test_case.error_message = str(e)
            self.db.commit()
            logger.error(f"Error during execution of test case {test_case.id}: {str(e)}")
            if self.user_id:
                self.notifier.send_error(f"❌ Error in test case '{test_case.title}': {str(e)}", self.db, self.user_id)
            return False

    def execute_step(self, step: StepTest) -> bool:
        try:
            step.start_date = datetime.utcnow()
            step.statut = StatutEnum.pending
            self.db.commit()
            settings = self.prepare_step_settings(step)
            logger.info(f"Executing step '{step.title}' with action: {settings.get('actionType', 'N/A')}")
            logger.debug(f"Step settings: {settings}")
            result = self.selenium_engine.execute_step(settings)
            step.statut = StatutEnum.passed if result["success"] else StatutEnum.failed
            step.end_date = datetime.utcnow()
            step.error_message = result["message"] if not result["success"] else None
            step.screenshot_path = result.get("screenshot_path")

            self.db.commit()

            logger.info(f"Step {step.id} finished: {result['message']}")
            if not result["success"] and self.user_id:
                self.notifier.send_error(f"🔍 Step '{step.title}' error detail: {result['message']}", self.db, self.user_id)

            return result["success"]

        except Exception as e:
            step.statut = StatutEnum.failed
            step.end_date = datetime.utcnow()
            step.error_message = str(e)
            self.db.commit()
            logger.error(f"Error during execution of step {step.id}: {str(e)}")
            if self.user_id:
                self.notifier.send_error(f"💥 Critical error in step '{step.title}': {str(e)}", self.db, self.user_id)
            return False

    def prepare_step_settings(self, step: StepTest) -> dict:
        try:
            if isinstance(step.settings, str):
                settings = json.loads(step.settings)
            elif isinstance(step.settings, dict):
                settings = step.settings
            else:
                logger.warning(f"Step {step.id} settings invalid, using default parameters")
                settings = {}

            cleaned_settings = {
                "actionType": settings.get("actionType", ""),
                "selector": settings.get("selector", ""),
                "url": settings.get("url", ""),
                "text": settings.get("text", ""),
                "timeout": int(settings.get("timeout", 10)),
                "screenshot": settings.get("screenshot", False)
            }

            action_type = cleaned_settings["actionType"]

            if action_type == "navigate" and not cleaned_settings["url"]:
                logger.warning(f"Step {step.id}: Missing URL for navigate action")

            if action_type in ["click", "type", "wait_visible", "wait_present", "move_cursor", "assert"] and not cleaned_settings["selector"]:
                logger.warning(f"Step {step.id}: Missing selector for action {action_type}")

            if action_type == "type" and not cleaned_settings["text"]:
                logger.warning(f"Step {step.id}: Missing text for type action")

            return cleaned_settings

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error for step {step.id} settings: {str(e)}")
            return {
                "actionType": "",
                "selector": "",
                "url": "",
                "text": "",
                "timeout": 10,
                "screenshot": False
            }
        except Exception as e:
            logger.error(f"Error preparing settings for step {step.id}: {str(e)}")
            return {
                "actionType": "",
                "selector": "",
                "url": "",
                "text": "",
                "timeout": 10,
                "screenshot": False
            }
