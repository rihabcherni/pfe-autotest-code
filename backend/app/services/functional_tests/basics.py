# type: ignore
import base64
import datetime
import sys, os
import time
import traceback
import requests
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, \
    ElementNotInteractableException, NoSuchElementException, JavascriptException, WebDriverException
import selenium
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver import ActionChains
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from .slack_notification_functions import post_scenario_web_failure_message_on_slack
import logging


def print_in_mode(context, mode, str):
    match mode:
        case "verbose":
            if context.verbose == True:
                print(str)
        case "debug":
            if context.debug == True:
                print(str)
        case _:
            print(str)

def wait_element_visible(context, element, timeout=10.0, dynamic_time_out_control=False):
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    try:
        WebDriverWait(driver, timeout, 0.2).until(EC.visibility_of_element_located((locator, element)))
        return True
    except (selenium.common.exceptions.NoSuchElementException, selenium.common.exceptions.TimeoutException,
            selenium.common.exceptions.WebDriverException):
        if dynamic_time_out_control:
            print("dynamic timeout wait is activated")
            element_visibility = False
            for dynamic_timeout in range(1, 500):
                print("the element visibility at the beginin of the loop is : ", element_visibility)
                if element_visibility:
                    break
                try:
                    driver.refresh()
                    time.sleep(3)
                    WebDriverWait(driver, dynamic_timeout, 0.2).until(
                        EC.visibility_of_element_located((locator, element)))
                    print("element become visible, return a true right now")
                    element_visibility = True
                except (selenium.common.exceptions.NoSuchElementException, selenium.common.exceptions.TimeoutException,
                        selenium.common.exceptions.WebDriverException):
                    print(
                        "the elmeent still not visible, still in the loop and add another timeout for the selenium wait method")
                    element_visibility = False
                print("the visibility of the element at the end of the loop for is : ", element_visibility)
            return element_visibility
        else:
            return False

def wait_element_not_present(context, element, timeout=10):
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    try:
        WebDriverWait(driver, timeout).until(EC.presence_of_element_located((locator, "locator")))
        not_found = False
    except:
        not_found = True

    assert not_found

def wait_element_disappear(context, element, timeout=10):
    start_time = time.time()
    while time.time() < start_time + timeout and wait_element_visible(context, element, timeout=0.5):
        time.sleep(0.5)
    if time.time() > start_time + timeout:
        print_in_mode(context, "verbose", f"Element {element} is still visible")
        return False
    else:
        print_in_mode(context, "verbose", f"Element {element} is not visible anymore")
        return True

def wait_element_clickable(context, element, timeout=10):
    driver = context.driver

    locator = "css selector" if '//' not in element else "xpath"
    try:
        WebDriverWait(driver, timeout).until(EC.element_to_be_clickable((locator, element)))
        print_in_mode(context, "verbose", f"Element {element} is clickable")
        return True
    except (selenium.common.exceptions.NoSuchElementException, selenium.common.exceptions.TimeoutException):
        print_in_mode(context, "verbose", f"Element {element} is not clickable")
        return False

def wait_element_present(context, element, timeout=10.0):
    # driver = context.init_driver if switch_to_init_driver else context.driver
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    try:
        WebDriverWait(driver, timeout, 0.2).until(EC.presence_of_element_located((locator, element)))
        return True
    except (selenium.common.exceptions.NoSuchElementException, selenium.common.exceptions.TimeoutException,
            selenium.common.exceptions.WebDriverException):
        return False

def element_not_visible(context, element, timeout=3):
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    try:
        WebDriverWait(driver, timeout).until(EC.visibility_of_element_located((locator, element)))
        return False
    except (selenium.common.exceptions.NoSuchElementException, selenium.common.exceptions.TimeoutException):
        return True

def remove_covering_element(context, covering_element_locator):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in covering_element_locator else "xpath"
    try:
        covering_element = driver.find_element(locator, covering_element_locator)
        driver.execute_script("arguments[0].style.display = 'none';", covering_element)
    except NoSuchElementException:
        print("Covering element not found.")


def custom_click(context, element_ref, timeout=10, covering_element_locator=None):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    wait_element_present(context, element_ref, timeout)
    visibility = wait_element_visible(context, element_ref, timeout)
    #print(visibility)
    #is_clickable = wait_element_clickable(context, element_ref, timeout)
    #print("the clickability of this elemet is ", is_clickable)
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        driver.find_element(locator, element_ref).click()
    except Exception:
        print(f"Exception of custom_click for {element_ref}")
        try:
            actions = ActionChains(context.driver)
            element = driver.find_element(locator, element_ref)
            actions.move_to_element(element)
            actions.click(element).perform()

        except StaleElementReferenceException:
            print(f"Stale Element Exception of custom_click for {element_ref}")
            pass

        except JavascriptException:
            print("trying to scroll to element")
            element = driver.find_element(locator, element_ref)
            driver.execute_script("arguments[0].scrollIntoView();", element)
            # Check if the element is covered by another element
            is_element_covered = driver.execute_script("""
                        var elem = arguments[0];
                        var rect = elem.getBoundingClientRect();
                        var x = rect.left + (rect.width / 2);
                        var y = rect.top + (rect.height / 2);
                        var elementAtPoint = document.elementFromPoint(x, y);
                        return elementAtPoint !== elem;
                    """, element)
            if is_element_covered:
                # raise Exception("Element is covered by another element")
                print("Element is covered by another element")
                #remove_covering_element(context, covering_element_locator)
                is_element_covered = driver.execute_script("""
                                        var elem = arguments[0];
                                        var rect = elem.getBoundingClientRect();
                                        var x = rect.left + (rect.width / 2);
                                        var y = rect.top + (rect.height / 2);
                                        var elementAtPoint = document.elementFromPoint(x, y);
                                        return elementAtPoint !== elem;
                                    """, element)
                print("the element is covered by another element is ")
                print(is_element_covered)

            # driver.execute_script("arguments[0].style.zIndex = '9999';", element)
            # driver.find_element(locator, element_ref).click()
            # Click the element using JavaScript
            driver.execute_script("arguments[0].click();", element)
            print("Element clicked successfully.")


def custom_click_on_webelement(context, webelement):
    driver = context.driver
    try:
        webelement.click()
    except (
            selenium.common.exceptions.ElementClickInterceptedException,
            selenium.common.exceptions.NoSuchElementException):
        #  time.sleep(2)
        actions = ActionChains(driver)
        actions.move_to_element(webelement)
        actions.click(webelement).perform()


def custom_click_on_middle_of_webelement(context, webelement):
    driver = context.driver
    actions = ActionChains(driver)

    middle_x = webelement.size['width'] / 2
    middle_y = webelement.size['height'] / 2

    actions.move_to_element_with_offset(webelement, middle_x, middle_y)
    actions.click()

    actions.perform()


def get_text(context, element, timeout=10):
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    element_visibility = wait_element_visible(context, element, timeout)
    element_presence = wait_element_present(context, element, timeout)
    try:
        if element_visibility:
            text = driver.find_element(locator, element).text
        elif element_presence:
            text = driver.find_element(locator, element).text
        else:
            raise AssertionError("the element you wanna get the text from is not visible and present in the html")
        return text
    except Exception as e:
        raise e


def get_an_element_property(context, element, my_property):
    locator = "css selector" if '//' not in element else "xpath"
    driver = context.driver
    return driver.find_element(locator, element).get_property(my_property)


def get_a_webelement_property(context, webelement, my_property):
    return webelement.get_property(my_property)


def checkbox_is_checked(context, my_checkbox, timeout=10):
    locator = "css selector" if '//' not in my_checkbox else "xpath"
    hover_over_element(context, my_checkbox)
    # scroll_to_element_using_js(context, my_checkbox, timeout)
    checkbox_visibility = wait_element_visible(context, my_checkbox, timeout)
    checkbox_presence = wait_element_present(context, my_checkbox, timeout)
    if checkbox_visibility or checkbox_presence:
        try:
            return context.driver.find_element(locator, my_checkbox).is_selected()
        except Exception as e:
            raise e


def toggle_checkbox(context, checkbox_attribute, checkbox_name, timeout=10):
    checkbox_locator = getattr(context, checkbox_attribute)
    print(checkbox_locator)
    option_selected = checkbox_is_checked(context, checkbox_locator, timeout)
    if not option_selected:
        custom_click(context, checkbox_locator, timeout)
    else:
        print(f"{checkbox_name} option already selected")


def send_keys_to_an_element(context, element, my_string, clear=True):
    driver = context.driver
    locator = "css selector" if '//' not in element else "xpath"
    wait_element_present(context, element, 5)
    wait_element_visible(context, element, 5)
    if clear:
        driver.find_element(locator, element).clear()
        time.sleep(2)

    try:
        driver.find_element(locator, element).send_keys(my_string)
    except ElementNotInteractableException:
        print("gonna use javascript to send keys")
        time.sleep(1)
        webelement = driver.find_element(locator, element)
        #driver.find_element(locator, element).send_keys(my_string)
        actions = ActionChains(driver) 
        actions.move_to_element(webelement)
        actions.click(webelement) 
        actions.send_keys(my_string)
        actions.perform()


def send_keys_to_a_webelement(context, element, my_string):
    element.clear()
    element.send_keys(my_string)


def get_selenoid_clipboard_content(context, session_id):
    print(context.selenoid_server_url.rstrip('wd/hub') + '/clipboard/' + session_id)
    response = requests.get(context.selenoid_server_url.rstrip('wd/hub') + '/clipboard/' + session_id)
    return response.text


def progress_bar_complete(message='Found!'):
    sys.stdout.write('\r')
    sys.stdout.write("[%-20s]" % ('=' * 20))
    print(f" {message}")
    sys.stdout.flush()


def list_elements_on_page(context, element_selector, assert_element_visible=True):
    driver = context.driver
    if assert_element_visible:
        assert wait_element_visible(context, element_selector,
                                    5), f"Element {element_selector} is not visible\n\n{''.join(traceback.format_stack())}"
    else:
        wait_element_present(context, element_selector, 5)
    locator = "css selector" if '//' not in element_selector else "xpath"
    elements = driver.find_elements(locator, element_selector)
    return elements


def days_to_end_of_week():
    today = datetime.datetime.now()
    end_of_week = today + datetime.timedelta(days=6 - today.weekday())
    return (end_of_week - today).days


def select_element_from_dropdown_optimized(context, element_locator, option1, timeout=10,
                                 first_locator_template_for_options=False, second_locator_template_for_options=False,
                                 third_locator_template_for_options=False,  clear_dropdrop=True, click_on_hide_icon=True):
    option = option1
    if first_locator_template_for_options:
        option_locator_template = f"//div[@aria-selected='false' and @role='option']//child::span[contains(text(), '{option}')]"
    elif second_locator_template_for_options:
        option_locator_template = f"//div[@aria-selected='false' and @role='option']//child::div[contains(text(), '{option}')]"
    elif third_locator_template_for_options:
        option_locator_template = f"//div[@class='v-list-item__content']//child::div[@class='v-list-item__title'  and contains(text(), '{option}')]"
    elif not (
            first_locator_template_for_options and second_locator_template_for_options and third_locator_template_for_options):
        option_locator_template = f"//div[@class='v-list-item__content']//child::div[contains(@class, 'v-list-item__title')  and contains(text(), '{option}')]/parent::div[@class='v-list-item__title']//parent::div[@class='v-list-item__content']"

    print(option_locator_template)
    hide_dropdown_locator = element_locator + "//following::i[@class='v-icon notranslate mdi mdi-menu-down theme--light primary--text']"
    if option is not None:
        try:
            custom_click(context, element_locator, timeout)
            print("the click of the dropdown is done")
            send_keys_to_an_element(context, element_locator, option, clear=clear_dropdrop)
            print("the send keys in the dropdown is done")
                    
            option_locator_visibility = wait_element_visible(context,option_locator_template, 3)
            if option_locator_visibility:
                print("the first option locator template is selected for this function")
                print(option_locator_template)
                custom_click(context, option_locator_template, timeout)
                time.sleep(2)
                if click_on_hide_icon:
                    hide_drop_down_visibility = wait_element_visible(context, hide_dropdown_locator, 4)
                    if hide_drop_down_visibility:
                        custom_click(context, hide_dropdown_locator, timeout)
                        print("the hide icon of the dropdown is clicked successfully")
                    else:
                        AssertionError("the hide dropdown of your element is not visible")
        except Exception as e:
            print(e)
            raise e



def select_element_from_dropdown(context, element_locator, option1, timeout=10, option2=None, option3=None,
                                 option4=None, option5=None, multi_selection=False, options_list=[],
                                 first_locator_template_for_options=True, second_locator_template_for_options=False,
                                 third_locator_template_for_options=False, covering_element_ref=None, clear_dropdrop=True, click_on_hide_icon=True):
    if options_list:
        options = options_list
    else:
        options = [option1, option2, option3, option4, option5]
    if first_locator_template_for_options and not (
            second_locator_template_for_options or third_locator_template_for_options):
        option_locator_template = "//div[@aria-selected='false' and @role='option']//child::span[text()='{}']"
    elif second_locator_template_for_options and not (
            first_locator_template_for_options or third_locator_template_for_options):
        option_locator_template = "//div[@aria-selected='false' and @role='option']//child::div[text()='{}']"
    elif third_locator_template_for_options and not (
            first_locator_template_for_options or second_locator_template_for_options):
        option_locator_template = "//div[@class='v-list-item__content']//child::div[@class='v-list-item__title'  and text()='{}']"
    elif not (
            first_locator_template_for_options and second_locator_template_for_options and third_locator_template_for_options):
        option_locator_template = "//div[@class='v-list-item__content']//child::div[@class='v-list-item__title'  and text()='{}']/parent::div[@class='v-list-item__title']//parent::div[@class='v-list-item__content']"

    print(option_locator_template)

    # Define different variations of option locators
    def get_option_locators(option):
        option_locator_1 = option_locator_template.format(option)
        option_locator_2 = option_locator_template.format(" " + option)
        option_locator_3 = option_locator_template.format(option + " ")
        option_locator_4 = option_locator_template.format(" " + option + " ")
        option_locators = [option_locator_1, option_locator_2, option_locator_3, option_locator_4]
        return option_locators

    # option_locator_templates = ["//div[@aria-selected='false' and @role='option']/child::span[text()='{}']","//div[@aria-selected='false' and @role='option']//child::span[text()='{}']"]
    if multi_selection == True:
        for option in options:
            hide_dropdown_locator = element_locator + "//following::i[@class='v-icon notranslate mdi mdi-menu-down theme--light primary--text']"
            if option is not None:
                try:
                    option_locators = get_option_locators(option)
                    custom_click(context, element_locator, timeout)
                    print("the click of the dropdown is done")
                    send_keys_to_an_element(context, element_locator, option, clear=clear_dropdrop)
                    print("the send keys in the dropdown is done")
                    
                    option1_locator_visibility = wait_element_visible(context, option_locators[0], 2)
                    option2_locator_visibility = wait_element_visible(context, option_locators[1], 2)
                    option3_locator_visibility = wait_element_visible(context, option_locators[2], 2)
                    option4_locator_visibility = wait_element_visible(context, option_locators[3], 2)
                    options_visibility = [option1_locator_visibility, option2_locator_visibility,
                                          option3_locator_visibility, option4_locator_visibility]
                    for option_visibility, option_locator in zip(options_visibility, option_locators):
                        print(option_locator)
                        if option_visibility:
                            print("the first option locator template is selected for this function")
                            print(option_locator)
                            custom_click(context, option_locator, timeout)
                            time.sleep(2)
                            if click_on_hide_icon:
                                hide_drop_down_visibility = wait_element_visible(context, hide_dropdown_locator, 4)
                                if hide_drop_down_visibility:
                                    custom_click(context, hide_dropdown_locator, timeout)
                                    print("the hide icon of the dropdown is clicked successfully")
                                    break
                                else:
                                    AssertionError("the hide dropdown of your element is not visible")
                                break

                except Exception as e:
                    print(e)
                    raise e

    else:
        if isinstance(option1, str) and option2 is None and option3 is None and option4 is None and option5 is None:
            print("second option to select an element from dropdown is activated")
            try:
                option_locators = get_option_locators(option1)
                print(option_locators)
                print("the option locators one by one are :", option_locators[0], option_locators[1],
                      option_locators[2], option_locators[3])
                custom_click(context, element_locator, timeout)
                # send_keys_to_an_element(context,element_locator, option1)
                option1_locator_visibility = wait_element_visible(context, option_locators[0], 2)
                option2_locator_visibility = wait_element_visible(context, option_locators[1], 2)
                option3_locator_visibility = wait_element_visible(context, option_locators[2], 2)
                option4_locator_visibility = wait_element_visible(context, option_locators[3], 2)
                options_visibility = [option1_locator_visibility, option2_locator_visibility,
                                      option3_locator_visibility, option4_locator_visibility]
                for option_visibility, option_locator in zip(options_visibility, option_locators):
                    if option_visibility:
                        print("the option in the dropdown is visible, try to click on it")
                        custom_click(context, option_locator, timeout, covering_element_ref)
                        break
            except Exception as e:
                print("e")
        elif isinstance(option1, str) and (
                option2 is not None or option3 is not None or option4 is not None or option5 is not None):
            print("select multiple element from dropdown without the search fo the option is activated")
            for option in options:
                hide_dropdown_locator = element_locator + "//following::i[@class='v-icon notranslate mdi mdi-menu-down theme--light primary--text']"
                if option is not None:
                    try:
                        option_locators = get_option_locators(option1)
                        print(option_locators)
                        print("the option locators one by one are :", option_locators[0], option_locators[1],
                              option_locators[2], option_locators[3])
                        custom_click(context, element_locator, timeout, covering_element_ref)
                        option1_locator_visibility = wait_element_visible(context, option_locators[0], 2)
                        option2_locator_visibility = wait_element_visible(context, option_locators[1], 2)
                        option3_locator_visibility = wait_element_visible(context, option_locators[2], 2)
                        option4_locator_visibility = wait_element_visible(context, option_locators[3], 2)
                        options_visibility = [option1_locator_visibility, option2_locator_visibility,
                                              option3_locator_visibility, option4_locator_visibility]
                        for option_visibility, option_locator in zip(options_visibility, option_locators):
                            if option_visibility:
                                print("the option in the dropdown is visible, try to click on it")
                                custom_click(context, option_locator, covering_element_ref)
                                hide_drop_down_visibility = wait_element_visible(context, hide_dropdown_locator, 4)
                                if hide_drop_down_visibility:
                                    custom_click(context, hide_dropdown_locator, timeout)
                                    print("the hide icon of the dropdown is clicked successfully")
                                    break
                    except Exception as e:
                        print("e")


def hover_over_element(context, element_ref):
    driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"

    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        actions = ActionChains(context.driver)
        element = driver.find_element(locator, element_ref)
        actions.move_to_element(element).perform()
    except Exception:
        print(f"Exception of hover over element for {element_ref}")
    pass


def perform_click_with_js(context, element_ref, timeout=10):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    wait_element_present(context, element_ref, timeout)
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        driver.execute_script("arguments[0].click();", element_ref)
    except Exception:
        print(f"Exception of custom_click for {element_ref}")


def select_date_with_js(context, element_ref, date_input_string, label_text, parent_div_class_of_date_field,
                        timeout=10):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    date_field_input = driver.find_element(locator, element_ref)
    wait_element_present(context, element_ref, timeout)
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        # custom_click(context, element_ref, timeout)
        # driver.execute_script("arguments[0].value = arguments[1];", date_field_input, date_input_string)
        # driver.execute_script("arguments[0].value =" + date_input_string +";", date_field_input)
        # date_field_input.send_keys(Keys.TAB)
        # Use JavaScript to set the value of the date input field
        script = """
        var label_text = arguments[0];
        var parent_div_class_of_date_field = arguments[1];
        var label = Array.from(document.querySelectorAll('label')).find(el => el.textContent === label_text);
        if (label) {
            var input = label.closest('div.' + parent_div_class_of_date_field).querySelector('input');
            if (input) {
                var date = new Date(arguments[2]);
                var year = date.getFullYear();
                var month = String(date.getMonth() + 1).padStart(2, '0');
                var day = String(date.getDate()).padStart(2, '0');
                var formatted_date = year + '-' + month + '-' + day;
                input.value = formatted_date;
                var event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                }
                }
                """
        print(label_text)
        print(parent_div_class_of_date_field)
        driver.execute_script(script, label_text, parent_div_class_of_date_field, date_input_string)
        print("send date is done successfully with javascript executor")
    except Exception as e:
        print(f"Exception of sending day with javascript scripts for {element_ref}")
        print(e)
        raise e


def select_date_with_js_optimized(context, element_ref, date_input_string, label_text, parent_div_class_of_date_field,
                                  Tag_date_field_visible_text='label', timeout=10):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    date_field_input = driver.find_element(locator, element_ref)
    wait_element_present(context, element_ref, timeout)
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        # custom_click(context, element_ref, timeout)
        # driver.execute_script("arguments[0].value = arguments[1];", date_field_input, date_input_string)
        # driver.execute_script("arguments[0].value =" + date_input_string +";", date_field_input)
        # date_field_input.send_keys(Keys.TAB)
        # Use JavaScript to set the value of the date input field
        # div.v-text-field__prefix

        script = """
            var label_text = arguments[0];
            var date_input_string = arguments[1];
            var parent_div_class_of_date_field = arguments[2]
            var Tag_date_field_visible_text = arguments[3]
            var elements = Array.from(document.querySelectorAll(Tag_date_field_visible_text)).filter(el => el.textContent === label_text);
            if (elements.length > 0) {
                var element = elements[0];
                var input = element.closest('div.' + parent_div_class_of_date_field).querySelector('input[type="date"]');
                if (input) {
                    var date = new Date(date_input_string);
                    var year = date.getFullYear();
                    var month = String(date.getMonth() + 1).padStart(2, '0');
                    var day = String(date.getDate()).padStart(2, '0');
                    var formatted_date = year + '-' + month + '-' + day;
                    input.value = formatted_date;
                    var event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                } else {
                    console.error('Input element not found within the parent div.');
                }
            } else {
                console.error('Element with text "' + label_text + '" not found.');
            }
        """
        print(label_text)
        driver.execute_script(script, label_text, date_input_string, parent_div_class_of_date_field,
                              Tag_date_field_visible_text)

        print("send date is done successfully with javascript executor")
    except Exception as e:
        print(f"Exception of sending day with javascript scripts for {element_ref}")
        print(e)
        #raise e


def get_text_using_js(context, element_ref, timeout=10):
    driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        webelement = driver.find_element(locator, element_ref)
        wait_element_visible(context, element_ref, timeout)
        script = "return arguments[0].value;"
        date_value = driver.execute_script(script, webelement)
        print("Displayed date:", date_value) 
        return date_value
    except Exception as e:
        print(f"Exception {e}") 


def select_date(context, element_ref, date_input_string, timeout=10):
    
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    wait_element_present(context, element_ref, timeout)
    try:
        count_element = list_elements_on_page(context, element_ref, False)
        assert len(
            count_element) == 1, f"There should be only one element for {element_ref}, got {len(count_element)}\n\n{''.join(traceback.format_stack())}"
        custom_click(context, element_ref)

    except Exception as e:
        
        raise e


def get_document_ready_state(context):
    """
    Gets the value of the document.readyState property of the current page.
    
    Args:
        driver: WebDriver instance
        
    Returns:
        str: The value of the document.readyState property ('loading', 'interactive', or 'complete')
    """
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    try:
        return driver.execute_script('return document.readyState')
    except Exception as e:
        raise e


def scroll_to_element_using_js(context, element_ref, timeout):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    element = driver.find_element(locator, element_ref)
    element_present = wait_element_present(context, element_ref, timeout)
    if element_present:
        try:
            driver.execute_script("arguments[0].scrollIntoView();", element)
        except Exception as e:
            raise e
    else:
        raise AssertionError("the element is not present in the html tree")


def scroll_down_by_specific_distance(context, distance):
    driver = context.driver
    pixels_to_scroll = int(distance * 37.795275591)
    print("the scroll down begin by : ", pixels_to_scroll)
    try:
        driver.execute_script(f"window.scrollBy(0, {pixels_to_scroll});")
        print("the scroll down is done")
    except Exception as e:
        raise e


def check_for_failure_data(failed_test_log_path):
    # Get the list of .txt files in the failed_test_log_path folder
    failed_tests = [f for f in os.listdir(failed_test_log_path) if f.endswith('.txt')]
    if failed_tests:
        failed_test_count = len(failed_tests)
        return True, failed_test_count
    return False, 0


def print_console_errors_and_take_screenshot(context, step_name):
    # logs = context.driver.get_log('browser')
    # for log in logs:
    # if log['level'] == 'SEVERE':
    # print(f"Console error: {log['message']}")
    # Capture console logs
    logs = context.driver.get_log('browser')
    severe_logs = [log['message'] for log in logs if log['level'] == 'SEVERE']
    if severe_logs:
        log_data = "\n".join(severe_logs)
        context.embed(mime_type="text/plain", data=log_data, caption="Console Logs")

    screenshot_path = f'./screenshots/{step_name}.png'
    screenshot_path_2 = f'./screenshots/{step_name}_screenshot.png'
    context.driver.save_screenshot(screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")
    width = context.driver.execute_script(
        "return Math.max( document.body.scrollWidth, document.body.offsetWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth );")
    height = context.driver.execute_script(
        "return Math.max( document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );")
    # Set the window size to match the entire webpage
    context.driver.set_window_size(width, height)
    # Find the full page element (usually 'body') and capture the screenshot
    full_page = context.driver.find_element(By.TAG_NAME, "body")
    full_page.screenshot(f"{screenshot_path_2}.png")
    # Attach screenshot to the HTML report
    data_base64 = base64.b64encode(open(screenshot_path, "rb").read())
    data = data_base64.decode("utf-8").replace("\n", "")
    context.embed(mime_type="image/png", data=data, caption="Screenshot")
    # if "browser" in context.driver.capabilities['browserName']:
    # with open(screenshot_path, "rb") as image_file:
    # context.embed(image_file.read(), "image/png", "Screenshot on failure")


def take_screenshot(context, file_path):
    # Ensure the driver exists in the context
    driver = getattr(context, "driver", None)  # Safely get driver from context
    if driver is None:
        logging.error("WebDriver is not initialized. Cannot take a screenshot.")
        return

    # Attempt to save the screenshot
    try:
        driver.save_screenshot(file_path)
        logging.info(f"Screenshot saved to {file_path}")
    except WebDriverException as e:
        logging.error(f"Failed to take screenshot: {e}")


def handle_test_failure(context, test_name, failed_step, screenshot_path, error_log, test_case_feature_file=None):
    try:
        driver = context.driver
    except Exception:
        driver = context.driver
    # Capture a screenshot of the failure
    take_screenshot(context, screenshot_path)

    # Get logs from the Behave context dynamically
    log_content = error_log
    print(f"the log content of the falied tests is {log_content}")

    # Define the output message
    output_message = f"Test '{test_name}' failed at step '{failed_step}'."
    print(f"the output message of the failed tests is {output_message}")
    
    # Post the failure message to Slack
    post_scenario_web_failure_message_on_slack(
        context=context,
        channel_id="C06SJNBKK5M",
        output_message=output_message,
        screenshot=screenshot_path,
        log=log_content,
        feature_file=test_case_feature_file
    )


def get_value_using_js(context, element_ref, timeout=10):
    try:
        driver = context.driver 
    except Exception:
        driver = context.driver
    
    locator = "css selector" if '//' not in element_ref else "xpath"
    element = driver.find_element(locator, element_ref)
    element_present = wait_element_present(context, element_ref, timeout)
    element_visible = wait_element_visible(context, element_ref, timeout)
    try:
        if element_present or element_visible:
            # Use JavaScript to get the displayed value
            displayed_value = driver.execute_script("return arguments[0].value;", element) 
            return displayed_value
        else:
            raise AssertionError("the element you try to get the value from is not present and visible")
    except Exception as e:
        raise e
    

def perform_click_in_iframe(context, iframe_locator, element_locator, timeout=10):
    try:
        driver = context.driver
    except AttributeError:
        driver = context.driver
    locator = "css selector" if '//' not in iframe_locator else "xpath"
    time.sleep(3)
    #print(driver.page_source)
    try:
        # Wait for the iframe to be visible and switch to it
        #WebDriverWait(driver, timeout).until(EC.frame_to_be_available_and_switch_to_it((By.XPATH, iframe_locator)))
        iframe = WebDriverWait(driver, timeout, 0.2).until(EC.presence_of_element_located((locator, iframe_locator)))
        #element = driver.find_element(locator, iframe_locator)
        print(f"find the iframe with locator {iframe_locator}")
        driver.switch_to.frame(iframe)
        print(f"Switched to iframe: {iframe_locator}")
        custom_click(context, element_locator, timeout)
        print(f"Clicked on element: {element_locator}")
    except Exception as e:
        print(e)
        pass
    finally:
        # Switch back to the default content
        context.driver.switch_to.default_content()
        print("Switched back to the default content.")


def clear_field_with_js(context, element_ref, timeout=10):
    try:
        driver = context.driver 
    except Exception:
        driver = context.driver
    locator = "css selector" if '//' not in element_ref else "xpath"
    element = driver.find_element(locator, element_ref)
    element_visible = wait_element_visible(context, element_ref, timeout)
    try:
        if element_visible:
            # Use JavaScript to get the displayed value
            driver.execute_script("arguments[0].value = '';", element)
        else:
            raise AssertionError("the element you try to clear a field that is not visible")
    except Exception as e:
        raise e
    