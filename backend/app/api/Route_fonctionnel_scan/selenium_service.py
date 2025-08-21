from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager
import time
import os
from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SeleniumTestEngine:
    def __init__(self, headless: bool = True, implicit_wait: int = 10):
        self.driver = None
        self.headless = headless
        self.implicit_wait = implicit_wait
        self.screenshots_dir = "screenshots"
        os.makedirs(self.screenshots_dir, exist_ok=True)

    def setup_driver(self):
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.implicitly_wait(self.implicit_wait)
        
        return self.driver

    def execute_step(self, step_settings: Dict[str, Any]) -> Dict[str, Any]:
        try:
            action = step_settings.get("actionType")  # Changé de "action" à "actionType"
            result = {"success": False, "message": "", "screenshot_path": None}
            
            if action == "navigate":
                url = step_settings.get("url")
                if not url:
                    result["message"] = "URL manquante pour l'action navigate"
                    return result
                    
                self.driver.get(url)
                result["success"] = True
                result["message"] = f"Navigation vers {url} réussie"
                
            elif action == "click":
                selector = step_settings.get("selector")
                timeout = step_settings.get("timeout", 10)
                
                if not selector:
                    result["message"] = "Sélecteur manquant pour l'action click"
                    return result
                
                element = self.find_element_with_timeout(selector, timeout)
                element.click()
                result["success"] = True
                result["message"] = f"Clic sur {selector} réussi"
                
            elif action == "type":
                selector = step_settings.get("selector")
                text = step_settings.get("text")
                timeout = step_settings.get("timeout", 10)
                
                if not selector or text is None:
                    result["message"] = "Sélecteur ou texte manquant pour l'action type"
                    return result
                
                element = self.find_element_with_timeout(selector, timeout)
                element.clear()
                element.send_keys(str(text))
                result["success"] = True
                result["message"] = f"Saisie de texte '{text}' dans {selector} réussie"
                
            elif action == "wait_visible":
                selector = step_settings.get("selector")
                timeout = step_settings.get("timeout", 10)
                
                if not selector:
                    result["message"] = "Sélecteur manquant pour l'action wait_visible"
                    return result
                
                wait = WebDriverWait(self.driver, timeout)
                by, selector_value = self.parse_selector(selector)
                wait.until(EC.visibility_of_element_located((by, selector_value)))
                result["success"] = True
                result["message"] = f"Élément {selector} est devenu visible"
                
            elif action == "wait_present":
                selector = step_settings.get("selector")
                timeout = step_settings.get("timeout", 10)
                
                if not selector:
                    result["message"] = "Sélecteur manquant pour l'action wait_present"
                    return result
                
                wait = WebDriverWait(self.driver, timeout)
                by, selector_value = self.parse_selector(selector)
                wait.until(EC.presence_of_element_located((by, selector_value)))
                result["success"] = True
                result["message"] = f"Élément {selector} est présent dans le DOM"
                
            elif action == "move_cursor":
                selector = step_settings.get("selector")
                timeout = step_settings.get("timeout", 10)
                
                if not selector:
                    result["message"] = "Sélecteur manquant pour l'action move_cursor"
                    return result
                
                element = self.find_element_with_timeout(selector, timeout)
                actions = ActionChains(self.driver)
                actions.move_to_element(element).perform()
                result["success"] = True
                result["message"] = f"Curseur déplacé vers {selector}"
                
            elif action == "assert":
                selector = step_settings.get("selector")
                expected_text = step_settings.get("text")  # Le texte attendu est dans le champ "text"
                timeout = step_settings.get("timeout", 10)
                
                if not selector:
                    result["message"] = "Sélecteur manquant pour l'action assert"
                    return result
                
                try:
                    element = self.find_element_with_timeout(selector, timeout)
                    actual_text = element.text
                    
                    if expected_text:
                        if expected_text in actual_text:
                            result["success"] = True
                            result["message"] = f"Assertion réussie: '{expected_text}' trouvé dans '{actual_text}'"
                        else:
                            result["success"] = False
                            result["message"] = f"Assertion échouée: '{expected_text}' non trouvé. Texte actuel: '{actual_text}'"
                    else:
                        # Si pas de texte attendu, on vérifie juste la présence de l'élément
                        result["success"] = True
                        result["message"] = f"Assertion réussie: élément {selector} présent"
                        
                except Exception as e:
                    result["success"] = False
                    result["message"] = f"Assertion échouée: élément {selector} non trouvé - {str(e)}"
                    
            elif action == "screenshot":
                screenshot_path = self.take_screenshot()
                result["success"] = True
                result["message"] = "Capture d'écran prise"
                result["screenshot_path"] = screenshot_path
                
            elif action == "wait":
                wait_time = step_settings.get("timeout", 1)
                time.sleep(wait_time)
                result["success"] = True
                result["message"] = f"Attente de {wait_time} secondes"
            elif action == "accept_alert":
                try:
                    WebDriverWait(self.driver, timeout).until(EC.alert_is_present())
                    alert = self.driver.switch_to.alert
                    alert.accept()
                    result["success"] = True
                    result["message"] = "Alerte acceptée avec succès"
                except Exception as e:
                    result["success"] = False
                    result["message"] = f"Alerte non détectée ou erreur: {str(e)}"

            else:
                result["message"] = f"Action non reconnue: {action}"
                
            # Prendre une capture d'écran si demandé ou en cas d'erreur
            if step_settings.get("screenshot", False) or not result["success"]:
                if not result.get("screenshot_path"):  # Si pas déjà prise
                    screenshot_path = self.take_screenshot()
                    result["screenshot_path"] = screenshot_path
                
            return result
            
        except Exception as e:
            logger.error(f"Erreur lors de l'exécution de l'étape: {str(e)}")
            screenshot_path = self.take_screenshot()
            return {
                "success": False,
                "message": f"Erreur lors de l'exécution: {str(e)}",
                "screenshot_path": screenshot_path
            }

    def find_element_with_timeout(self, selector: str, timeout: int = 10):
        wait = WebDriverWait(self.driver, timeout)
        by, selector_value = self.parse_selector(selector)
        return wait.until(EC.presence_of_element_located((by, selector_value)))

    def parse_selector(self, selector: str):
        if selector.startswith("//") or selector.startswith("("):
            return By.XPATH, selector
        elif selector.startswith("#"):
            return By.ID, selector[1:]
        elif selector.startswith("."):
            return By.CLASS_NAME, selector[1:]
        elif "=" in selector and selector.startswith("[") and selector.endswith("]"):
            return By.CSS_SELECTOR, selector
        else:
            # Par défaut, traiter comme un sélecteur CSS
            return By.CSS_SELECTOR, selector

    def find_element(self, selector: str, by_type: str = "CSS_SELECTOR"):
        wait = WebDriverWait(self.driver, 10)        
        by_mapping = {
            "CSS_SELECTOR": By.CSS_SELECTOR,
            "ID": By.ID,
            "NAME": By.NAME,
            "CLASS_NAME": By.CLASS_NAME,
            "TAG_NAME": By.TAG_NAME,
            "XPATH": By.XPATH,
            "LINK_TEXT": By.LINK_TEXT,
            "PARTIAL_LINK_TEXT": By.PARTIAL_LINK_TEXT
        }
        
        by = by_mapping.get(by_type, By.CSS_SELECTOR)
        return wait.until(EC.presence_of_element_located((by, selector)))

    def take_screenshot(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        screenshot_path = os.path.join(self.screenshots_dir, f"screenshot_{timestamp}.png")
        self.driver.save_screenshot(screenshot_path)
        return screenshot_path

    def quit(self):
        if self.driver:
            self.driver.quit()