import datetime
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import get_db

SEED_ADS = [
    {
        "id": "ADV-2841", "risk": "critical", "platform": "Telegram", "handle": "@quickcash_accounts",
        "text": "Verified bank accounts available. Full access, instant transfer enabled. DM for today’s rates.",
        "time": "2 min ago", "confidence": 98, "tags": ["Bank account sale", "Instant transfer"],
        "phone": "+91 98765 4•••2", "url": "https://t.me/quickcash_accounts",
        "evidence": [
            "Explicit offer to sell verified accounts",
            "“Instant transfer” signals mule-account intent",
            "Same copy found in 6 other posts"
        ],
        "cluster": "CL-019", "amount": "₹8,000–₹25,000"
    },
    {
        "id": "ADV-2842", "risk": "high", "platform": "Telegram", "handle": "@quickcash_accounts_2",
        "text": "Verified accounts with instant transfer access. Same-day delivery; message for details.",
        "time": "5 min ago", "confidence": 88, "tags": ["Account access", "Instant transfer"],
        "phone": "+91 98765 4•••2", "url": "https://quickcash.example",
        "evidence": [
            "Synthetic second post added to demonstrate an entity overlap",
            "Shared masked contact value in the sample graph",
            "Requires independent source verification"
        ],
        "cluster": "CL-019", "amount": "Not detected"
    },
    {
        "id": "ADV-2839", "risk": "high", "platform": "Instagram", "handle": "@finserve_connect",
        "text": "Need a current account? We arrange business accounts with cheque book. No paperwork, 24h delivery.",
        "time": "8 min ago", "confidence": 91, "tags": ["Current account", "No paperwork"],
        "phone": "+91 88220 1•••6", "url": "https://wa.me/918822016666",
        "evidence": [
            "Account opening offered outside normal bank channels",
            "“No paperwork” is a high-risk indicator",
            "Contact number appears in 3 flagged advertisements"
        ],
        "cluster": "CL-014", "amount": "₹12,000"
    },
    {
        "id": "ADV-2837", "risk": "high", "platform": "Facebook", "handle": "Easy Finance Hub",
        "text": "Debit card with active netbanking. Sell your unused account and earn up to 15k today!",
        "time": "14 min ago", "confidence": 87, "tags": ["Debit card", "Account recruitment"],
        "phone": "+91 70118 6•••9", "url": "https://facebook.com/groups/easyfinance",
        "evidence": [
            "Direct solicitation to sell personal bank accounts",
            "Debit card plus netbanking credentials offered",
            "Payment promise used to recruit account holders"
        ],
        "cluster": "CL-011", "amount": "Up to ₹15,000"
    },
    {
        "id": "ADV-2834", "risk": "medium", "platform": "X / Twitter", "handle": "@digitalbiz_24",
        "text": "Open your zero-balance savings account online. Message us for a fast-track setup.",
        "time": "21 min ago", "confidence": 64, "tags": ["Savings account", "Fast-track setup"],
        "phone": "Not detected", "url": "https://x.com/digitalbiz_24",
        "evidence": [
            "Third-party account-opening assistance",
            "No bank affiliation could be verified",
            "No explicit sale or payment details detected"
        ],
        "cluster": "CL-008", "amount": "Not detected"
    },
    {
        "id": "ADV-2831", "risk": "low", "platform": "Telegram", "handle": "@loanhelp_india",
        "text": "Personal loan assistance for salaried employees. Apply with valid ID and income proof.",
        "time": "36 min ago", "confidence": 28, "tags": ["Loan assistance"],
        "phone": "Not detected", "url": "https://t.me/loanhelp_india",
        "evidence": [
            "No sale of financial accounts detected",
            "Standard identity checks mentioned",
            "Low keyword and network risk"
        ],
        "cluster": None, "amount": "Not detected"
    },
    {
        "id": "ADV-2829", "risk": "high", "platform": "Open web", "handle": "premium-card-market",
        "text": "Pre-activated credit and ATM cards available with linked account access. Encrypted payment accepted.",
        "time": "52 min ago", "confidence": 93, "tags": ["Credit card sale", "Payment details"],
        "phone": "+91 99870 2•••1", "url": "https://premium-card-market.example",
        "evidence": [
            "Credit and ATM card sale explicitly advertised",
            "Promotional image matches known card-sale templates",
            "External payment and contact details detected"
        ],
        "cluster": None, "amount": "₹18,000"
    }
]

CLUSTERS = [
    {
        "id": "CL-019", "name": "QuickCash account network", "platform": "Telegram",
        "posts": 7, "accounts": 4, "risk": "critical", "confidence": 96,
        "firstSeen": "Today, 09:42", "pattern": "Identical account-sale copy and shared contact details",
        "primaryAlertId": "ADV-2841"
    },
    {
        "id": "CL-014", "name": "Finserve onboarding group", "platform": "Instagram + WhatsApp",
        "posts": 4, "accounts": 3, "risk": "high", "confidence": 89,
        "firstSeen": "Today, 08:16", "pattern": "Repeated “no paperwork” current-account offers",
        "primaryAlertId": "ADV-2839"
    },
    {
        "id": "CL-011", "name": "Easy Finance recruitment", "platform": "Facebook",
        "posts": 3, "accounts": 2, "risk": "high", "confidence": 84,
        "firstSeen": "Today, 07:51", "pattern": "Shared phone number and account-holder recruitment",
        "primaryAlertId": "ADV-2837"
    },
    {
        "id": "CL-008", "name": "FastTrack savings referrals", "platform": "X + Open web",
        "posts": 5, "accounts": 4, "risk": "medium", "confidence": 68,
        "firstSeen": "Yesterday, 18:24", "pattern": "Similar landing pages and account-opening language",
        "primaryAlertId": "ADV-2834"
    }
]

GRAPH_EDGES = [
    ("e-ad-campaign-1", "CL-019", "ad-2841", "campaign-019", "grouped in", "Unreviewed"),
    ("e-ad-campaign-2", "CL-019", "ad-2842", "campaign-019", "shared contact", "Unreviewed"),
    ("e-campaign-phone", "CL-019", "campaign-019", "phone", "contact overlap", "Unreviewed"),
    ("e-campaign-url", "CL-019", "campaign-019", "url", "shared link", "Unreviewed"),
    ("e-campaign-upi", "CL-019", "campaign-019", "upi", "payment detail", "Unreviewed"),
    ("e-campaign-image", "CL-019", "campaign-019", "fingerprint", "visual similarity", "Unreviewed"),
]

INVESTIGATIONS = [
    { "id": "INV-1042", "title": "QuickCash account-sale network", "alertId": "ADV-2841", "campaignId": "CL-019", "owner": "A. Sharma", "status": "In progress", "priority": "Critical" },
    { "id": "INV-1041", "title": "Finserve current-account offers", "alertId": "ADV-2839", "campaignId": "CL-014", "owner": "Unassigned", "status": "Open", "priority": "High" },
    { "id": "INV-1038", "title": "Easy Finance account recruitment", "alertId": "ADV-2837", "campaignId": "CL-011", "owner": "R. Mehta", "status": "In progress", "priority": "High" },
]

WATCHLIST = [
    { "id": "WL-201", "value": "+91 98765 4•••2", "type": "Phone number" },
    { "id": "WL-198", "value": "quickcash_accounts", "type": "Social handle" },
    { "id": "WL-184", "value": "wa.me", "type": "Domain" },
]

def seed_database():
    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Ensure Workspace and User
            cur.execute("INSERT INTO workspaces (id, name) VALUES ('WS-001', 'Financial Integrity') ON CONFLICT DO NOTHING;")
            cur.execute("INSERT INTO users (id, workspace_id, display_name, email) VALUES ('USR-001', 'WS-001', 'A. Sharma', 'analyst@finshield.ai') ON CONFLICT DO NOTHING;")

            # 2. Insert Clusters
            for c in CLUSTERS:
                cur.execute("""
                    INSERT INTO campaign_clusters (id, workspace_id, name, pattern, platform, risk, confidence, first_seen, primary_alert_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, pattern = EXCLUDED.pattern, confidence = EXCLUDED.confidence;
                """, (c["id"], "WS-001", c["name"], c["pattern"], c["platform"], c["risk"], c["confidence"], c["firstSeen"], c["primaryAlertId"]))

            # 3. Insert Advertisements & Evidence & Indicators
            for ad in SEED_ADS:
                cur.execute("""
                    INSERT INTO advertisements (
                        id, workspace_id, platform, author_handle, content_text,
                        source_url, asking_amount, risk_level, confidence_score,
                        review_status, time_label
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET content_text = EXCLUDED.content_text;
                """, (
                    ad["id"], "WS-001", ad["platform"], ad["handle"], ad["text"],
                    ad["url"], ad["amount"], ad["risk"], ad["confidence"],
                    "Needs review", ad["time"]
                ))

                if ad["cluster"]:
                    cur.execute("""
                        INSERT INTO campaign_ads (campaign_id, advertisement_id)
                        VALUES (%s, %s) ON CONFLICT DO NOTHING;
                    """, (ad["cluster"], ad["id"]))

                # Clear old indicators and evidence for idempotency
                cur.execute("DELETE FROM extracted_indicators WHERE advertisement_id = %s;", (ad["id"],))
                cur.execute("DELETE FROM ad_evidence WHERE advertisement_id = %s;", (ad["id"],))

                # Indicators
                if ad["phone"] and ad["phone"] != "Not detected":
                    cur.execute("INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value) VALUES (%s, %s, %s, %s);", (ad["id"], "phone", ad["phone"], ad["phone"]))
                if ad["url"]:
                    cur.execute("INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value) VALUES (%s, %s, %s, %s);", (ad["id"], "url", ad["url"], ad["url"]))
                for tag in ad["tags"]:
                    cur.execute("INSERT INTO extracted_indicators (advertisement_id, indicator_type, raw_value, normalized_value) VALUES (%s, %s, %s, %s);", (ad["id"], "tag", tag, tag.lower()))

                # Evidence
                for ev in ad["evidence"]:
                    cur.execute("INSERT INTO ad_evidence (advertisement_id, evidence_text, is_strong_signal) VALUES (%s, %s, %s);", (ad["id"], ev, True))

                # Alerts for High and Critical
                if ad["risk"] in ("critical", "high"):
                    alt_id = f"ALT-0{ad['id'].split('-')[1]}"
                    cur.execute("""
                        INSERT INTO alerts (id, workspace_id, advertisement_id, title, description, severity, triage_status, is_read)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING;
                    """, (
                        alt_id, "WS-001", ad["id"],
                        f"Urgent account-sale advertisement detected on {ad['platform']}" if ad["risk"] == "critical" else f"High-risk financial promotion flagged on {ad['platform']}",
                        f"{ad['handle']} · {' and '.join(ad['tags'])}",
                        ad["risk"], "Needs review", False
                    ))

            # 4. Insert Graph Edges
            for edge_id, camp_id, src, tgt, lbl, rel_state in GRAPH_EDGES:
                cur.execute("""
                    INSERT INTO campaign_graph_edges (id, campaign_id, source_node, target_node, edge_label, relationship_state)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING;
                """, (edge_id, camp_id, src, tgt, lbl, rel_state))

            # 5. Insert Timeline & Notes
            cur.execute("""
                INSERT INTO campaign_timeline (campaign_id, event_time, title, description)
                VALUES ('CL-019', 'Today, 09:42', 'First sample advertisement observed', 'Source record identified with account-sale language.')
                ON CONFLICT DO NOTHING;
            """)

            # 6. Insert Investigations
            for inv in INVESTIGATIONS:
                cur.execute("""
                    INSERT INTO investigations (id, workspace_id, advertisement_id, campaign_id, title, owner_name, status, priority)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING;
                """, (inv["id"], "WS-001", inv["alertId"], inv["campaignId"], inv["title"], inv["owner"], inv["status"], inv["priority"]))

            # 7. Insert Watchlist
            for wl in WATCHLIST:
                cur.execute("""
                    INSERT INTO watchlist_entries (id, workspace_id, indicator_type, indicator_value, normalized_value)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING;
                """, (wl["id"], "WS-001", wl["type"], wl["value"], wl["value"].lower()))

    print("Synthetic database seeded successfully!")

if __name__ == "__main__":
    seed_database()
