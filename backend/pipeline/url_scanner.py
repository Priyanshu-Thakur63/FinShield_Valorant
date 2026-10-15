import re
import urllib.parse
import socket
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup

# Comprehensive verified legitimate domains for financial institutions and popular services
VERIFIED_LEGITIMATE_DOMAINS = {
    "sbi.co.in": "State Bank of India (SBI)",
    "onlinesbi.sbi": "State Bank of India (SBI)",
    "retail.onlinesbi.sbi": "State Bank of India (SBI)",
    "sbi.bank.in": "State Bank of India (SBI)",
    "sbicard.com": "SBI Card",
    "hdfcbank.com": "HDFC Bank",
    "hdfc.com": "HDFC",
    "icicibank.com": "ICICI Bank",
    "infinity.icicibank.com": "ICICI Bank NetBanking",
    "axisbank.com": "Axis Bank",
    "axis.com": "Axis Bank",
    "kotak.com": "Kotak Mahindra Bank",
    "kotakbank.com": "Kotak Mahindra Bank",
    "pnbindia.in": "Punjab National Bank",
    "bankofbaroda.in": "Bank of Baroda",
    "bankofbaroda.com": "Bank of Baroda",
    "canarabank.com": "Canara Bank",
    "unionbankofindia.co.in": "Union Bank of India",
    "rbi.org.in": "Reserve Bank of India (RBI)",
    "npci.org.in": "National Payments Corporation of India (NPCI)",
    "paytm.com": "Paytm",
    "phonepe.com": "PhonePe",
    "bhimupi.org.in": "BHIM UPI",
    "google.com": "Google",
    "google.co.in": "Google India",
    "pay.google.com": "Google Pay",
    "paypal.com": "PayPal",
    "amazon.in": "Amazon India",
    "amazon.com": "Amazon",
    "apple.com": "Apple",
    "microsoft.com": "Microsoft",
    "incometax.gov.in": "Income Tax Department",
    "nsdl.co.in": "NSDL",
    "uidai.gov.in": "UIDAI / Aadhaar",
    "india.gov.in": "National Portal of India",
    "github.com": "GitHub",
    "reddit.com": "Reddit",
    "facebook.com": "Facebook",
    "instagram.com": "Instagram",
    "twitter.com": "X (Twitter)",
    "x.com": "X (Twitter)",
    "telegram.org": "Telegram",
    "t.me": "Telegram Messenger",
    "whatsapp.com": "WhatsApp",
    "wa.me": "WhatsApp Link",
}

# Monitored brand keywords and their official parent domains
BRAND_KEYWORD_RULES = [
    {
        "brand": "State Bank of India (SBI)",
        "keywords": ["sbi", "onlinesbi", "statebank"],
        "official_domains": ["sbi.co.in", "onlinesbi.sbi", "sbi.bank.in", "sbicard.com"]
    },
    {
        "brand": "HDFC Bank",
        "keywords": ["hdfc", "hdfcbank", "hdfc-bank"],
        "official_domains": ["hdfcbank.com", "hdfc.com"]
    },
    {
        "brand": "ICICI Bank",
        "keywords": ["icici", "icicibank", "icici-bank"],
        "official_domains": ["icicibank.com"]
    },
    {
        "brand": "Axis Bank",
        "keywords": ["axisbank", "axis-bank"],
        "official_domains": ["axisbank.com", "axis.com"]
    },
    {
        "brand": "Kotak Mahindra Bank",
        "keywords": ["kotak", "kotakbank"],
        "official_domains": ["kotak.com", "kotakbank.com"]
    },
    {
        "brand": "Punjab National Bank (PNB)",
        "keywords": ["pnbindia", "pnb-bank"],
        "official_domains": ["pnbindia.in"]
    },
    {
        "brand": "Reserve Bank of India (RBI)",
        "keywords": ["rbi", "reservebank"],
        "official_domains": ["rbi.org.in"]
    },
    {
        "brand": "Paytm Payments",
        "keywords": ["paytm", "paytm-kyc"],
        "official_domains": ["paytm.com", "paytmbank.com"]
    },
    {
        "brand": "PhonePe",
        "keywords": ["phonepe", "phone-pe"],
        "official_domains": ["phonepe.com"]
    },
    {
        "brand": "PayPal",
        "keywords": ["paypal", "pay-pal"],
        "official_domains": ["paypal.com", "paypal.me"]
    },
    {
        "brand": "Govt Tax & Aadhaar Portal",
        "keywords": ["incometax", "pan-card", "pancard", "aadhaar", "uidai"],
        "official_domains": ["incometax.gov.in", "nsdl.co.in", "uidai.gov.in"]
    }
]

# High-risk / disposable Top-Level Domains (commonly used by bulk phishing campaigns)
HIGH_RISK_TLDS = {
    ".xyz", ".top", ".click", ".buzz", ".club", ".tk", ".ml", ".ga",
    ".cf", ".gq", ".work", ".fit", ".vip", ".icu", ".sbs", ".cc",
    ".cam", ".live", ".guru", ".rest", ".monster", ".quest", ".cfd",
    ".bar", ".site", ".online", ".website", ".cyou", ".casa", ".space"
}

# Known URL shorteners that mask malicious landing destinations
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "is.gd", "rb.gy", "cutt.ly", "t.co",
    "ow.ly", "rebrand.ly", "shorturl.at", "bl.ink", "hyperurl.co"
}

# Suspicious path & query keywords that indicate credential harvesting or lures
SUSPICIOUS_PATH_KEYWORDS = [
    "kyc", "kyc-update", "pan-link", "update-pan", "login", "signin",
    "verify", "netbanking", "ebanking", "account-unlock", "claim-reward",
    "redeem", "lottery", "instant-loan", "reward-points", "otp",
    "card-verify", "cvv", "banking-portal", "gift-cash", "double-money"
]

def is_ip_address(hostname: str) -> bool:
    """Checks whether the hostname is a direct IPv4 or IPv6 address."""
    clean_host = hostname.split(":")[0].strip("[]")
    try:
        socket.inet_aton(clean_host)
        return True
    except socket.error:
        return False

def extract_registered_domain(hostname: str) -> str:
    """Extracts the base domain (e.g. 'sub.example.com' -> 'example.com')."""
    parts = hostname.lower().split(".")
    if len(parts) >= 3 and parts[-2] in ["co", "com", "org", "net", "gov", "ac", "bank", "res"] and len(parts[-1]) <= 3:
        return ".".join(parts[-3:])
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return hostname.lower()

def probe_url_content(url: str, timeout_seconds: float = 3.5) -> Dict[str, Any]:
    """
    Safely probes the URL via HTTP GET using a lightweight browser User-Agent.
    Inspects response status, final destination (redirect detection), page title,
    and checks for sensitive form inputs (password, card, otp).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    probe_result = {
        "is_live": False,
        "http_status": None,
        "final_url": url,
        "page_title": "",
        "detected_forms": [],
        "redirect_chain": [],
        "page_cloned_brand": None,
        "has_sensitive_form": False
    }

    try:
        with httpx.Client(timeout=timeout_seconds, follow_redirects=True, headers=headers, verify=False) as client:
            resp = client.get(url)
            probe_result["is_live"] = True
            probe_result["http_status"] = resp.status_code
            probe_result["final_url"] = str(resp.url)
            
            # Check redirect history
            if resp.history:
                probe_result["redirect_chain"] = [str(r.url) for r in resp.history] + [str(resp.url)]
            
            html = resp.text[:100000] # Inspect first 100KB
            soup = BeautifulSoup(html, "html.parser")
            
            # Extract title
            title_tag = soup.find("title")
            if title_tag and title_tag.string:
                probe_result["page_title"] = title_tag.string.strip()[:150]
                
            # Inspect Form Inputs
            forms = soup.find_all("form")
            form_signals = []
            
            inputs = soup.find_all(["input", "select", "textarea"])
            for inp in inputs:
                inp_type = (inp.get("type") or "").lower()
                inp_name = (inp.get("name") or "").lower()
                inp_id = (inp.get("id") or "").lower()
                inp_placeholder = (inp.get("placeholder") or "").lower()
                combined_field = f"{inp_type} {inp_name} {inp_id} {inp_placeholder}"
                
                if inp_type == "password" or "password" in combined_field or "pin" in combined_field:
                    if "Password/PIN Input Field" not in form_signals:
                        form_signals.append("Password/PIN Input Field")
                if any(k in combined_field for k in ["card", "debit", "credit", "cc_num"]):
                    if "Card Number Field" not in form_signals:
                        form_signals.append("Card Number Field")
                if any(k in combined_field for k in ["cvv", "cvc", "security_code"]):
                    if "CVV/CVC Code Field" not in form_signals:
                        form_signals.append("CVV/CVC Code Field")
                if any(k in combined_field for k in ["otp", "one_time_password", "token"]):
                    if "OTP/Token Submission Field" not in form_signals:
                        form_signals.append("OTP/Token Submission Field")
                if any(k in combined_field for k in ["pan", "aadhaar", "ssn"]):
                    if "Govt ID (PAN/Aadhaar) Field" not in form_signals:
                        form_signals.append("Govt ID (PAN/Aadhaar) Field")
                if any(k in combined_field for k in ["upi", "vpa", "upi_id"]):
                    if "UPI ID Input Field" not in form_signals:
                        form_signals.append("UPI ID Input Field")
                        
            probe_result["detected_forms"] = form_signals
            probe_result["has_sensitive_form"] = len(form_signals) > 0
            
            # Check if page body mimics bank branding
            lower_body = html.lower()
            for rule in BRAND_KEYWORD_RULES:
                brand_name = rule["brand"]
                for kw in rule["keywords"]:
                    if kw in lower_body and len(kw) > 3:
                        probe_result["page_cloned_brand"] = brand_name
                        break
    except Exception:
        # Domain unreachable, timeout, or DNS failure
        probe_result["is_live"] = False

    return probe_result

def scan_url(url: str, probe_live: bool = True) -> Dict[str, Any]:
    """
    Core URL Scanner & Phishing Classifier.
    Evaluates:
    - Domain structure & TLD risk
    - Whitelist validation
    - Brand impersonation & typosquatting
    - URL shortener cloaking
    - Path and credential keyword density
    - Live HTTP inspection (forms, titles, redirects)
    
    Returns structured analysis with classification: 'LEGITIMATE', 'SUSPICIOUS', or 'PHISHING'.
    """
    raw_url = (url or "").strip()
    if not raw_url:
        return {
            "url": "",
            "classification": "LEGITIMATE",
            "risk_score": 0,
            "verdict": "Empty URL provided",
            "signals": []
        }
        
    # Ensure scheme
    if not re.match(r'^[a-zA-Z]+://', raw_url):
        clean_url = "https://" + raw_url
    else:
        clean_url = raw_url

    parsed = urllib.parse.urlparse(clean_url)
    hostname = (parsed.hostname or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    full_path = (path + "?" + query).lower()
    
    registered_domain = extract_registered_domain(hostname)
    signals: List[Dict[str, Any]] = []
    risk_score = 0
    target_brand: Optional[str] = None
    
    # --- 1. Whitelist Verification ---
    is_whitelisted = False
    whitelisted_entity = None
    for dom, entity in VERIFIED_LEGITIMATE_DOMAINS.items():
        if hostname == dom or hostname.endswith("." + dom):
            is_whitelisted = True
            whitelisted_entity = entity
            break
            
    if is_whitelisted:
        # If it's a known whitelisted domain, check if it's a legitimate official portal
        # Whitelisted domains have minimal baseline risk unless path has malicious sub-traversal
        return {
            "url": clean_url,
            "domain": hostname,
            "registered_domain": registered_domain,
            "classification": "LEGITIMATE",
            "risk_score": 5,
            "target_brand": whitelisted_entity,
            "is_whitelisted": True,
            "signals": [{
                "rule": "OFFICIAL_DOMAIN_VERIFIED",
                "severity": "safe",
                "description": f"Domain is an authentic, verified official portal for {whitelisted_entity}."
            }],
            "is_live": True,
            "http_status": 200,
            "page_title": f"{whitelisted_entity} Official Portal",
            "detected_forms": [],
            "redirect_chain": [],
            "recommendation": f"Verified safe. Authenticated destination for {whitelisted_entity}.",
            "technical_details": {
                "protocol": parsed.scheme.upper(),
                "hostname": hostname,
                "registered_domain": registered_domain,
                "path": path,
                "is_ip_address": False
            }
        }

    # --- 2. Protocol Check ---
    if parsed.scheme.lower() == "http":
        risk_score += 18
        signals.append({
            "rule": "INSECURE_HTTP_PROTOCOL",
            "severity": "medium",
            "description": "Uses unencrypted HTTP protocol without SSL/TLS security encryption."
        })

    # --- 3. IP Hostname Check ---
    if is_ip_address(hostname):
        risk_score += 48
        signals.append({
            "rule": "RAW_IP_HOSTNAME",
            "severity": "critical",
            "description": f"Host is a raw numerical IP address ({hostname}) rather than a registered domain name."
        })

    # --- 4. Brand Impersonation & Typosquatting Detection ---
    brand_impersonated = False
    for rule in BRAND_KEYWORD_RULES:
        brand = rule["brand"]
        official_domains = rule["official_domains"]
        keywords = rule["keywords"]
        
        # Check if brand keyword is in hostname or path
        has_kw_in_host = any(kw in hostname for kw in keywords)
        has_kw_in_path = any(kw in full_path for kw in keywords)
        
        is_official = any(hostname == off or hostname.endswith("." + off) for off in official_domains)
        
        if (has_kw_in_host or has_kw_in_path) and not is_official:
            brand_impersonated = True
            target_brand = brand
            weight = 65 if has_kw_in_host else 40
            risk_score += weight
            signals.append({
                "rule": "BRAND_IMPERSONATION_SPOOF",
                "severity": "critical",
                "description": f"Impersonates {brand} on an unauthorized, non-official domain ({hostname})."
            })
            break

    # --- 5. High-Risk TLD Detection ---
    for tld in HIGH_RISK_TLDS:
        if hostname.endswith(tld):
            risk_score += 32
            signals.append({
                "rule": "SUSPICIOUS_HIGH_RISK_TLD",
                "severity": "high",
                "description": f"Utilizes high-risk TLD '{tld}' frequently abused by disposable phishing campaigns."
            })
            break

    # --- 6. URL Shortener Masking ---
    is_shortener = any(hostname == s or hostname.endswith("." + s) for s in URL_SHORTENERS)
    if is_shortener:
        risk_score += 26
        signals.append({
            "rule": "URL_SHORTENER_CLOAK",
            "severity": "medium",
            "description": f"Uses URL shortening service ({hostname}) to disguise actual destination."
        })

    # --- 7. Suspicious Path Lure & Credential Keywords ---
    matched_path_kws = [kw for kw in SUSPICIOUS_PATH_KEYWORDS if kw in full_path]
    if matched_path_kws:
        added_risk = min(40, len(matched_path_kws) * 15)
        risk_score += added_risk
        signals.append({
            "rule": "CREDENTIAL_HARVESTING_PATH",
            "severity": "high" if len(matched_path_kws) > 1 else "medium",
            "description": f"URL path contains high-risk phishing/lure keywords: [{', '.join(matched_path_kws[:4])}]."
        })

    # --- 8. Subdomain Stacking / Obfuscation ---
    subdomain_parts = hostname.split(".")
    if len(subdomain_parts) > 4:
        risk_score += 24
        signals.append({
            "rule": "EXCESSIVE_SUBDOMAIN_STACKING",
            "severity": "medium",
            "description": f"Multiple layered subdomains detected ({len(subdomain_parts)} parts), typical in DNS evasions."
        })

    if "xn--" in hostname:
        risk_score += 45
        signals.append({
            "rule": "PUNYCODE_HOMOGRAPH_ATTACK",
            "severity": "critical",
            "description": "Punycode (IDN) detected in domain, indicative of visual character spoofing (homograph attack)."
        })

    # --- 9. Live Content & Form Scraper Inspection ---
    page_details = {
        "is_live": False,
        "http_status": None,
        "page_title": "",
        "detected_forms": [],
        "redirect_chain": []
    }
    
    if probe_live:
        live_probe = probe_url_content(clean_url)
        page_details["is_live"] = live_probe["is_live"]
        page_details["http_status"] = live_probe["http_status"]
        page_details["page_title"] = live_probe["page_title"]
        page_details["detected_forms"] = live_probe["detected_forms"]
        page_details["redirect_chain"] = live_probe["redirect_chain"]
        
        if live_probe["has_sensitive_form"]:
            risk_score += 35
            signals.append({
                "rule": "SENSITIVE_FORM_CREDENTIAL_PROMPT",
                "severity": "critical",
                "description": f"Active webpage contains input fields for: {', '.join(live_probe['detected_forms'])}."
            })
            
        if live_probe["page_cloned_brand"] and not target_brand:
            target_brand = live_probe["page_cloned_brand"]
            risk_score += 35
            signals.append({
                "rule": "PAGE_CONTENT_BRAND_CLONING",
                "severity": "critical",
                "description": f"HTML content displays branding & copy matching {live_probe['page_cloned_brand']} on an unauthorized host."
            })

    # --- 10. Classification Verdict Decision ---
    # Clamp score between 0 and 99
    risk_score = min(99, max(0, risk_score))
    
    if risk_score >= 65 or brand_impersonated or (page_details.get("detected_forms") and risk_score >= 50):
        classification = "PHISHING"
        recommendation = "MALICIOUS / PHISHING: Block access, report to CERT-In / bank anti-fraud, and add domain to threat watchlist."
    elif risk_score >= 35 or is_shortener:
        classification = "SUSPICIOUS"
        recommendation = "SUSPICIOUS / EVASIVE: Exercise caution. Destination may redirect to fraudulent or unverified payment gateway."
    else:
        classification = "LEGITIMATE"
        recommendation = "Standard web destination. No overt phishing or credential theft patterns identified."

    return {
        "url": clean_url,
        "domain": hostname,
        "registered_domain": registered_domain,
        "classification": classification,
        "risk_score": risk_score,
        "target_brand": target_brand or "General / Unspecified",
        "is_whitelisted": False,
        "signals": signals,
        "is_live": page_details["is_live"],
        "http_status": page_details["http_status"],
        "page_title": page_details["page_title"],
        "detected_forms": page_details["detected_forms"],
        "redirect_chain": page_details["redirect_chain"],
        "recommendation": recommendation,
        "technical_details": {
            "protocol": parsed.scheme.upper(),
            "hostname": hostname,
            "registered_domain": registered_domain,
            "path": path,
            "query": query,
            "is_ip_address": is_ip_address(hostname)
        }
    }
