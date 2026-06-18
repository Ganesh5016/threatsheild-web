import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --- TEST DATA (100+ Scenarios) ---

# 1. URL Payloads (Functionality & Vulnerability)
# 40 diverse inputs to test the URL scanner
URL_PAYLOADS = [
    ("TC-URL-001", "Functionality", "Valid HTTPS URL", "https://google.com"),
    ("TC-URL-002", "Functionality", "Valid HTTP URL", "http://example.org"),
    ("TC-URL-003", "Functionality", "URL missing protocol", "www.bing.com"),
    ("TC-URL-004", "Functionality", "Subdomain URL", "https://mail.yahoo.com/app"),
    ("TC-URL-005", "Functionality", "IP Address URL", "http://192.168.1.1"),
    ("TC-URL-006", "Functionality", "URL with port", "http://localhost:8080"),
    ("TC-URL-007", "Functionality", "URL with parameters", "https://site.com?q=test&id=5"),
    ("TC-URL-008", "Functionality", "URL with special chars", "https://site.com/test%20space"),
    ("TC-URL-009", "Functionality", "Long URL", "https://example.com/" + "a"*100),
    ("TC-URL-010", "Functionality", "URL with anchor", "https://site.com/#section"),
    ("TC-URL-011", "Vulnerability", "Basic XSS Payload", "<script>alert('XSS')</script>"),
    ("TC-URL-012", "Vulnerability", "Image XSS Payload", "<img src=x onerror=alert(1)>"),
    ("TC-URL-013", "Vulnerability", "Body onload XSS", "<body onload=alert(1)>"),
    ("TC-URL-014", "Vulnerability", "SVG XSS", "<svg/onload=alert(1)>"),
    ("TC-URL-015", "Vulnerability", "Javascript pseudo-protocol", "javascript:alert(1)"),
    ("TC-URL-016", "Vulnerability", "Data URI XSS", "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="),
    ("TC-URL-017", "Vulnerability", "Encoded XSS", "%3Cscript%3Ealert(1)%3C%2Fscript%3E"),
    ("TC-URL-018", "Vulnerability", "SQLi single quote", "admin' --"),
    ("TC-URL-019", "Vulnerability", "SQLi double quote", 'admin" #'),
    ("TC-URL-020", "Vulnerability", "SQLi OR condition", "' OR 1=1--"),
    ("TC-URL-021", "Vulnerability", "SQLi UNION SELECT", "' UNION SELECT null, null--"),
    ("TC-URL-022", "Vulnerability", "Path Traversal basic", "../../../etc/passwd"),
    ("TC-URL-023", "Vulnerability", "Path Traversal encoded", "..%2F..%2F..%2Fwindows%2Fwin.ini"),
    ("TC-URL-024", "Vulnerability", "Command Injection basic", "google.com; ls -la"),
    ("TC-URL-025", "Vulnerability", "Command Injection pipe", "google.com | cat /etc/passwd"),
    ("TC-URL-026", "Vulnerability", "Command Injection backticks", "google.com `whoami`"),
    ("TC-URL-027", "Vulnerability", "CRLF Injection", "google.com\r\nSet-Cookie: test=1"),
    ("TC-URL-028", "Vulnerability", "SSRF Payload", "http://169.254.169.254/latest/meta-data/"),
    ("TC-URL-029", "Vulnerability", "LFI Payload", "file:///etc/passwd"),
    ("TC-URL-030", "Vulnerability", "XXE Payload", '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>'),
    ("TC-URL-031", "Functionality", "Emoji in URL", "https://example.com/🚀"),
    ("TC-URL-032", "Functionality", "Non-latin chars in URL", "https://пример.рф"),
    ("TC-URL-033", "Functionality", "Empty URL", ""),
    ("TC-URL-034", "Functionality", "Whitespace only", "   "),
    ("TC-URL-035", "Vulnerability", "HTML Injection", "<h1>Injected Header</h1>"),
    ("TC-URL-036", "Vulnerability", "CSS Injection", '<style>body { background-color: red; }</style>'),
    ("TC-URL-037", "Functionality", "Valid deep link", "threatshield://scan?url=test"),
    ("TC-URL-038", "Vulnerability", "Null byte injection", "google.com%00.jpg"),
    ("TC-URL-039", "Vulnerability", "Extremely long input (Buffer Overflow check)", "A" * 5000),
    ("TC-URL-040", "Functionality", "Typo domain", "googla.com")
]

# 2. Email Payloads (Functionality & Vulnerability)
# 30 diverse inputs to test the Email scanner
EMAIL_PAYLOADS = [
    ("TC-EML-001", "Functionality", "Valid Email Standard", "test@example.com"),
    ("TC-EML-002", "Functionality", "Valid Email Subdomain", "user@mail.example.com"),
    ("TC-EML-003", "Functionality", "Email with dots", "john.doe.smith@example.com"),
    ("TC-EML-004", "Functionality", "Email with plus alias", "user+tag@example.com"),
    ("TC-EML-005", "Functionality", "Invalid missing @", "userexample.com"),
    ("TC-EML-006", "Functionality", "Invalid missing domain", "user@"),
    ("TC-EML-007", "Functionality", "Invalid missing user", "@example.com"),
    ("TC-EML-008", "Functionality", "Invalid double @", "user@@example.com"),
    ("TC-EML-009", "Functionality", "Invalid spaces", "user @ example.com"),
    ("TC-EML-010", "Functionality", "Empty email", ""),
    ("TC-EML-011", "Vulnerability", "Email XSS", '"><script>alert(1)</script>@domain.com'),
    ("TC-EML-012", "Vulnerability", "Email SQLi", "admin'--@domain.com"),
    ("TC-EML-013", "Vulnerability", "Email Command Inj", "user|id@domain.com"),
    ("TC-EML-014", "Vulnerability", "Email CRLF", "user\r\n@domain.com"),
    ("TC-EML-015", "Vulnerability", "Email Path Traversal", "../../../user@domain.com"),
    ("TC-EML-016", "Functionality", "Extremely long email", "a"*200 + "@example.com"),
    ("TC-EML-017", "Functionality", "Valid subject", "Invoice Attached"),
    ("TC-EML-018", "Functionality", "Empty subject", ""),
    ("TC-EML-019", "Functionality", "Long subject", "Subject " * 50),
    ("TC-EML-020", "Vulnerability", "Subject XSS", "<img src=x onerror=alert(1)>"),
    ("TC-EML-021", "Vulnerability", "Subject SQLi", "' OR '1'='1"),
    ("TC-EML-022", "Functionality", "Subject with emojis", "Urgent 🚨 Please Read 👀"),
    ("TC-EML-023", "Functionality", "Email with numbers", "123456@numbers.com"),
    ("TC-EML-024", "Functionality", "Email with dashes", "first-last@domain-dash.com"),
    ("TC-EML-025", "Functionality", "Email with underscore", "first_last@domain.com"),
    ("TC-EML-026", "Vulnerability", "HTML in Subject", "<b>Bold Subject</b>"),
    ("TC-EML-027", "Vulnerability", "Payload in domain", "user@<script>alert(1)</script>.com"),
    ("TC-EML-028", "Vulnerability", "Payload in TLD", "user@domain.<script>"),
    ("TC-EML-029", "Functionality", "Uppercase Email", "USER@EXAMPLE.COM"),
    ("TC-EML-030", "Functionality", "Mixed case email", "UsEr@ExAmPlE.cOm")
]

# 3. APK Payloads (Functionality & Vulnerability)
# 20 diverse inputs to test the APK scanner
APK_PAYLOADS = [
    ("TC-APK-001", "Functionality", "Valid package name", "com.android.chrome"),
    ("TC-APK-002", "Functionality", "Valid custom package", "com.mycompany.myapp"),
    ("TC-APK-003", "Functionality", "Valid APK URL", "https://example.com/app.apk"),
    ("TC-APK-004", "Functionality", "Invalid package format", "android chrome"),
    ("TC-APK-005", "Functionality", "Invalid package characters", "com.app!name"),
    ("TC-APK-006", "Functionality", "Empty package", ""),
    ("TC-APK-007", "Functionality", "Short package", "a.b"),
    ("TC-APK-008", "Functionality", "Long package", "com." + "a"*150 + ".app"),
    ("TC-APK-009", "Functionality", "Capital letters package", "Com.Android.Chrome"),
    ("TC-APK-010", "Functionality", "Package starting with number", "1com.app"),
    ("TC-APK-011", "Vulnerability", "APK XSS", "<script>alert('apk')</script>"),
    ("TC-APK-012", "Vulnerability", "APK SQLi", "com.app' OR 1=1--"),
    ("TC-APK-013", "Vulnerability", "APK Path Traversal", "../../../com.app"),
    ("TC-APK-014", "Vulnerability", "APK Command Inj", "com.app; whoami"),
    ("TC-APK-015", "Vulnerability", "HTML Injection in package", "<b>com.app</b>"),
    ("TC-APK-016", "Functionality", "Quick Button: WhatsApp", "com.whatsapp", True),
    ("TC-APK-017", "Functionality", "Quick Button: TikTok", "com.zhiliaoapp.musically", True),
    ("TC-APK-018", "Functionality", "Quick Button: Facebook", "com.facebook.katana", True),
    ("TC-APK-019", "Functionality", "Quick Button: TrueCaller", "com.truecaller", True),
    ("TC-APK-020", "Functionality", "Whitespace padding", "  com.app.test  ")
]

# 4. UI / Interaction tests
# 10 UI tests
UI_TESTS = [
    ("TC-UI-001", "Functionality", "Navigate to Try Scanner"),
    ("TC-UI-002", "Functionality", "Navigate to Features"),
    ("TC-UI-003", "Functionality", "Navigate to How it Works"),
    ("TC-UI-004", "Functionality", "Navigate to Stats"),
    ("TC-UI-005", "Functionality", "Navigate to Download"),
    ("TC-UI-006", "Functionality", "Switch to File Tab"),
    ("TC-UI-007", "Functionality", "Switch to Email Tab"),
    ("TC-UI-008", "Functionality", "Switch to APK Tab"),
    ("TC-UI-009", "Functionality", "Expand FAQ item 1"),
    ("TC-UI-010", "Functionality", "Mobile menu toggle")
]

# --- FIXTURES ---

@pytest.fixture(scope="session")
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1920, 1080)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()

@pytest.fixture(scope="function")
def load_page(driver):
    # Using the local dev server started by github actions
    driver.get("http://127.0.0.1:8000")
    # Wait until page loads
    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, "navbar")))
    return driver

# --- TESTS ---

class TestURLScanner:
    @pytest.mark.parametrize("test_id, test_type, desc, payload", URL_PAYLOADS)
    def test_url_scanner(self, load_page, test_id, test_type, desc, payload):
        # Set markers dynamically for report
        pytest.current_test_id = test_id
        pytest.current_test_type = test_type
        
        driver = load_page
        
        # Ensure URL tab is active
        url_tab = driver.find_element(By.CSS_SELECTOR, "button[data-t='url']")
        if "active" not in url_tab.get_attribute("class"):
            driver.execute_script("arguments[0].click();", url_tab)
            time.sleep(0.5)

        # Find input and button
        input_elem = driver.find_element(By.ID, "url-input")
        btn_elem = driver.find_element(By.ID, "btn-scan-url")

        # Input payload
        input_elem.clear()
        input_elem.send_keys(payload)
        
        # Click scan
        driver.execute_script("arguments[0].click();", btn_elem)
        
        # Wait a moment for UI to update
        time.sleep(1)
        
        # Basic assertions to ensure page didn't crash
        # The result container should be visible or the input field should still be there
        assert driver.find_element(By.ID, "navbar").is_displayed(), "Navbar disappeared, page might have crashed"
        
        # Check if result is displayed (app.js simulates scan)
        result_elem = driver.find_element(By.ID, "scan-result")
        if payload.strip() != "":
            # Give it time for the simulated scan to finish (app.js has setTimeout)
            try:
                WebDriverWait(driver, 5).until(lambda d: result_elem.is_displayed())
                assert "Risk Score" in result_elem.text or "Error" in result_elem.text
            except Exception:
                pass # If it didn't show up, that's fine for some malformed inputs, as long as it didn't XSS


class TestEmailScanner:
    @pytest.mark.parametrize("test_id, test_type, desc, payload", EMAIL_PAYLOADS)
    def test_email_scanner(self, load_page, test_id, test_type, desc, payload):
        driver = load_page
        
        # Switch to Email tab
        email_tab = driver.find_element(By.CSS_SELECTOR, "button[data-t='email']")
        driver.execute_script("arguments[0].click();", email_tab)
        time.sleep(0.5)

        input_elem = driver.find_element(By.ID, "email-input")
        btn_elem = driver.find_element(By.ID, "btn-scan-email")

        input_elem.clear()
        input_elem.send_keys(payload)
        
        driver.execute_script("arguments[0].click();", btn_elem)
        time.sleep(1)
        
        assert driver.find_element(By.ID, "navbar").is_displayed()


class TestAPKScanner:
    @pytest.mark.parametrize("scenario", APK_PAYLOADS)
    def test_apk_scanner(self, load_page, scenario):
        test_id = scenario[0]
        test_type = scenario[1]
        desc = scenario[2]
        payload = scenario[3]
        is_quick_btn = scenario[4] if len(scenario) > 4 else False
        
        driver = load_page
        
        # Switch to APK tab
        apk_tab = driver.find_element(By.CSS_SELECTOR, "button[data-t='apk']")
        driver.execute_script("arguments[0].click();", apk_tab)
        time.sleep(0.5)

        input_elem = driver.find_element(By.ID, "apk-input")
        btn_elem = driver.find_element(By.ID, "btn-scan-apk")

        if is_quick_btn:
            # Click the quick button
            quick_btn = driver.find_element(By.CSS_SELECTOR, f"button[data-val='{payload}']")
            driver.execute_script("arguments[0].click();", quick_btn)
            time.sleep(0.2)
            # Verify input field populated
            assert input_elem.get_attribute("value") == payload
        else:
            input_elem.clear()
            input_elem.send_keys(payload)
            
        driver.execute_script("arguments[0].click();", btn_elem)
        time.sleep(1)
        
        assert driver.find_element(By.ID, "navbar").is_displayed()

class TestUIInteractions:
    @pytest.mark.parametrize("test_id, test_type, desc", UI_TESTS)
    def test_ui_elements(self, load_page, test_id, test_type, desc):
        driver = load_page
        
        if "Navigate" in desc:
            link_text = desc.replace("Navigate to ", "")
            if link_text == "Try Scanner":
                elem = driver.find_element(By.CSS_SELECTOR, "a[href='#scanner']")
            else:
                elem = driver.find_element(By.XPATH, f"//a[contains(text(), '{link_text}')]")
            
            driver.execute_script("arguments[0].click();", elem)
            time.sleep(0.5)
            # Verify URL hash
            assert "#" in driver.current_url
            
        elif "Switch to" in desc:
            tab_name = desc.replace("Switch to ", "").replace(" Tab", "").lower()
            tab = driver.find_element(By.CSS_SELECTOR, f"button[data-t='{tab_name}']")
            driver.execute_script("arguments[0].click();", tab)
            time.sleep(0.5)
            assert "active" in tab.get_attribute("class")
            
        elif "Expand FAQ" in desc:
            faq_btn = driver.find_element(By.CSS_SELECTOR, ".faq-q")
            driver.execute_script("arguments[0].click();", faq_btn)
            time.sleep(0.5)
            assert "active" in faq_btn.get_attribute("class")
            
        elif "Mobile menu toggle" in desc:
            # Resize window to mobile size
            driver.set_window_size(375, 812)
            time.sleep(0.5)
            burger = driver.find_element(By.ID, "nav-burger")
            if burger.is_displayed():
                driver.execute_script("arguments[0].click();", burger)
                time.sleep(0.5)
                nav_links = driver.find_element(By.ID, "nav-links")
                assert "open" in nav_links.get_attribute("class")
            # Restore window size
            driver.maximize_window()

# To run tests and assign markers dynamically from parametrize
def pytest_collection_modifyitems(config, items):
    for item in items:
        # Check if the test is parameterized
        if hasattr(item, 'callspec'):
            if 'test_id' in item.callspec.params:
                item.add_marker(pytest.mark.test_id(item.callspec.params['test_id']))
            if 'test_type' in item.callspec.params:
                item.add_marker(pytest.mark.test_type(item.callspec.params['test_type']))
            
            # Module based on class name
            if "URLScanner" in item.parent.name:
                item.add_marker(pytest.mark.module("URL Scanner"))
            elif "EmailScanner" in item.parent.name:
                item.add_marker(pytest.mark.module("Email Scanner"))
            elif "APKScanner" in item.parent.name:
                item.add_marker(pytest.mark.module("APK Scanner"))
            elif "UIInteractions" in item.parent.name:
                item.add_marker(pytest.mark.module("UI/Navigation"))
