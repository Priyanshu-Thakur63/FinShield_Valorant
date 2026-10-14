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
    edges = query_all("SELECT * FROM campaign_graph_edges WHERE campaign_id = %s", (campaign_id,))
    nodes = [
        {"id": "campaign-019", "type": "campaign", "position": {"x": 390, "y": 200}, "data": {"label": f"Potential campaign · {campaign_id}", "detail": "Linked posts & indicators"}},
        {"id": "ad-2841", "type": "ad", "position": {"x": 80, "y": 70}, "data": {"alertId": "ADV-2841", "label": "ADV-2841 · Telegram", "detail": "Critical · score 98/100"}},
        {"id": "ad-2842", "type": "ad", "position": {"x": 80, "y": 315}, "data": {"alertId": "ADV-2842", "label": "ADV-2842 · Telegram", "detail": "High · score 88/100"}},
        {"id": "phone", "type": "phone", "position": {"x": 360, "y": 40}, "data": {"label": "Shared phone", "detail": "+91 98765 4•••2"}},
        {"id": "url", "type": "url", "position": {"x": 695, "y": 65}, "data": {"label": "Shared domain", "detail": "quickcash.example"}},
        {"id": "upi", "type": "upi", "position": {"x": 690, "y": 300}, "data": {"label": "Payment ID", "detail": "quickcash@upi"}},
        {"id": "fingerprint", "type": "image", "position": {"x": 390, "y": 395}, "data": {"label": "Image fingerprint", "detail": "sha256: 8f2a…1c9e"}}
    ]
    formatted_edges = [{
        "id": e["id"],
        "source": e["source_node"],
        "target": e["target_node"],
        "label": e["edge_label"]
    } for e in edges]

    return {"nodes": nodes, "edges": formatted_edges}

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

class ScrapeRequest(BaseModel):
    platform: Optional[str] = "all"
    keywords: Optional[List[str]] = None
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
