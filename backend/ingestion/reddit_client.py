import httpx
from bs4 import BeautifulSoup
import re
import uuid
import datetime
import os
import sys
from typing import List, Dict, Any

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import get_db
from pipeline.analyzer import analyze_text

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

SUBREDDITS = ["Scams", "phishing"]

def fetch_reddit_posts(subreddit: str = "Scams", limit: int = 15) -> List[Dict[str, Any]]:
    url = f"https://www.reddit.com/r/{subreddit}/new.rss"
    try:
        response = httpx.get(url, headers=HEADERS, follow_redirects=True, timeout=12.0)
        if response.status_code != 200:
            print(f"Reddit RSS returned HTTP {response.status_code} for r/{subreddit}")
            return []
        
        soup = BeautifulSoup(response.text, "xml")
        entries = soup.find_all("entry")[:limit]
        results = []
        for e in entries:
            title = e.find("title").text if e.find("title") else "Untitled Post"
            author_tag = e.find("author")
            author = author_tag.find("name").text if author_tag and author_tag.find("name") else "/u/anonymous"
            link_tag = e.find("link")
            link = link_tag["href"] if link_tag else ""
            content_tag = e.find("content")
            raw_html = content_tag.text if content_tag else ""
            content_soup = BeautifulSoup(raw_html, "html.parser")
            clean_text = content_soup.get_text(separator=" ", strip=True)
            updated_tag = e.find("updated") or e.find("published")
            pub_time = updated_tag.text.strip() if updated_tag and updated_tag.text else None
            
            results.append({
                "title": title,
                "author": author,
                "link": link,
                "text": full_text[:4000],
                "subreddit": subreddit,
                "timestamp": pub_time
            })
        return results
    except Exception as e:
        print(f"Error fetching from Reddit r/{subreddit}: {e}")
        return []

def ingest_reddit_feed(limit: int = 15) -> Dict[str, Any]:
    total_fetched = 0
    flagged_count = 0
    
    for sub in SUBREDDITS:
        posts = fetch_reddit_posts(sub, limit=limit)
        total_fetched += len(posts)
        
        with get_db() as conn:
            with conn.cursor() as cur:
                for post in posts:
                    # Check if already ingested by source_url
                    cur.execute("SELECT id FROM advertisements WHERE source_url = %s", (post["link"],))
                    if cur.fetchone():
                        continue # Already in database
                    
                    # Analyze post
                    analysis = analyze_text(post["text"], platform=f"Reddit (r/{post['subreddit']})", source_url=post["link"])
                    
                    # Generate an ad ID
                    short_id = uuid.uuid4().hex[:6].upper()
                    ad_id = f"RED-{short_id}"
                    
                    # Estimate monetary amount if mentioned
                    amounts = re.findall(r'(?:₹|\$|rs\.?|inr|usd)\s*[\d,]+(?:\.\d+)?|\b\d+k\b', post["text"], re.IGNORECASE)
                    amount_str = amounts[0] if amounts else "Not detected"
                    
                    now_utc = datetime.datetime.now(datetime.timezone.utc)
                    posted_dt = now_utc
                    if post.get("timestamp"):
                        try:
                            posted_dt = datetime.datetime.fromisoformat(post["timestamp"].replace("Z", "+00:00"))
                        except Exception:
                            posted_dt = now_utc

                    time_label = posted_dt.strftime("%d %b %Y, %H:%M:%S UTC")

                    # Insert Advertisement
                    cur.execute("""
                        INSERT INTO advertisements (
                            id, workspace_id, platform, author_handle, content_text,
                            source_url, asking_amount, risk_level, confidence_score,
                            review_status, time_label, posted_at, created_at
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        ad_id, "WS-001", "Reddit", post["author"], post["text"],
                        post["link"], amount_str, analysis["risk"], analysis["score"],
                        "Needs review", time_label, posted_dt, now_utc
                    ))
                    
                    # Insert Extracted Indicators
                    for phone in analysis["phones"]:
                        cur.execute("""
                            INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value)
                            VALUES (%s, %s, %s, %s)
                        """, (ad_id, "phone", phone, re.sub(r'\D', '', phone)))
                        
                    for upi in analysis["upiIds"]:
                        cur.execute("""
                            INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value)
                            VALUES (%s, %s, %s, %s)
                        """, (ad_id, "upi", upi, upi.lower()))
                        
                    for url in analysis["urls"]:
                        cur.execute("""
                            INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value)
                            VALUES (%s, %s, %s, %s)
                        """, (ad_id, "url", url, url.lower()))
                        
                    for tag in analysis["tags"]:
                        cur.execute("""
                            INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value)
                            VALUES (%s, %s, %s, %s)
                        """, (ad_id, "tag", tag, tag.lower()))

                    # Insert Evidence
                    for ev in analysis["evidence"]:
                        cur.execute("""
                            INSERT INTO ad_evidence (advertisement_id, phrase, evidence_text, is_strong_signal)
                            VALUES (%s, %s, %s, %s)
                        """, (ad_id, "", ev, True if analysis["risk"] in ("critical", "high") else False))

                    # If High or Critical risk, generate an Alert
                    if analysis["risk"] in ("critical", "high"):
                        flagged_count += 1
                        alert_id = f"ALT-{uuid.uuid4().hex[:4].upper()}"
                        alert_title = (
                            f"Urgent financial risk detected on r/{post['subreddit']}"
                            if analysis["risk"] == "critical" else
                            f"Suspicious promotion flagged on r/{post['subreddit']}"
                        )
                        alert_desc = f"{post['author']} · {', '.join(analysis['tags'])}"
                        cur.execute("""
                            INSERT INTO alerts (id, workspace_id, advertisement_id, title, description, severity, triage_status, is_read)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """, (alert_id, "WS-001", ad_id, alert_title, alert_desc, analysis["risk"], "Needs review", False))

    return {
        "status": "success",
        "totalFetched": total_fetched,
        "newFlagged": flagged_count,
        "timestamp": datetime.datetime.now().isoformat()
    }
