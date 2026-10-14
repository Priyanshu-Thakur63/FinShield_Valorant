import re
from typing import Dict, List, Any

SUSPICIOUS_PHRASES = {
    'sell your account': 34,
    'bank accounts available': 32,
    'mule account': 36,
    'rent account': 30,
    'current account': 22,
    'cheque book': 18,
    'no paperwork': 24,
    'instant transfer': 20,
    'pre-activated': 26,
    'atm cards available': 26,
    'credit cards available': 24,
    'debit cards available': 24,
    'full access': 16,
    'earn up to': 14,
    'encrypted payment': 18,
    'crypto task': 22,
    'part-time task': 20,
    'daily return': 22,
    'guaranteed profit': 25,
    'without pan': 28,
    'without cibil': 28,
    'instant loan': 20,
    'telegram for details': 15,
    'investment scam': 35,
    'scam': 22,
    'phishing': 26,
    'fraud': 28,
    'wire transfer': 24,
    'unauthorized transaction': 30,
    'transfers out of my bank': 32,
    'gift card': 25,
    'fake email': 22,
    'crypto': 15,
}

TAG_RULES = [
    (['bank account', 'sell your account', 'rent account', 'current account', 'cheque book', 'mule'], 'Bank account sale'),
    (['instant transfer', 'fast transfer', 'immediate payout'], 'Instant transfer'),
    (['atm card', 'debit card', 'credit card', 'cards available'], 'Card credentials'),
    (['no paperwork', 'without pan', 'without cibil'], 'No paperwork KYC bypass'),
    (['earn up to', 'daily return', 'guaranteed profit', 'part-time task', 'crypto task'], 'Account recruitment / Task scam'),
    (['instant loan', 'personal loan assistance'], 'Unverified loan assistance'),
    (['investment scam', 'scam', 'fraud', 'phishing'], 'Fraud & Scam Scheme'),
    (['transfers out of my bank', 'wire transfer', 'unauthorized transaction'], 'Unauthorized Transfer / Theft'),
    (['gift card'], 'Gift Card Payment Coercion'),
]

def analyze_text(text: str, platform: str = "Unknown", source_url: str = "") -> Dict[str, Any]:
    normalized = text.lower()
    
    # 1. Match phrases
    matched_phrases = [phrase for phrase in SUSPICIOUS_PHRASES if phrase in normalized]
    
    # Base score
    score = sum(SUSPICIOUS_PHRASES[p] for p in matched_phrases)
    if not matched_phrases:
        score = 12
    else:
        score = min(98, score + 10)
    
    # 2. Extract Entities
    phones = re.findall(r'(?:\+?91[\-\s]?)?[6-9]\d{4}[\s\-]?\d{5}|\+?\d[\d\s().-]{7,}\d', text)
    cleaned_phones = list(set([p.strip() for p in phones if len(re.sub(r'\D', '', p)) >= 10]))
    
    upi_ids = re.findall(r'\b[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9-]*\b', text)
    cleaned_upis = list(set([u for u in upi_ids if not u.endswith(('.com', '.org', '.net', '.in'))]))
    
    urls = re.findall(r'(?:https?://|www\.)[^\s]+|t\.me/[^\s]+|wa\.me/[^\s]+', text, re.IGNORECASE)
    if source_url:
        urls.append(source_url)
    cleaned_urls = list(set([u.strip() for u in urls if u.strip()]))
    
    # 3. Derive Tags
    tags = []
    for keywords, tag in TAG_RULES:
        if any(kw in normalized for kw in keywords):
            tags.append(tag)
    if not tags:
        tags = ["General financial promotion"]

    # 4. Risk Classification
    if score >= 85:
        risk = "critical"
    elif score >= 60:
        risk = "high"
    elif score >= 35:
        risk = "medium"
    else:
        risk = "low"
        
    # 5. Evidence generation
    evidence = []
    if any(p in matched_phrases for p in ['sell your account', 'bank accounts available', 'rent account']):
        evidence.append("Explicit offer or recruitment to trade bank accounts / mule accounts")
    if any(p in matched_phrases for p in ['instant transfer', 'encrypted payment']):
        evidence.append("Instant transfer / evasive settlement mechanism detected")
    if any(p in matched_phrases for p in ['no paperwork', 'without pan', 'without cibil']):
        evidence.append("Claims KYC or paperwork bypass outside regulated banking channels")
    if any(p in matched_phrases for p in ['atm cards available', 'credit cards available', 'debit cards available']):
        evidence.append("Direct sale of active payment cards or netbanking credentials")
    if cleaned_phones:
        evidence.append(f"Direct phone contact provided ({len(cleaned_phones)} detected)")
    if cleaned_upis:
        evidence.append(f"UPI payment identifier extracted: {cleaned_upis[0]}")
    if not evidence:
        evidence.append("Standard heuristic review: low indicator density detected")

    explanation = (
        f"Matched {len(matched_phrases)} high-risk financial phrase(s). "
        f"Detected {len(cleaned_phones)} phone(s), {len(cleaned_upis)} UPI ID(s), and {len(cleaned_urls)} link(s)."
        if matched_phrases else
        "No high-risk account-sale keywords matched this content."
    )

    return {
        "score": score,
        "risk": risk,
        "platform": platform,
        "phrases": matched_phrases,
        "phones": cleaned_phones,
        "urls": cleaned_urls,
        "upiIds": cleaned_upis,
        "tags": tags[:3],
        "evidence": evidence,
        "explanation": explanation,
    }
