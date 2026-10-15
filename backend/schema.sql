-- PostgreSQL Schema for FinShield AI (sentinel-financial-risk-dashboard)

-- 1. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Financial Integrity',
    theme VARCHAR(20) DEFAULT 'dark',
    table_density VARCHAR(20) DEFAULT 'comfortable',
    mask_sensitive_data BOOLEAN DEFAULT TRUE,
    critical_alerts_enabled BOOLEAN DEFAULT TRUE,
    cluster_signals_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users / Analysts
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Investigator · Tier 2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Advertisements
CREATE TABLE IF NOT EXISTS advertisements (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'ADV-2841'
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
    platform VARCHAR(50) NOT NULL, -- 'Telegram', 'Instagram', 'Facebook', 'X / Twitter', 'Open web'
    author_handle VARCHAR(100), -- '@quickcash_accounts'
    content_text TEXT NOT NULL,
    source_url VARCHAR(1024),
    media_url VARCHAR(1024),
    image_hash VARCHAR(128),
    asking_amount VARCHAR(100),
    risk_level VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
    review_status VARCHAR(30) DEFAULT 'Needs review', -- 'Needs review', 'In progress', 'Closed'
    is_bookmarked BOOLEAN DEFAULT FALSE,
    time_label VARCHAR(50) DEFAULT 'Just now',
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ads_risk_platform ON advertisements(risk_level, platform);
CREATE INDEX IF NOT EXISTS idx_ads_review_status ON advertisements(review_status);

-- 4. Extracted Indicators
CREATE TABLE IF NOT EXISTS extracted_indicators (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id VARCHAR(64) REFERENCES advertisements(id) ON DELETE CASCADE,
    indicator_type VARCHAR(50) NOT NULL, -- 'phone', 'url', 'domain', 'upi', 'tag'
    raw_value VARCHAR(255) NOT NULL,
    normalized_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_indicator_normalized ON extracted_indicators(normalized_value);
CREATE INDEX IF NOT EXISTS idx_indicator_ad ON extracted_indicators(advertisement_id);

-- 5. Ad Evidence
CREATE TABLE IF NOT EXISTS ad_evidence (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id VARCHAR(64) REFERENCES advertisements(id) ON DELETE CASCADE,
    phrase VARCHAR(255),
    evidence_text TEXT NOT NULL,
    is_strong_signal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_ad ON ad_evidence(advertisement_id);

-- 6. Campaign Clusters
CREATE TABLE IF NOT EXISTS campaign_clusters (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'CL-019'
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    pattern TEXT NOT NULL,
    platform VARCHAR(100),
    risk VARCHAR(20) NOT NULL,
    confidence INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'Open',
    first_seen VARCHAR(50) DEFAULT 'Today, 09:42',
    primary_alert_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Campaign <-> Advertisements Mapping
CREATE TABLE IF NOT EXISTS campaign_ads (
    campaign_id VARCHAR(64) REFERENCES campaign_clusters(id) ON DELETE CASCADE,
    advertisement_id VARCHAR(64) REFERENCES advertisements(id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, advertisement_id)
);

-- 8. Campaign Graph Edges (React Flow / Campaign DNA)
CREATE TABLE IF NOT EXISTS campaign_graph_edges (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'e-ad-campaign-1'
    campaign_id VARCHAR(64) REFERENCES campaign_clusters(id) ON DELETE CASCADE,
    source_node VARCHAR(64) NOT NULL,
    target_node VARCHAR(64) NOT NULL,
    edge_label VARCHAR(100) NOT NULL,
    relationship_state VARCHAR(30) DEFAULT 'Unreviewed', -- 'Unreviewed', 'Flagged', 'Dismissed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Campaign Notes
CREATE TABLE IF NOT EXISTS campaign_notes (
    id BIGSERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) REFERENCES campaign_clusters(id) ON DELETE CASCADE,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) DEFAULT 'Analyst',
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Campaign Timeline
CREATE TABLE IF NOT EXISTS campaign_timeline (
    id BIGSERIAL PRIMARY KEY,
    campaign_id VARCHAR(64) REFERENCES campaign_clusters(id) ON DELETE CASCADE,
    event_time VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Investigations / Cases
CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'INV-1042'
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
    advertisement_id VARCHAR(64) REFERENCES advertisements(id) ON DELETE SET NULL,
    campaign_id VARCHAR(64) REFERENCES campaign_clusters(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    owner_name VARCHAR(100) DEFAULT 'Unassigned',
    status VARCHAR(30) DEFAULT 'Open', -- 'Open', 'In progress', 'Closed'
    priority VARCHAR(20) DEFAULT 'High', -- 'Critical', 'High', 'Medium', 'Low'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status, priority);

-- 12. Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'ALT-0301'
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
    advertisement_id VARCHAR(64) REFERENCES advertisements(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    triage_status VARCHAR(30) DEFAULT 'Needs review',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);

-- 13. Watchlist Entries
CREATE TABLE IF NOT EXISTS watchlist_entries (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'WL-201'
    workspace_id VARCHAR(64) REFERENCES workspaces(id) ON DELETE SET NULL,
    indicator_type VARCHAR(50) NOT NULL, -- 'Phone number', 'Social handle', 'Domain', 'URL', 'Payment identifier'
    indicator_value VARCHAR(255) NOT NULL,
    normalized_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_watchlist_normalized ON watchlist_entries(normalized_value);

-- 14. Scanned URLs (URL Threat Scanner)
CREATE TABLE IF NOT EXISTS scanned_urls (
    id VARCHAR(64) PRIMARY KEY,
    url VARCHAR(1024) NOT NULL,
    domain VARCHAR(255),
    classification VARCHAR(50) DEFAULT 'SUSPICIOUS',
    risk_score INTEGER DEFAULT 0,
    target_brand VARCHAR(100),
    is_live BOOLEAN DEFAULT FALSE,
    http_status INTEGER,
    page_title VARCHAR(512),
    detected_forms TEXT[],
    threat_signals TEXT[],
    source VARCHAR(100) DEFAULT 'On-Demand Scanner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scanned_urls_created ON scanned_urls(created_at);
CREATE INDEX IF NOT EXISTS idx_scanned_urls_class ON scanned_urls(classification);
