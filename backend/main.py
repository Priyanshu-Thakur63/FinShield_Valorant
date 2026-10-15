import os
import sys
import uuid
import datetime
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
from database import query_all, query_one, execute, get_db
from pipeline.analyzer import analyze_text
from ingestion.reddit_client import ingest_reddit_feed

app = FastAPI(title="FinShield AI Backend", version="1.0.0")

# CORS setup for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def auto_init_database():
    """Automatically verify/create schema and seed initial database on cloud boot."""
    try:
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        if os.path.exists(schema_path):
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            with get_db() as conn:
                with conn.cursor() as cur:
                    cur.execute(schema_sql)
            print("[Auto-Init] Database schema created/verified.")
            
            # Check if advertisements table has data
            count = query_one("SELECT COUNT(*) as cnt FROM advertisements")
            if not count or count.get("cnt", 0) == 0:
                print("[Auto-Init] Seeding initial dataset...")
                from ingestion.synthetic_seed import seed_database
                seed_database()
                print("[Auto-Init] Initial dataset seeded successfully!")
    except Exception as e:
        print("[Auto-Init] Notice during DB initialization:", e)

# ----------------- Models -----------------
class StatusUpdate(BaseModel):
    status: str

class ReviewUpdate(BaseModel):
    isBookmarked: Optional[bool] = None

class CaseCreate(BaseModel):
    alertId: str
    title: str
    owner: str = "A. Sharma"
    priority: str = "High"

class CaseUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    priority: Optional[str] = None

class WatchlistCreate(BaseModel):
    type: str
    value: str

class NoteCreate(BaseModel):
    text: str

class IngestRequest(BaseModel):
    sources: Optional[List[str]] = ["reddit"]
    limit: Optional[int] = 10

# ----------------- Helper Formatter -----------------
def format_ad_record(row):
    ad_id = row["id"]
    # Fetch indicators
    indicators = query_all("SELECT indicator_type, raw_value FROM extracted_indicators WHERE advertisement_id = %s", (ad_id,))
    tags = [i["raw_value"] for i in indicators if i["indicator_type"] == "tag"]
    phones = [i["raw_value"] for i in indicators if i["indicator_type"] == "phone"]
    urls = [i["raw_value"] for i in indicators if i["indicator_type"] == "url"]
    
    # Fetch evidence
    evidence_rows = query_all("SELECT evidence_text FROM ad_evidence WHERE advertisement_id = %s", (ad_id,))
    evidence = [e["evidence_text"] for e in evidence_rows]
    
    # Fetch linked campaign
    camp = query_one("""
        SELECT c.id, c.name FROM campaign_clusters c
        JOIN campaign_ads ca ON ca.campaign_id = c.id
        WHERE ca.advertisement_id = %s
    """, (ad_id,))
    cluster_label = f"{camp['id']} · {camp['name']}" if camp else "No linked cluster"

    p_low = (row["platform"] or "").lower()
    if "telegram" in p_low:
        initials, color = "TG", "telegram"
    elif "instagram" in p_low:
        initials, color = "IG", "instagram"
    elif "facebook" in p_low:
        initials, color = "f", "facebook"
    elif "reddit" in p_low:
        initials, color = "r/", "reddit"
    elif "twitter" in p_low or "x" in p_low:
        initials, color = "𝕏", "x"
    else:
        initials, color = "🌐", "web"

    # Format authentic live timestamp
    created_dt = row.get("created_at") or row.get("posted_at")
    if created_dt and isinstance(created_dt, datetime.datetime):
        time_display = created_dt.strftime("%d %b %Y, %H:%M:%S")
        iso_timestamp = created_dt.isoformat()
    elif row.get("time_label"):
        time_display = str(row["time_label"])
        iso_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    else:
        time_display = "Live record"
        iso_timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()

    posted_dt = row.get("posted_at")
    posted_iso = posted_dt.isoformat() if isinstance(posted_dt, datetime.datetime) else iso_timestamp
    created_iso = created_dt.isoformat() if isinstance(created_dt, datetime.datetime) else iso_timestamp

    return {
        "id": row["id"],
        "platform": row["platform"],
        "handle": row["author_handle"] or "@unknown",
        "text": row["content_text"],
        "time": time_display,
        "timestamp": iso_timestamp,
        "posted_at": posted_iso,
        "created_at": created_iso,
        "confidence": row["confidence_score"],
        "risk": row["risk_level"],
        "tags": tags or ["General financial promotion"],
        "phone": phones[0] if phones else "Not detected",
        "url": row["source_url"] or (urls[0] if urls else ""),
        "evidence": evidence or ["Standard heuristic scoring"],
        "cluster": cluster_label,
        "amount": row["asking_amount"] or "Not detected",
        "reviewStatus": row["review_status"] or "Needs review",
        "isBookmarked": bool(row["is_bookmarked"]),
        "initials": initials,
        "color": color
    }

# ----------------- Endpoints -----------------

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "FinShield AI Backend", "time": datetime.datetime.now().isoformat()}

# 1. User & Workspace Settings
@app.get("/api/v1/auth/me")
def get_current_user():
    user = query_one("SELECT id, display_name, email, role, workspace_id FROM users LIMIT 1")
    return user or {
        "id": "USR-001",
        "display_name": "A. Sharma",
        "email": "analyst@finshield.ai",
        "role": "Investigator · Tier 2",
        "workspace_id": "WS-001"
    }

@app.get("/api/v1/workspace/settings")
def get_workspace_settings():
    ws = query_one("SELECT * FROM workspaces LIMIT 1")
    if not ws:
        return {
            "workspaceName": "Financial Integrity", "analystName": "A. Sharma",
            "theme": "dark", "tableDensity": "comfortable", "maskSensitiveData": True,
            "criticalAlerts": True, "clusterSignals": True, "notificationsEnabled": True
        }
    return {
        "workspaceName": ws["name"],
        "analystName": "A. Sharma",
        "theme": ws["theme"],
        "tableDensity": ws["table_density"],
        "maskSensitiveData": ws["mask_sensitive_data"],
        "criticalAlerts": ws["critical_alerts_enabled"],
        "clusterSignals": ws["cluster_signals_enabled"],
        "notificationsEnabled": ws["notifications_enabled"]
    }

# 2. Advertisements Feed
@app.get("/api/v1/advertisements")
def list_advertisements(
    query: Optional[str] = None,
    platform: Optional[str] = None,
    risk: Optional[str] = None,
    page: int = 1,
    pageSize: int = 50
):
    sql = "SELECT * FROM advertisements WHERE 1=1"
    params = []
    
    if query:
        sql += " AND (content_text ILIKE %s OR author_handle ILIKE %s OR id ILIKE %s)"
        like = f"%{query}%"
        params.extend([like, like, like])
    if platform and platform != "All platforms":
        sql += " AND platform ILIKE %s"
        params.append(f"%{platform}%")
    if risk and risk != "All risks":
        sql += " AND risk_level = %s"
        params.append(risk.lower())

    sql += " ORDER BY COALESCE(created_at, posted_at) DESC, id DESC"
    rows = query_all(sql, params)
    
    # Format for frontend
    items = [format_ad_record(r) for r in rows]
    total = len(items)
    start = (page - 1) * pageSize
    end = start + pageSize
    return items[start:end]

@app.get("/api/v1/advertisements/{ad_id}")
def get_ad_by_id(ad_id: str):
    row = query_one("SELECT * FROM advertisements WHERE id = %s", (ad_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    return format_ad_record(row)

@app.patch("/api/v1/advertisements/{ad_id}/status")
def update_ad_status(ad_id: str, body: StatusUpdate):
    execute("UPDATE advertisements SET review_status = %s WHERE id = %s", (body.status, ad_id))
    return {"id": ad_id, "status": body.status}

@app.post("/api/v1/advertisements/{ad_id}/toggle-review")
def toggle_review(ad_id: str):
    execute("UPDATE advertisements SET is_bookmarked = NOT COALESCE(is_bookmarked, FALSE) WHERE id = %s", (ad_id,))
    row = query_one("SELECT is_bookmarked FROM advertisements WHERE id = %s", (ad_id,))
    return {"id": ad_id, "isBookmarked": row["is_bookmarked"]}

# 3. Live & On-Demand Inspection (Analysis Page)
@app.post("/api/v1/analysis/inspect")
async def inspect_advertisement(
    text: str = Form(...),
    platform: str = Form("Telegram"),
    sourceUrl: Optional[str] = Form(""),
    image: Optional[UploadFile] = File(None)
):
    analysis = analyze_text(text, platform=platform, source_url=sourceUrl)
    
    # If image attached, mock OCR extraction or append note
    if image:
        analysis["explanation"] += f" (Uploaded image '{image.filename}' processed)."
        
    return analysis

# 4. Alerts
@app.get("/api/v1/alerts")
def list_alerts():
    rows = query_all("""
        SELECT a.id, a.title, a.description, a.severity, a.triage_status, a.is_read, a.created_at as alert_created_at,
               ad.id as ad_id, ad.platform, ad.author_handle, ad.content_text, ad.risk_level,
               ad.confidence_score, ad.time_label, ad.asking_amount, ad.source_url,
               ad.created_at, ad.posted_at
        FROM alerts a
        JOIN advertisements ad ON ad.id = a.advertisement_id
        ORDER BY a.created_at DESC
    """)
    alerts = []
    for r in rows:
        formatted_ad = format_ad_record({
            "id": r["ad_id"], "platform": r["platform"], "author_handle": r["author_handle"],
            "content_text": r["content_text"], "time_label": r["time_label"],
            "confidence_score": r["confidence_score"], "risk_level": r["risk_level"],
            "asking_amount": r["asking_amount"], "source_url": r["source_url"],
            "review_status": r["triage_status"], "is_bookmarked": False,
            "created_at": r["created_at"], "posted_at": r["posted_at"]
        })
        time_str = r["alert_created_at"].strftime("%d %b %Y, %H:%M:%S") if r.get("alert_created_at") and isinstance(r["alert_created_at"], datetime.datetime) else (r["time_label"] or "Recently")
        alerts.append({
            "id": r["id"],
            "alert": formatted_ad,
            "severity": r["severity"],
            "title": r["title"],
            "description": r["description"],
            "timestamp": time_str,
            "isRead": bool(r["is_read"]),
            "status": r["triage_status"]
        })
    return alerts

@app.patch("/api/v1/alerts/{alert_id}/read")
def toggle_alert_read(alert_id: str):
    execute("UPDATE alerts SET is_read = NOT COALESCE(is_read, FALSE) WHERE id = %s", (alert_id,))
    row = query_one("SELECT is_read FROM alerts WHERE id = %s", (alert_id,))
    return {"id": alert_id, "isRead": row["is_read"]}

# 5. Campaign Clusters & DNA Graph
@app.get("/api/v1/campaigns")
def list_campaigns():
    rows = query_all("""
        SELECT c.*, COUNT(ca.advertisement_id) as linked_posts,
               COUNT(DISTINCT ad.author_handle) as linked_accounts
        FROM campaign_clusters c
        LEFT JOIN campaign_ads ca ON ca.campaign_id = c.id
        LEFT JOIN advertisements ad ON ad.id = ca.advertisement_id
        GROUP BY c.id
        ORDER BY c.confidence DESC
    """)
    return [{
        "id": r["id"],
        "name": r["name"],
        "platform": r["platform"],
        "posts": max(r["linked_posts"], 1),
        "accounts": max(r["linked_accounts"], 1),
        "risk": r["risk"],
        "confidence": r["confidence"],
        "firstSeen": r["first_seen"],
        "pattern": r["pattern"],
        "alertId": r["primary_alert_id"] or "ADV-2841"
    } for r in rows]

@app.get("/api/v1/campaigns/{campaign_id}/graph")
def get_campaign_graph(campaign_id: str):
    camp = query_one("SELECT * FROM campaign_clusters WHERE id = %s", (campaign_id,))
    if not camp:
        camp = query_one("SELECT * FROM campaign_clusters LIMIT 1")
    if not camp:
        return {"nodes": [], "edges": []}

    c_id = camp["id"]
    camp_node_id = f"campaign-{c_id}"

    # 1. Real linked advertisements
    ads = query_all("""
        SELECT a.id, a.platform, a.author_handle, a.content_text, a.risk_level, 
               a.confidence_score, a.source_url, a.asking_amount, a.time_label, a.created_at
        FROM advertisements a
        JOIN campaign_ads ca ON ca.advertisement_id = a.id
        WHERE ca.campaign_id = %s
        ORDER BY a.confidence_score DESC
    """, (c_id,))

    nodes = []
    edges = []

    # 2. Add Center Campaign Node
    nodes.append({
        "id": camp_node_id,
        "type": "campaign",
        "position": {"x": 390, "y": 200},
        "data": {
            "kind": "campaign",
            "id": c_id,
            "label": f"Potential campaign · {c_id}",
            "detail": f"{camp['name']} · {camp['confidence']}% AI confidence",
            "risk": camp["risk"],
            "confidence": camp["confidence"],
            "platform": camp["platform"],
            "pattern": camp["pattern"]
        }
    })

    # 3. Add Advertisement Nodes (Left arc)
    y_step_ad = 105
    y_start_ad = max(30, 200 - ((len(ads) - 1) * y_step_ad) // 2)
    for i, ad in enumerate(ads):
        ad_node_id = f"ad-{ad['id']}"
        nodes.append({
            "id": ad_node_id,
            "type": "ad",
            "position": {"x": 80, "y": y_start_ad + i * y_step_ad},
            "data": {
                "kind": "ad",
                "alertId": ad["id"],
                "label": f"{ad['id']} · {ad['platform']}",
                "detail": f"{ad['risk_level'].title()} · score {ad['confidence_score']}/100",
                "risk": ad["risk_level"],
                "confidence": ad["confidence_score"],
                "platform": ad["platform"],
                "handle": ad["author_handle"] or "@unknown",
                "text": ad["content_text"],
                "amount": ad["asking_amount"] or "Not detected"
            }
        })
        edges.append({
            "id": f"e-{ad_node_id}-{camp_node_id}",
            "source": ad_node_id,
            "target": camp_node_id,
            "label": "correlated in"
        })

    # 4. Fetch real extracted indicators for these linked ads
    ad_id_list = [a["id"] for a in ads]
    if ad_id_list:
        indicators = query_all("""
            SELECT indicator_type, raw_value, count(*) as cnt
            FROM extracted_indicators
            WHERE advertisement_id = ANY(%s)
            GROUP BY indicator_type, raw_value
            ORDER BY cnt DESC, indicator_type ASC
            LIMIT 6
        """, (ad_id_list,))
    else:
        indicators = []

    y_step_ind = 95
    y_start_ind = max(40, 200 - ((len(indicators) - 1) * y_step_ind) // 2)

    for j, ind in enumerate(indicators):
        itype = ind["indicator_type"].lower()
        val = ind["raw_value"]
        ind_node_id = f"ind-{j}-{itype}"
        disp_val = val if len(val) < 28 else (val[:25] + "…")

        node_kind = itype if itype in ["phone", "url", "upi", "tag", "image"] else "url"
        node_label = f"Shared {itype}" if itype in ["phone", "upi"] else f"{itype.title()}: {disp_val}"

        if itype == "phone":
            pos = {"x": 390, "y": 40}
        elif itype == "upi":
            pos = {"x": 690, "y": 300}
        elif itype == "image":
            pos = {"x": 390, "y": 395}
        else:
            pos = {"x": 695, "y": y_start_ind + j * y_step_ind}

        nodes.append({
            "id": ind_node_id,
            "type": node_kind,
            "position": pos,
            "data": {
                "kind": node_kind,
                "label": node_label,
                "detail": f"{val} · observed in {ind['cnt']} ads",
                "rawValue": val,
                "type": itype,
                "count": ind["cnt"]
            }
        })

        edge_label = "shared contact" if itype == "phone" else (
            "shared domain" if itype == "url" else (
                "payment ID" if itype == "upi" else (
                    "visual fingerprint" if itype == "image" else "signature tag"
                )
            )
        )

        edges.append({
            "id": f"e-{camp_node_id}-{ind_node_id}",
            "source": camp_node_id,
            "target": ind_node_id,
            "label": edge_label
        })

    return {"nodes": nodes, "edges": edges}


# 6. Investigations
@app.get("/api/v1/investigations")
def list_investigations():
    rows = query_all("SELECT * FROM investigations ORDER BY created_at DESC")
    return [{
        "id": r["id"],
        "title": r["title"],
        "alertId": r["advertisement_id"] or "ADV-2841",
        "owner": r["owner_name"],
        "status": r["status"],
        "priority": r["priority"],
        "updated": "Recently"
    } for r in rows]

@app.post("/api/v1/investigations")
def create_investigation(body: CaseCreate):
    case_num = query_one("SELECT count(*) as cnt FROM investigations")["cnt"] + 1043
    case_id = f"INV-{case_num}"
    execute("""
        INSERT INTO investigations (id, workspace_id, advertisement_id, title, owner_name, status, priority)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (case_id, "WS-001", body.alertId, body.title, body.owner, "Open", body.priority))
    return {
        "id": case_id,
        "title": body.title,
        "alertId": body.alertId,
        "owner": body.owner,
        "status": "Open",
        "priority": body.priority,
        "updated": "Just now"
    }

@app.patch("/api/v1/investigations/{case_id}")
def update_investigation(case_id: str, body: CaseUpdate):
    if body.status:
        execute("UPDATE investigations SET status = %s WHERE id = %s", (body.status, case_id))
    if body.owner:
        execute("UPDATE investigations SET owner_name = %s WHERE id = %s", (body.owner, case_id))
    if body.priority:
        execute("UPDATE investigations SET priority = %s WHERE id = %s", (body.priority, case_id))
    return {"id": case_id, "updated": True}

# 7. Watchlist
@app.get("/api/v1/watchlist")
def list_watchlist():
    rows = query_all("SELECT * FROM watchlist_entries ORDER BY created_at DESC")
    items = []
    for r in rows:
        val = r["normalized_value"]
        # Count matches across advertisements
        count = query_one("SELECT count(*) as cnt FROM advertisements WHERE content_text ILIKE %s OR author_handle ILIKE %s", (f"%{val}%", f"%{val}%"))["cnt"]
        items.append({
            "id": r["id"],
            "value": r["indicator_value"],
            "type": r["indicator_type"],
            "added": "Recently",
            "matches": count
        })
    return items

@app.post("/api/v1/watchlist")
def add_to_watchlist(body: WatchlistCreate):
    new_id = f"WL-{uuid.uuid4().hex[:3].upper()}"
    execute("""
        INSERT INTO watchlist_entries (id, workspace_id, indicator_type, indicator_value, normalized_value)
        VALUES (%s, %s, %s, %s, %s)
    """, (new_id, "WS-001", body.type, body.value, body.value.lower()))
    return {"id": new_id, "type": body.type, "value": body.value, "matches": 0, "added": "Just now"}

@app.delete("/api/v1/watchlist/{entry_id}")
def delete_from_watchlist(entry_id: str):
    execute("DELETE FROM watchlist_entries WHERE id = %s", (entry_id,))
    return {"id": entry_id, "deleted": True}

from ingestion.apify_unified import run_unified_scrape
from pipeline.url_scanner import scan_url
from ingestion.url_feed_scraper import run_url_ingestion_and_scan

class ScrapeRequest(BaseModel):
    platform: Optional[str] = "all"
    keywords: Optional[List[str]] = None
    limit: Optional[int] = 5

class UrlScanRequest(BaseModel):
    url: str
    probeLive: Optional[bool] = True

class UrlFeedScrapeRequest(BaseModel):
    limit: Optional[int] = 5

# 8. Live Ingestion Triggers
@app.post("/api/v1/ingestion/sync")
def trigger_ingestion(body: IngestRequest):
    reddit_res = ingest_reddit_feed(limit=body.limit or 10)
    unified_res = run_unified_scrape(platform="all", limit=5)
    return {
        "status": "success",
        "reddit": reddit_res,
        "unified": unified_res,
        "totalFetched": (reddit_res.get("total_fetched", 0) + unified_res.get("ingested", 0))
    }

@app.post("/api/v1/ingestion/scrape")
def trigger_scrape(body: ScrapeRequest):
    result = run_unified_scrape(
        platform=body.platform or "all",
        keywords=body.keywords,
        limit=body.limit or 5
    )
    return result

# 9. URL Threat Scanner & Web Scraper Endpoints
@app.post("/api/v1/url-scanner/scan")
def scan_single_url(body: UrlScanRequest):
    res = scan_url(body.url, probe_live=body.probeLive if body.probeLive is not None else True)
    
    # Store into scanned_urls
    try:
        record_id = f"URL-{uuid.uuid4().hex[:6].upper()}"
        signals_list = [s["description"] for s in res.get("signals", [])]
        execute("""
            INSERT INTO scanned_urls (
                id, url, domain, classification, risk_score, target_brand,
                is_live, http_status, page_title, detected_forms, threat_signals, source, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, (
            record_id, res["url"], res["domain"], res["classification"], res["risk_score"],
            res["target_brand"], res["is_live"], res["http_status"], res["page_title"],
            res.get("detected_forms", []), signals_list, "On-Demand Scanner"
        ))
        res["id"] = record_id
    except Exception as e:
        print(f"Error persisting scan: {e}")
        
    return res

@app.get("/api/v1/url-scanner/recent")
def list_recent_scanned_urls(limit: int = 50):
    rows = query_all("""
        SELECT id, url, domain, classification, risk_score, target_brand,
               is_live, http_status, page_title, detected_forms, threat_signals, source, created_at
        FROM scanned_urls
        ORDER BY created_at DESC
        LIMIT %s
    """, (limit,))
    return rows

@app.post("/api/v1/url-scanner/scrape-feed")
def trigger_url_feed_scrape(body: UrlFeedScrapeRequest):
    """
    Executes web scrapers to discover newly published & reported URLs from live feeds
    (OpenPhish, Reddit communities, and Web threat intelligence), classifies them as
    Real/Legitimate vs Phishing vs Suspicious, and persists to PostgreSQL.
    """
    return run_url_ingestion_and_scan(limit_per_source=body.limit or 5)

# 10. Threat Analytics & Real Metrics
@app.get("/api/v1/analytics/overview")
def get_analytics_overview(
    range: str = Query("7d", description="Time window: 24h, 7d, 30d, all"),
    platform: Optional[str] = Query("all", description="Platform filter: all, Reddit, Instagram, Facebook, Open web, Telegram")
):
    p_filter = ""
    params = []
    if platform and platform.lower() != "all":
        p_filter = "AND platform ILIKE %s"
        params.append(f"%{platform}%")

    # 1. Summary Metrics
    ad_stats = query_one(f"""
        SELECT 
            count(*) as total,
            count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as high_risk,
            count(CASE WHEN risk_level != 'low' THEN 1 END) as suspicious,
            count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical,
            COALESCE(round(avg(confidence_score), 1), 0) as avg_conf,
            max(COALESCE(created_at, posted_at)) as latest_time
        FROM advertisements
        WHERE 1=1 {p_filter}
    """, params)

    url_stats = query_one("""
        SELECT 
            count(*) as total,
            count(CASE WHEN classification = 'PHISHING' THEN 1 END) as phishing,
            count(CASE WHEN classification = 'LEGITIMATE' THEN 1 END) as legitimate,
            COALESCE(round(avg(risk_score), 1), 0) as avg_risk
        FROM scanned_urls
    """)

    ind_count = query_one("SELECT count(*) as cnt FROM extracted_indicators")["cnt"]
    camp_count = query_one("SELECT count(*) as cnt FROM campaign_clusters")["cnt"]
    inv_stats = query_one("SELECT count(*) as total, count(CASE WHEN status != 'Closed' THEN 1 END) as open_cnt FROM investigations")

    total_ads = ad_stats["total"] if ad_stats else 0
    high_risk = ad_stats["high_risk"] if ad_stats else 0
    high_share = round((high_risk / total_ads * 100), 1) if total_ads > 0 else 0
    latest_dt = ad_stats.get("latest_time") if ad_stats else None
    latest_time_iso = latest_dt.isoformat() if isinstance(latest_dt, datetime.datetime) else None

    summary = {
        "totalAds": total_ads,
        "suspiciousAds": ad_stats["suspicious"] if ad_stats else 0,
        "criticalAds": ad_stats["critical"] if ad_stats else 0,
        "highRiskShare": high_share,
        "avgConfidence": float(ad_stats["avg_conf"]) if ad_stats else 0.0,
        "phishingUrls": url_stats["phishing"] if url_stats else 0,
        "legitimateUrls": url_stats["legitimate"] if url_stats else 0,
        "indicators": ind_count,
        "campaigns": camp_count,
        "openInvestigations": inv_stats["open_cnt"] if inv_stats else 0,
        "latestThreatTime": latest_time_iso
    }

    # 2. Time Trend Series
    range_clean = range.lower()
    if "24" in range_clean or ("day" in range_clean and "7" not in range_clean and "30" not in range_clean and "90" not in range_clean):
        trend_sql = f"""
            WITH hour_series AS (
                SELECT generate_series(
                    date_trunc('hour', NOW() - INTERVAL '23 hours'),
                    date_trunc('hour', NOW()),
                    '1 hour'::interval
                ) as hr
            ),
            ad_counts AS (
                SELECT 
                    date_trunc('hour', created_at) as hr,
                    count(*) as total,
                    count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as suspicious,
                    count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical
                FROM advertisements
                WHERE created_at >= NOW() - INTERVAL '24 hours' {p_filter}
                GROUP BY date_trunc('hour', created_at)
            ),
            url_counts AS (
                SELECT 
                    date_trunc('hour', created_at) as hr,
                    count(CASE WHEN classification = 'PHISHING' THEN 1 END) as phishing
                FROM scanned_urls
                WHERE created_at >= NOW() - INTERVAL '24 hours'
                GROUP BY date_trunc('hour', created_at)
            )
            SELECT 
                to_char(hs.hr, 'HH12 AM') as label,
                to_char(hs.hr, 'Mon DD, HH24:00') as full_label,
                to_char(hs.hr, 'YYYY-MM-DD HH24:00') as sort_key,
                COALESCE(ac.total, 0) as total,
                COALESCE(ac.suspicious, 0) as suspicious,
                COALESCE(ac.critical, 0) as critical,
                COALESCE(uc.phishing, 0) as phishing
            FROM hour_series hs
            LEFT JOIN ad_counts ac ON ac.hr = hs.hr
            LEFT JOIN url_counts uc ON uc.hr = hs.hr
            ORDER BY hs.hr ASC
        """
        trend_rows = query_all(trend_sql, params)
    elif "30" in range_clean:
        trend_sql = f"""
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date as dt
            ),
            ad_counts AS (
                SELECT 
                    created_at::date as dt,
                    count(*) as total,
                    count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as suspicious,
                    count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical
                FROM advertisements
                WHERE created_at >= CURRENT_DATE - INTERVAL '29 days' {p_filter}
                GROUP BY created_at::date
            ),
            url_counts AS (
                SELECT 
                    created_at::date as dt,
                    count(CASE WHEN classification = 'PHISHING' THEN 1 END) as phishing
                FROM scanned_urls
                WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
                GROUP BY created_at::date
            )
            SELECT 
                to_char(ds.dt, 'Mon DD') as label,
                to_char(ds.dt, 'Mon DD, YYYY') as full_label,
                to_char(ds.dt, 'YYYY-MM-DD') as sort_key,
                COALESCE(ac.total, 0) as total,
                COALESCE(ac.suspicious, 0) as suspicious,
                COALESCE(ac.critical, 0) as critical,
                COALESCE(uc.phishing, 0) as phishing
            FROM date_series ds
            LEFT JOIN ad_counts ac ON ac.dt = ds.dt
            LEFT JOIN url_counts uc ON uc.dt = ds.dt
            ORDER BY ds.dt ASC
        """
        trend_rows = query_all(trend_sql, params)
    elif "all" in range_clean or "90" in range_clean:
        trend_sql = f"""
            SELECT 
                to_char(COALESCE(posted_at, created_at)::date, 'Mon DD') as label,
                to_char(COALESCE(posted_at, created_at)::date, 'Mon DD, YYYY') as full_label,
                to_char(COALESCE(posted_at, created_at)::date, 'YYYY-MM-DD') as sort_key,
                count(*) as total,
                count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as suspicious,
                count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical,
                0 as phishing
            FROM advertisements
            WHERE 1=1 {p_filter}
            GROUP BY sort_key, label, full_label
            ORDER BY sort_key ASC
        """
        trend_rows = query_all(trend_sql, params)
    else:
        # Default 7 days
        trend_sql = f"""
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '6 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date as dt
            ),
            ad_counts AS (
                SELECT 
                    created_at::date as dt,
                    count(*) as total,
                    count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as suspicious,
                    count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical
                FROM advertisements
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 days' {p_filter}
                GROUP BY created_at::date
            ),
            url_counts AS (
                SELECT 
                    created_at::date as dt,
                    count(CASE WHEN classification = 'PHISHING' THEN 1 END) as phishing
                FROM scanned_urls
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
                GROUP BY created_at::date
            )
            SELECT 
                to_char(ds.dt, 'Dy') as label,
                to_char(ds.dt, 'Mon DD') as full_label,
                to_char(ds.dt, 'YYYY-MM-DD') as sort_key,
                COALESCE(ac.total, 0) as total,
                COALESCE(ac.suspicious, 0) as suspicious,
                COALESCE(ac.critical, 0) as critical,
                COALESCE(uc.phishing, 0) as phishing
            FROM date_series ds
            LEFT JOIN ad_counts ac ON ac.dt = ds.dt
            LEFT JOIN url_counts uc ON uc.dt = ds.dt
            ORDER BY ds.dt ASC
        """
        trend_rows = query_all(trend_sql, params)

    # 3. Risk Distribution
    risk_color_map = {
        "critical": "#ee817f",
        "high": "#eab569",
        "medium": "#e7d474",
        "low": "#84c999"
    }
    risk_raw = query_all(f"""
        SELECT risk_level as name, count(*) as value
        FROM advertisements
        WHERE 1=1 {p_filter}
        GROUP BY risk_level
    """, params)
    risk_dict = {r["name"].lower(): r["value"] for r in risk_raw}
    risk_dist = []
    for r_level in ["critical", "high", "medium", "low"]:
        val = risk_dict.get(r_level, 0)
        pct = round((val / total_ads * 100), 1) if total_ads > 0 else 0
        risk_dist.append({
            "name": r_level,
            "value": val,
            "percentage": pct,
            "fill": risk_color_map.get(r_level, "#778188")
        })

    # 4. Platform Distribution
    platform_rows = query_all("""
        SELECT platform as name, count(*) as total,
               count(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) as high_risk,
               count(CASE WHEN risk_level = 'critical' THEN 1 END) as critical,
               count(CASE WHEN risk_level = 'medium' THEN 1 END) as medium,
               count(CASE WHEN risk_level = 'low' THEN 1 END) as low,
               COALESCE(round(avg(confidence_score), 1), 0) as avg_confidence
        FROM advertisements
        GROUP BY platform
        ORDER BY total DESC
    """)
    platforms = [{
        "name": r["name"],
        "total": r["total"],
        "highRisk": r["high_risk"],
        "critical": r["critical"],
        "medium": r["medium"],
        "low": r["low"],
        "avgConfidence": float(r["avg_confidence"])
    } for r in platform_rows]

    # 5. Target Brand Distribution (from scanned_urls)
    brand_rows = query_all("""
        SELECT target_brand as name, count(*) as total,
               count(CASE WHEN classification = 'PHISHING' THEN 1 END) as phishing,
               count(CASE WHEN classification = 'LEGITIMATE' THEN 1 END) as legitimate,
               COALESCE(round(avg(risk_score), 1), 0) as avg_risk
        FROM scanned_urls
        WHERE target_brand IS NOT NULL AND target_brand != ''
        GROUP BY target_brand
        ORDER BY phishing DESC, total DESC
    """)
    brands = [{
        "name": r["name"],
        "total": r["total"],
        "phishing": r["phishing"],
        "legitimate": r["legitimate"],
        "avgRisk": float(r["avg_risk"])
    } for r in brand_rows]

    # 6. Frequent Indicators & Signatures
    ind_rows = query_all("""
        SELECT raw_value as name, indicator_type as type, count(*) as count
        FROM extracted_indicators
        GROUP BY raw_value, indicator_type
        ORDER BY count DESC
        LIMIT 6
    """)
    max_ind = max([r["count"] for r in ind_rows], default=1)
    indicators = [{
        "name": r["name"],
        "type": r["type"],
        "count": r["count"],
        "pct": round((r["count"] / max_ind) * 100, 1)
    } for r in ind_rows]

    # 7. Campaign Clusters Impact
    cluster_rows = query_all("""
        SELECT c.id, c.name, c.platform, c.risk, c.confidence, count(ca.advertisement_id) as posts
        FROM campaign_clusters c
        LEFT JOIN campaign_ads ca ON ca.campaign_id = c.id
        GROUP BY c.id
        ORDER BY c.confidence DESC
    """)
    max_cluster_posts = max([r["posts"] for r in cluster_rows], default=1)
    clusters = [{
        "id": r["id"],
        "name": r["name"],
        "platform": r["platform"],
        "risk": r["risk"],
        "confidence": r["confidence"],
        "posts": max(r["posts"], 1),
        "pct": round((max(r["posts"], 1) / max(max_cluster_posts, 1)) * 100, 1)
    } for r in cluster_rows]

    # 8. Investigation Status
    inv_rows = query_all("SELECT status, count(*) as count FROM investigations GROUP BY status")
    inv_dict = {r["status"]: r["count"] for r in inv_rows}
    inv_status = [
        {"status": "Open", "value": inv_dict.get("Open", 0)},
        {"status": "In progress", "value": inv_dict.get("In progress", 0)},
        {"status": "Closed", "value": inv_dict.get("Closed", 0)}
    ]

    # 9. Recent Real Threat Stream (Latest 6)
    recent_rows = query_all(f"""
        SELECT id, platform, author_handle, risk_level, confidence_score, asking_amount,
               content_text, COALESCE(created_at, posted_at) as created_at
        FROM advertisements
        WHERE 1=1 {p_filter}
        ORDER BY COALESCE(created_at, posted_at) DESC
        LIMIT 6
    """, params)
    recent_threats = []
    for r in recent_rows:
        dt = r["created_at"]
        time_str = dt.strftime("%d %b, %H:%M") if isinstance(dt, datetime.datetime) else "Recently"
        recent_threats.append({
            "id": r["id"],
            "platform": r["platform"],
            "handle": r["author_handle"] or "@unknown",
            "risk": r["risk_level"],
            "confidence": r["confidence_score"],
            "amount": r["asking_amount"] or "Not specified",
            "snippet": (r["content_text"][:95] + "…") if len(r["content_text"]) > 95 else r["content_text"],
            "time": time_str
        })

    return {
        "status": "success",
        "timeRange": range,
        "selectedPlatform": platform,
        "summary": summary,
        "trend": trend_rows,
        "riskDistribution": risk_dist,
        "platformDistribution": platforms,
        "brandDistribution": brands,
        "topIndicators": indicators,
        "campaignClusters": clusters,
        "investigationStatus": inv_status,
        "recentThreats": recent_threats
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


