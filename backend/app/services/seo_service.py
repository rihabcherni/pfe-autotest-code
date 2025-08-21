import http
import os
import time
from datetime import datetime
import socket
from urllib.parse import urljoin, urlparse
from collections import Counter
import requests
import nltk
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.util import ngrams
from sqlalchemy.orm import Session
from app.models.report import Report
from app.models.seo import SEOCrawledPage, SEOReportDetails

def initialize_nltk():
    try:
        try:
            nltk.data.find('tokenizers/punkt_tab')
        except LookupError:
            try:
                nltk.download('punkt_tab', quiet=True)
            except:
                nltk.download('punkt', quiet=True)
    
    except Exception as e:
        print(f"Warning: NLTK punkt tokenizer setup failed: {e}")
        
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords', quiet=True)
initialize_nltk()

MAX_PAGES = 100

def extract_keywords_from_text(text):
    try:
        words = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        words = [word for word in words if word.isalpha() and word not in stop_words]
        return Counter(words)
    except Exception as e:
        print(f"Error extracting keywords: {e}")
        words = text.lower().split()
        words = [word.strip('.,!?;:"()[]{}') for word in words if word.isalpha()]
        return Counter(words)

def extract_phrases_from_text(text, n=2):
    try:
        words = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        words = [word for word in words if word.isalpha() and word not in stop_words]
        n_grams = ngrams(words, n)
        return {" ".join(gram): count for gram, count in Counter(n_grams).items()}
    except Exception as e:
        print(f"Error extracting phrases: {e}")
        words = text.lower().split()
        words = [word.strip('.,!?;:"()[]{}') for word in words if word.isalpha()]
        if len(words) >= n:
            phrases = []
            for i in range(len(words) - n + 1):
                phrase = " ".join(words[i:i+n])
                phrases.append(phrase)
            return Counter(phrases)
        return {}

def get_domain(url):
    return urlparse(str(url)).netloc

def is_internal_link(link, base_url):
    parsed_link = urlparse(link)
    return parsed_link.netloc == '' or parsed_link.netloc == get_domain(base_url)

def fetch_and_parse(url, pages_404=None):
    if not url.startswith(('http://', 'https://')):
        print(f"Skipping non-HTTP URL: {url}")
        return None, None, None
    try:
        start_time = time.time()
        response = requests.get(url, timeout=10)
        if response.status_code == 404:
            print(f"404 Not Found for {url}")
            if pages_404 is not None:
                pages_404.append(url)
            return "404", None, None
        response.raise_for_status()
        load_time = round((time.time() - start_time) * 1000)
        soup = BeautifulSoup(response.text, "lxml")
        return soup, response, load_time
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None, None, None

def capture_screenshot(url):
    driver = None
    try:
        chrome_path = "C:\\Users\\Rihab-Cherni\\ZAP\\webdriver\\windows\\64\\chromedriver.exe"
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--disable-gpu')

        service = Service(chrome_path)
        driver = webdriver.Chrome(service=service, options=options)
        driver.get(url)
        
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )        
        screenshot_dir = os.path.join("static", "screenshots")
        os.makedirs(screenshot_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        domain = get_domain(url).replace('.', '_')
        filename = f"screenshot_{domain}_{timestamp}.png"
        filepath = os.path.join(screenshot_dir, filename)
        
        # Take screenshot
        driver.save_screenshot(filepath)
        print(f"Screenshot saved: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Error capturing screenshot for {url}: {e}")
        return None
    finally:
        if driver:
            try:
                driver.quit()
            except Exception as e:
                print(f"Error closing driver: {e}")

def analyze_page(url, pages_404=None):
    soup, response, load_time = fetch_and_parse(url, pages_404=pages_404)

    if soup == "404":
        return {"url": url, "error": "404 Not Found"}, []

    if not soup:
        return {"url": url, "error": "Failed to fetch page"}, []
    
    report = {'url': url}
    score = 100
    good = []
    bad = []

    report['load_time_ms'] = load_time
    report['html_size_kb'] = round(len(response.content) / 1024, 2)

    title_tag = soup.title.string.strip() if soup.title else None
    if title_tag:
        report['title'] = title_tag
        good.append("✅ Title tag is present")
    else:
        report['title'] = "❌ Missing <title> tag"
        bad.append("❌ Missing <title> tag")
        score -= 10

    meta_desc = soup.find("meta", attrs={"name": "description"})
    if meta_desc and 'content' in meta_desc.attrs:
        report['meta_description'] = meta_desc['content'].strip()
        good.append("✅ Meta description is set")
    else:
        report['meta_description'] = "❌ Missing meta description"
        bad.append("❌ Missing meta description")
        score -= 10

    for i in range(1, 7):
        h_tags = [h.get_text(strip=True) for h in soup.find_all(f"h{i}")]
        count = len(h_tags)
        report[f"h{i}_tags"] = h_tags if count > 0 else [f"❌ No <h{i}> tags found"]
        if count > 0:
            good.append(f"✅ {count} <h{i}> tag(s) found")
        else:
            bad.append(f"❌ No <h{i}> tag found")
            score -= 5

    canonical = soup.find("link", rel="canonical")
    if canonical:
        report['canonical'] = canonical['href']
        good.append("✅ Canonical tag is defined")
    else:
        report['canonical'] = "❌ Missing canonical tag"
        bad.append("❌ No canonical tag found")
        score -= 5

    images = soup.find_all("img")
    missing_alt = [img.get('src') for img in images if not img.get('alt')]
    if not missing_alt:
        report['images_missing_alt'] = "✅ All images have alt attributes"
        good.append("✅ All images have alt tags")
    else:
        report['images_missing_alt'] = missing_alt
        bad.append(f"❌ {len(missing_alt)} images missing alt attributes")
        score -= 5

    robots = soup.find("meta", attrs={"name": "robots"})
    if robots:
        report['robots'] = robots['content']
        good.append("✅ Robots meta tag is present")
    else:
        report['robots'] = "⚠️ No robots meta tag"
        bad.append("⚠️ No robots meta tag")
        score -= 2

    favicon = soup.find("link", rel=lambda x: x and 'icon' in x)
    if favicon:
        report['favicon'] = favicon['href']
        good.append("✅ Favicon is present")
    else:
        report['favicon'] = "❌ Missing favicon"
        bad.append("❌ No favicon")
        score -= 3

    links = [a['href'] for a in soup.find_all("a", href=True)]
    valid_links = [link for link in links if link.startswith(('http://', 'https://', '/'))]

    internal_links = [urljoin(url, link) for link in valid_links if is_internal_link(link, url)]
    external_links = [link for link in valid_links if not is_internal_link(link, url)]

    report['internal_links'] = len(internal_links)
    report['external_links'] = len(external_links)
    report['seo_score'] = max(score, 0)
    report['grade'] = "A+" if score >= 90 else "B" if score >= 80 else "C" if score >= 70 else "D" if score >= 60 else "E"
    report['good_practices'] = good
    report['bad_practices'] = bad

    return report, internal_links

def get_server_info(url):
    parsed_url = urlparse(url)
    hostname = parsed_url.netloc
    use_https = parsed_url.scheme == "https"

    try:
        ip = socket.gethostbyname(hostname)
        conn = http.client.HTTPSConnection(hostname, timeout=5) if use_https else http.client.HTTPConnection(hostname, timeout=5)
        conn.request("HEAD", "/")
        res = conn.getresponse()
        headers = dict(res.getheaders())

        server = headers.get("Server", "")
        powered_by = headers.get("X-Powered-By", "")
        set_cookie = headers.get("Set-Cookie", "")
        technologies = []
        frontend_tech = []
        cms = ""
        os_info = ""

        # Combine all header information for analysis
        header_data = f"{server} {powered_by} {set_cookie}".lower()

        tech_signatures = {
            "php": "PHP", 
            "asp": "ASP.NET", 
            "express": "Node.js (Express)", 
            "node": "Node.js",
            "python": "Python", 
            "django": "Django", 
            "laravel": "Laravel", 
            "ruby": "Ruby",
            "rails": "Ruby on Rails", 
            "java": "Java", 
            "spring": "Spring Boot", 
            "dotnet": ".NET Core",
            "go": "Go", 
            "nestjs": "NestJS", 
            "wordpress": "WordPress", 
            "strapi": "Strapi",
            "flask": "Flask", 
            "symfony": "Symfony"
        }

        cms_signatures = {
            "wordpress": "WordPress", 
            "wp-": "WordPress", 
            "joomla": "Joomla",
            "drupal": "Drupal", 
            "prestashop": "PrestaShop", 
            "magento": "Magento",
            "shopify": "Shopify", 
            "strapi": "Strapi", 
            "wix": "Wix", 
            "squarespace": "Squarespace"
        }

        frontend_signatures = {
            "react": "React", 
            "vue": "Vue.js", 
            "angular": "Angular",
            "svelte": "Svelte", 
            "jquery": "jQuery", 
            "bootstrap": "Bootstrap",
            "tailwind": "Tailwind CSS", 
            "next": "Next.js", 
            "nuxt": "Nuxt.js"
        }

        # Detect backend technologies
        for signature, tech_name in tech_signatures.items():
            if signature in header_data:
                if tech_name not in technologies:  # Avoid duplicates
                    technologies.append(tech_name)

        # Detect CMS
        for signature, cms_name in cms_signatures.items():
            if signature in header_data:
                cms = cms_name
                break

        # Detect OS from server header
        server_lower = server.lower()
        if "linux" in server_lower:
            os_info = "Linux"
        elif "win" in server_lower:
            os_info = "Windows"
        elif "unix" in server_lower:
            os_info = "Unix"
        elif "ubuntu" in server_lower:
            os_info = "Ubuntu"
        elif "debian" in server_lower:
            os_info = "Debian"

        # Try to get HTML content for frontend detection
        try:
            html_response = requests.get(url, timeout=5)
            html_content = html_response.text
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Get script and CSS links
            script_links = [s.get("src", "") for s in soup.find_all("script") if s.get("src")]
            css_links = [l.get("href", "") for l in soup.find_all("link", rel="stylesheet") if l.get("href")]
            
            # Combine all frontend-related content
            all_frontend_content = " ".join(script_links + css_links + [html_content]).lower()
            
            # Detect frontend technologies
            for signature, tech_name in frontend_signatures.items():
                if signature in all_frontend_content:
                    if tech_name not in frontend_tech:  # Avoid duplicates
                        frontend_tech.append(tech_name)
                        
        except Exception as e:
            print(f"Could not retrieve HTML info: {e}")

        return {
            "server": server,
            "ip": ip,
            "hostname": hostname,
            "x_powered_by": powered_by,
            "set_cookie": set_cookie,
            "backend": technologies, 
            "frontend": frontend_tech,  
            "os": os_info,
            "cms": cms,
            "raw_headers": headers
        }

    except Exception as e:
        print(f"Error retrieving server information: {e}")
        return {
            "error": str(e), 
            "hostname": hostname,
            "backend": [],
            "frontend": [],
            "server": "",
            "ip": "",
            "os": "",
            "cms": ""
        }

def run_seo_analysis(report_id: int, url: str, db: Session):
    try:
        report = db.query(Report).filter(Report.id == report_id).first()
        report.scan_started_at = datetime.now() 
        report.status = "running"
        db.commit()

        pages_404 = []
        
        main_page_report, internal_links = analyze_page(url, pages_404=pages_404)
        if pages_404:
            print("404 pages detected:", pages_404)
        server_info = get_server_info(url)
        
        screenshot = capture_screenshot(url)
        
        processed_pages = [main_page_report]
        pages_404 = []
        all_text = main_page_report.get('title', '') + ' ' + main_page_report.get('meta_description', '')
        
        links_to_process = internal_links[:min(20, len(internal_links))]  
        
        for link in links_to_process:
            try:
                page_report, _ = analyze_page(link, pages_404=pages_404)
                if page_report:
                    processed_pages.append(page_report)
                    all_text += ' ' + page_report.get('title', '') + ' ' + page_report.get('meta_description', '')
            except Exception as e:
                print(f"Error analyzing page {link}: {e}")
                pages_404.append(link)        
        
        keywords = extract_keywords_from_text(all_text)
        keywords_json = {k: v for k, v in keywords.most_common(20)} 
        
        phrases = extract_phrases_from_text(all_text)
        phrases_json = {k: v for k, v in sorted(phrases.items(), key=lambda x: x[1], reverse=True)[:20]}        
        
        total_score = sum(page.get('seo_score', 0) for page in processed_pages)
        average_score = total_score / len(processed_pages) if processed_pages else 0
        
        seo_report = SEOReportDetails(
            report_id=report_id,
            average_score=average_score,
            total_pages_analyzed=len(processed_pages),
            screenshot=screenshot,
            server_ip=server_info.get("ip", ""),
            server_os=server_info.get("os", ""),
            server_software=server_info.get("server", ""),
            server_backend=server_info.get("backend", []),
            server_frontend=server_info.get("frontend", []),
            server_cms=server_info.get("cms", ""),
            keywords=keywords_json,
            phrases=phrases_json,
            pages_404=pages_404
        )
        
        db.add(seo_report)
        db.commit()
        db.refresh(seo_report)
        
        for page_data in processed_pages:
            crawled_page = SEOCrawledPage(
                seo_report_id=seo_report.id,
                url=page_data.get("url", ""),
                title=page_data.get("title", ""),
                meta_description=page_data.get("meta_description", ""),
                load_time_ms=page_data.get("load_time_ms"),
                html_size_kb=page_data.get("html_size_kb"),
                canonical=page_data.get("canonical", ""),
                robots=page_data.get("robots", ""),
                favicon=page_data.get("favicon", ""),
                internal_links_count=page_data.get("internal_links", 0),
                external_links_count=page_data.get("external_links", 0),
                seo_score=page_data.get("seo_score", 0),
                grade=page_data.get("grade", ""),
                good_practices=page_data.get("good_practices", []),
                bad_practices=page_data.get("bad_practices", []),
                header_tags={
                    k: v for k, v in page_data.items() 
                    if k.startswith("h") and k.endswith("_tags")
                },
                images_missing_alt=(
                    page_data.get("images_missing_alt", []) 
                    if isinstance(page_data.get("images_missing_alt"), list) 
                    else []
                )
            )
            db.add(crawled_page)        
        
        report.scan_finished_at = datetime.now()
        report.status = "completed"
        db.commit()
        
    except Exception as e:
        report = db.query(Report).filter(Report.id == report_id).first()
        report.status = "failed"
        report.error_message = str(e)[:255]  
        db.commit()
        print(f"Error in SEO analysis: {e}")