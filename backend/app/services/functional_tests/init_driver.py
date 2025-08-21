#type: ignore
import os
from behave import fixture
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common import WebDriverException
#from selenium.webdriver.remote import webdriver
from selenium.webdriver.chrome import webdriver as localdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
import os
from behave import fixture
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.opera import OperaDriverManager

@fixture
def run_chrome_browser_remotely(context, SELENOID_URL="http://localhost:4444/wd/hub/"):
    chrome_options = Options()
    # Common Chrome Options
    #chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    #chrome_options.add_argument(f'--window-size={os.getenv("WINDOW_SIZE", "1920,1080")}')
    chrome_options.browserName= 'chrome'
    chrome_options.timeZone = 'Europe/Paris'
    chrome_options.timeout ='2h'
    chrome_options.dnsServers = ["8.8.8.8", "8.8.4.4"]
    #if os.getenv('HEADLESS', 'True') == 'True': chrome_options.add_argument('--headless')
    chrome_options.add_experimental_option('prefs', {
        'intl.accept_languages': 'fr,fr_FR',
        "download.default_content_settings.popups": 0,
        'download.default_directory': "/home/selenium/Downloads",  # Adjust as necessary
        "download.prompt_for_download": False,
        "download.directory_upgrade": True,
        "safebrowsing_for_trusted_sources_enabled": False,
        "safebrowsing.enabled": False
    })
    selenoid_options = {
        "enableVideo": True,
        "enableVNC": True,
        "screenResolution": "1920x1080x24",
        "videoScreenSize": "1920x1080"
    }
    # Merge Selenoid options into Chrome options
    chrome_options.set_capability('selenoid:options', selenoid_options)
    #chrome_options.page_load_strategy = os.getenv('PAGE_LOAD_STRATEGY', 'eager')

    # Determine whether to use a local or remote WebDriver based on an environment variable
    if SELENOID_URL:
        # Remote WebDriver setup
        print(f"Tests will be executed using remote WebDriver at {SELENOID_URL}")
        i = 0
        while i < 10:
            print("try creating driver number : "+ str(i))
            try:
                #context.driver = webdriver.WebDriver(command_executor=SELENOID_URL, options=chrome_options)
                context.driver = webdriver.Remote(command_executor=SELENOID_URL, options=chrome_options)
                context.driver.maximize_window()
                break
            except WebDriverException as e:
                print(f"Failed to initialize remote WebDriver: {e}")
                i = i + 1
                #raise
            except Exception as e:
                print(e)
                i = i + 1
        context.session_id = context.driver.session_id
        print(f"Session ID is {context.session_id}")
    else:
        # Local WebDriver setup
        print("Tests will be executed locally")
        service = Service(executable_path=ChromeDriverManager().install())
        context.driver = webdriver.Chrome(service=service, options=chrome_options)

    yield context.driver

@fixture
def run_browser_remotely(context, browser_name="chrome", SELENOID_URL="http://localhost:4444/wd/hub"):
    # Common options for all browsers
    options = None
    service = None
    
    if browser_name.lower() == "chrome":
        chrome_options = ChromeOptions()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_experimental_option('prefs', {
            'intl.accept_languages': 'fr,fr_FR',
            "download.default_content_settings.popups": 0,
            'download.default_directory': "/home/selenium/Downloads",
            "download.prompt_for_download": False,
            "download.directory_upgrade": True,
            "safebrowsing_for_trusted_sources_enabled": False,
            "safebrowsing.enabled": False
        })
        selenoid_options = {
            "enableVideo": True,
            "enableVNC": True,
            "screenResolution": "1920x1080x24",
            "videoScreenSize": "1920x1080"
        }
        chrome_options.set_capability('selenoid:options', selenoid_options)
        options = chrome_options
        print("Using Chrome")

    elif browser_name.lower() == "firefox":
        firefox_options = FirefoxOptions()
        # Set Firefox-specific options here
        firefox_options.add_argument('--no-sandbox')
        firefox_options.add_argument('--disable-dev-shm-usage')
        selenoid_options = {
            "enableVideo": True,
            "enableVNC": True,
            "screenResolution": "1920x1080x24",
            "videoScreenSize": "1920x1080"
        }
        firefox_options.set_capability('selenoid:options', selenoid_options)
        options = firefox_options
        print("Using Firefox")

    else:
        raise ValueError("Unsupported browser name: {}".format(browser_name))

    # Determine whether to use a local or remote WebDriver based on SELENOID_URL
    if SELENOID_URL:
        print(f"Tests will be executed using remote WebDriver at {SELENOID_URL}")
        i = 0
        while i < 10:
            print(f"try creating driver number: {i}")
            try:
                context.driver = webdriver.Remote(command_executor=SELENOID_URL, options=options)
                context.driver.maximize_window()
                break
            except WebDriverException as e:
                print(f"Failed to initialize remote WebDriver: {e}")
                i += 1
            except Exception as e:
                print(e)
                i += 1
        context.session_id = context.driver.session_id
        print(f"Session ID is {context.session_id}")
    else:
        # Local WebDriver setup based on the selected browser
        if browser_name.lower() == "chrome":
            service = ChromeService(executable_path=ChromeDriverManager().install())
            context.driver = webdriver.Chrome(service=service, options=options)
        elif browser_name.lower() == "firefox":
            service = FirefoxService(executable_path=GeckoDriverManager().install())
            context.driver = webdriver.Firefox(service=service, options=options)

    yield context.driver