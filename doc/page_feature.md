# FinShield AI — Pages, Features & API Endpoints Specification

> **Project Name**: FinShield AI (`sentinel-financial-risk-dashboard`)  
> **Platform Category**: Financial Threat Intelligence & Mule Account Triage Platform  
> **Stack**: React 19 + Vite + Tailwind CSS v4 + Recharts + React Flow (`@xyflow/react`) + PostgreSQL 17 + Python FastAPI  

---

## Table of Contents
1. [Architecture & System Overview](#1-architecture--system-overview)
2. [Pages & Features Breakdown](#2-pages--features-breakdown)
   - [Overview / Dashboard](#overview--dashboard)
   - [Advertisement Analysis (Scanner)](#advertisement-analysis-scanner)
   - [Ad Monitoring / Explorer](#ad-monitoring--explorer)
   - [Campaign DNA (Entity Graph)](#campaign-dna-entity-graph)
   - [Campaign Clusters](#campaign-clusters)
   - [Campaign Investigations (Dossier)](#campaign-investigations-dossier)
   - [Investigations / Case Queue](#investigations--case-queue)
   - [Alerts Center](#alerts-center)
   - [Threat Watchlists](#threat-watchlists)
   - [Threat Analytics](#threat-analytics)
   - [Reports & Exports](#reports--exports)
   - [Workspace Settings & Preferences](#workspace-settings--preferences)
   - [Landing Page](#landing-page)
   - [Alert Details Slide-over Drawer](#alert-details-slide-over-drawer)
3. [REST API Endpoints Specification](#3-rest-api-endpoints-specification)
   - [Authentication & Workspace](#a-authentication--workspace-settings)
   - [Advertisements & Ingestion](#b-advertisements--feed-management)
   - [On-Demand Analysis & OCR](#c-on-demand-analysis--ocr-scanner)
   - [Alerts Center](#d-alerts-center)
   - [Campaigns & Campaign DNA Graph](#e-campaigns--campaign-dna-graph)
   - [Investigations (Cases)](#f-investigations--case-management)
   - [Threat Watchlist](#g-threat-watchlist)
   - [Analytics & Metrics](#h-analytics--metrics)
   - [Live Social Media Ingestion](#i-live-social-media-ingestion)
4. [Page-to-Endpoint & Database Mapping Matrix](#4-page-to-endpoint--database-mapping-matrix)

---

## 1. Architecture & System Overview

FinShield AI bridges the gap between raw, noisy social media/messaging chatter (Telegram, WhatsApp, Instagram, Facebook, X, Open Web) and structured compliance/law enforcement actions against illegal financial activities (mule bank accounts, fake loans, pre-activated cards, UPI fraud).

```mermaid
flowchart TD
    subgraph Data Layer
        A1["PostgreSQL 17 Database"]
        A2["Live Telegram / Reddit Streams"]
        A3["Synthetic Seed Engine"]
    end

    subgraph Backend API (FastAPI)
        B1["/api/v1/advertisements"]
        B2["/api/v1/analysis/inspect (OCR + NLP)"]
        B3["/api/v1/campaigns (Graph Builder)"]
        B4["/api/v1/investigations (Case Engine)"]
        B5["/api/v1/watchlist & alerts"]
    end

    subgraph Frontend Pages (React + Vite)
        C1["Overview & Analytics"]
        C2["Ad Explorer & Live Monitoring"]
        C3["Campaign DNA (React Flow)"]
        C4["Ad Analysis (Image + Text OCR)"]
        C5["Case Management Dossiers"]
    end

    A2 --> B2
    A3 --> A1
    B1 --> A1
    B2 --> A1
    B3 --> A1
    B4 --> A1
    B5 --> A1
    C1 <--> B1
    C2 <--> B1
    C3 <--> B3
    C4 <--> B2
    C5 <--> B4
```

---

## 2. Pages & Features Breakdown

### Overview / Dashboard
- **Route / Hash**: `#overview`
- **File**: `src/pages/OverviewPage.jsx`
- **Purpose**: High-level command center displaying real-time metrics, detection velocity, category distribution, and top priority items requiring analyst action.
- **Key Features**:
  1. **Threat Summary KPIs**: Total analyzed ads, suspicious ads count, high-risk count, critical-risk count, potential campaigns detected, extracted indicators count, platforms monitored.
  2. **Reporting Window Selector**: Dynamic timeframe filter (`Last 24 hours`, `Last 7 days`, `Last 30 days`).
  3. **Sample Detection Trend**: Interactive SVG trend line visualization with baseline comparisons.
  4. **Risk Category Distribution**: Categorized breakdown into:
     - Bank account sales (mule account language)
     - Card & credential offers (ATM, debit & credit cards)
     - Account-opening schemes (current & savings accounts)
     - Payment & commission bait (recruitment language)
  5. **Priority Alerts Table**: Displays recent high-severity items with one-click navigation to investigations or alert details.
  6. **Quick Report Export**: Instant CSV download of prioritized items.

---

### Advertisement Analysis (Scanner)
- **Route / Hash**: `#advertisement-analysis`
- **File**: `src/pages/AnalysisPage.jsx`
- **Purpose**: On-demand sandbox for compliance officers to paste ad text, provide source URLs, or upload screenshot banners for instant AI inspection.
- **Key Features**:
  1. **Multi-input Inspection Form**: Text input (up to 5,000 characters), platform selector (`Telegram`, `Instagram`, `Facebook`, `X / Twitter`, `Open web`), and direct post source URL.
  2. **Image / Banner Upload**: Drag-and-drop or file picker supporting image attachments (up to 10 MB) with live visual preview.
  3. **One-Click Example Loader**: Populates pre-configured test cases (e.g., Telegram mule account offer) for rapid testing and demonstrations.
  4. **Simulated / Live Risk Scoring**: Calculates risk rating (`0–100`) and categorizes as `Critical`, `High`, `Medium`, or `Low`.
  5. **Contextual Phrase Highlighter**: In-text `<mark>` highlighting of detected high-risk phrases (*"sell your account"*, *"bank accounts available"*, *"instant transfer"*).
  6. **Entity Extraction Grid**: Automatically surfaces phone numbers, URLs/domains, and UPI payment handles (`xyz@upi`).
  7. **Related Content Matching**: Ranks existing database ads that share semantic wording or entity overlaps.

---

### Ad Monitoring / Explorer
- **Route / Hash**: `#ad-monitoring` & `#advertisement-explorer`
- **Files**: `src/pages/MonitoringPage.jsx`, `src/pages/AdvertisementsPage.jsx`
- **Purpose**: Searchable, filterable feed table of all public advertisements captured across monitored channels.
- **Key Features**:
  1. **Omni-Search Bar**: Full-text fuzzy search across ad copy, phone numbers, UPI IDs, URLs, and handles.
  2. **Multi-dimensional Filters**: Filter by platform (`Telegram`, `Instagram`, `Facebook`, etc.) and risk severity (`Critical`, `High`, `Medium`, `Low`).
  3. **Dynamic Sorting**: Column sorting by Advertisement ID, Platform, or Risk Score.
  4. **Status Management**: Inline status dropdown (`Needs review`, `In progress`, `Closed`) with instant state synchronization.
  5. **Indicator Tags**: Compact badges showing detected signals (e.g., *Bank account sale*, *Instant transfer*).
  6. **Pagination Controls**: Configurable row counts (default 5 per page) with record count metrics.
  7. **Detail Drawer Trigger**: Clicking any row opens the full audit dossier in the slide-over drawer.

---

### Campaign DNA (Entity Graph)
- **Route / Hash**: `#campaign-dna`
- **File**: `src/pages/CampaignDNAPage.jsx`
- **Purpose**: Signature graph intelligence feature that visually unmasks coordinated fraud syndicates and multi-account networks using `@xyflow/react` (React Flow).
- **Key Features**:
  1. **Interactive Node-Link Canvas**: Pan, zoom, minimap, controls, and fit-view capabilities.
  2. **Multi-type Entity Nodes**:
     - `campaign`: The central coordinated syndicate hub (`CL-019`)
     - `ad`: Individual advertisement posts (`ADV-2841`, `ADV-2842`)
     - `phone`: Shared contact numbers
     - `url`: Shared landing pages or domains
     - `upi`: Shared payment collection handles (`quickcash@upi`)
     - `image`: Shared visual banner fingerprints (perceptual hash / SHA-256)
  3. **Labeled & Animated Edges**: Directed relationship links displaying evidence connections (*grouped in*, *shared contact*, *shared link*, *payment detail*, *visual similarity*).
  4. **Filter & Search Toolbar**: Filter graph elements by platform, risk severity, or entity text.
  5. **Inspector Sidebar**: Displays selected node/edge metadata, evidence verification checks, and one-click transition to full case file investigations.

---

### Campaign Clusters
- **Route / Hash**: `#campaign-clusters`
- **File**: `src/pages/ClustersPage.jsx`
- **Purpose**: High-level directory of identified coordinated networks and account clusters.
- **Key Features**:
  1. **Cluster Cards Feed**: Shows cluster ID, network name, primary platform, total linked posts count, total linked accounts, first-seen timestamp, and confidence rating.
  2. **Cluster Fact Sheet**: Detailed breakdown of coordination patterns (e.g., *"Identical account-sale copy and shared contact details"*).
  3. **Linked Ads Direct Access**: Button to immediately pivot from a cluster to its specific advertisements in the explorer.
  4. **Search Filter**: Search clusters by title, platform, or pattern string.

---

### Campaign Investigations (Dossier)
- **Route / Hash**: `#campaign-investigations`
- **File**: `src/pages/CampaignDetailsPage.jsx`
- **Purpose**: Case dossier management for a single campaign cluster.
- **Key Features**:
  1. **Case Selector**: Dropdown to switch between active campaign files.
  2. **Evidence Timeline**: Chronological milestone log detailing when the first post appeared, when copy was duplicated, and when entity overlaps were confirmed.
  3. **Related Posts Grid**: Summary of all posts linked into the cluster.
  4. **Relationship Review Matrix**: Allows analysts to audit individual links (e.g., shared contact, shared domain) and toggle their status (`Unreviewed`, `Flagged`, `Dismissed`).
  5. **Analyst Notes Journal**: Form to submit timestamped case observations and audit trails.
  6. **Export Evidence JSON**: Downloads a complete evidentiary payload for legal or reporting purposes.

---

### Investigations / Case Queue
- **Route / Hash**: `#investigations`
- **File**: `src/pages/InvestigationsPage.jsx`
- **Purpose**: Formal case tracking system (`INV-xxxx`) for assignable analyst work queues.
- **Key Features**:
  1. **Queue KPI Cards**: Real-time count of Open Cases, In Progress, Critical Priority, and Resolved cases.
  2. **Case Table**: Displays Case Title, Related Alert link, Priority (`Critical`, `High`, `Medium`, `Low`), Assigned Owner, Status (`Open`, `In progress`, `Closed`), and last updated timestamp.
  3. **Inline Reassignment**: Dropdown to assign or reassign investigators (`Unassigned`, `A. Sharma`, `R. Mehta`, `S. Iyer`).
  4. **Create Investigation Modal**: Form to spin up a new case linked directly to an existing flagged advertisement.
  5. **Export CSV**: One-click download of the complete active case queue.

---

### Alerts Center
- **Route / Hash**: `#alerts-center`
- **File**: `src/pages/AlertsPage.jsx`
- **Purpose**: Notification triage center for incoming high-risk signals.
- **Key Features**:
  1. **View Tabs**: Filter alerts by `All alerts`, `Unread` (with dynamic counter badge), and `Read`.
  2. **Severity Filter**: Filter by `Critical`, `High`, `Medium`, and `Low`.
  3. **Bulk Actions**: *"Mark all read"* button.
  4. **Individual Card Actions**: Toggle read/unread state, change investigation status dropdown, or jump straight to ad details.

---

### Threat Watchlists
- **Route / Hash**: `#watchlists`
- **File**: `src/pages/WatchlistPage.jsx`
- **Purpose**: Proactive monitoring of known bad actors, numbers, and domains.
- **Key Features**:
  1. **Tracked Indicator Types**: `Phone number`, `Social handle`, `Domain`, `URL`, `Payment identifier`.
  2. **Automatic Feed Matching**: Automatically scans incoming advertisements against watchlisted values and computes real-time match counts.
  3. **Add Indicator Modal**: Simple modal with type selection, validation, and duplicate prevention.
  4. **Indicator Deletion**: Remove obsolete or cleared indicators.
  5. **CSV Export**: Export watchlist definitions for sharing or ingestion into SIEM platforms.

---

### Threat Analytics
- **Route / Hash**: `#analytics`
- **File**: `src/pages/AnalyticsPage.jsx`
- **Purpose**: Macro-level visual trend analysis using Recharts.
- **Key Features**:
  1. **Reporting Window**: Configurable windows (`7 days`, `30 days`, `90 days`).
  2. **Detection Trend (AreaChart)**: Dual-area gradient chart contrasting total scanned posts vs. confirmed suspicious examples over time.
  3. **Risk Mix (PieChart)**: Donut chart displaying proportion of Critical, High, Medium, and Low risk items.
  4. **Platform Breakdown (Horizontal BarChart)**: Visual distribution of fraud across Telegram, Instagram, Facebook, X, and the Web.
  5. **Frequent Indicators Frequency Bars**: Top repeated keywords, tags, and phrases with relative intensity bars.
  6. **Campaign Size Distribution & Case Status Bar**: Visual proportions of case progress.

---

### Reports & Exports
- **Route / Hash**: `#reports`
- **File**: `src/pages/ReportsPage.jsx`
- **Purpose**: Formal intelligence reporting and document generation.
- **Key Features**:
  1. **Print-Ready Brief Preview**: Formatted intelligence report designed for clean CSS `@media print` physical printing or PDF generation.
  2. **Download Evidence JSON**: Structured dump of the campaign cluster, related posts, and evidence points.
  3. **Download Ad Records CSV**: Tabular CSV export of all advertisement records.

---

### Workspace Settings & Preferences
- **Route / Hash**: `#settings`
- **Files**: `src/pages/SettingsPage.jsx`, `src/components/SettingsDialog.jsx`
- **Purpose**: Local and user configuration.
- **Key Features**:
  1. **Profile Display**: Workspace Name and Analyst Display Name configuration.
  2. **Appearance**: Theme selection (`Dark` vs. `Midnight Contrast`) and table row density (`Comfortable` vs. `Compact`).
  3. **Security & Privacy**: Toggle to mask sensitive phone numbers (e.g. `+91 98765 4•••2`).
  4. **Notifications**: Toggle browser alert behavior and campaign signal groupings.
  5. **Reset Demo Data**: One-click restore of sample dataset to original baseline state.

---

### Landing Page
- **Route / Hash**: `#landing-page`
- **File**: `src/pages/LandingPage.jsx`
- **Purpose**: Showcase portal with hero animations, value props, workflow explainer, and quick-start links.

---

### Alert Details Slide-over Drawer
- **File**: `src/components/AlertDetails.jsx`
- **Purpose**: Deep inspection panel accessible from any page.
- **Key Features**: Displays raw unedited post copy, source link, confidence score gauge, detection evidence list, masked phone number, asking price, linked campaign, *"Open investigation"* button, and review queue toggle.

---

## 3. REST API Endpoints Specification

Base URL: `http://localhost:8000/api/v1`

### A. Authentication & Workspace Settings

#### `GET /api/v1/auth/me`
- **Description**: Returns the active analyst profile.
- **Response `200 OK`**:
```json
{
  "id": "USR-001",
  "displayName": "A. Sharma",
  "email": "analyst@finshield.ai",
  "role": "Investigator · Tier 2",
  "workspaceId": "WS-001"
}
```

#### `GET /api/v1/workspace/settings`
- **Description**: Retrieves current workspace display and security preferences.
- **Response `200 OK`**:
```json
{
  "workspaceName": "Financial Integrity",
  "analystName": "A. Sharma",
  "theme": "dark",
  "tableDensity": "comfortable",
  "maskSensitiveData": true,
  "criticalAlerts": true,
  "clusterSignals": true,
  "notificationsEnabled": true
}
```

#### `PUT /api/v1/workspace/settings`
- **Description**: Updates workspace settings.
- **Request Body**:
```json
{
  "workspaceName": "Financial Integrity - Tier 1",
  "theme": "contrast",
  "tableDensity": "compact",
  "maskSensitiveData": true
}
```

---

### B. Advertisements & Feed Management

#### `GET /api/v1/advertisements`
- **Description**: Paginated list of ingested advertisements with search and filtering.
- **Query Parameters**:
  - `page` (int, default: 1)
  - `pageSize` (int, default: 10)
  - `query` (string, optional: search query)
  - `platform` (string, optional: `Telegram`, `Instagram`, etc.)
  - `risk` (string, optional: `critical`, `high`, `medium`, `low`)
  - `status` (string, optional: `Needs review`, `In progress`, `Closed`)
  - `sortBy` (string, default: `posted_at`)
  - `sortDir` (string, default: `desc`)
- **Response `200 OK`**:
```json
{
  "total": 45,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5,
  "items": [
    {
      "id": "ADV-2841",
      "platform": "Telegram",
      "handle": "@quickcash_accounts",
      "text": "Verified bank accounts available. Full access, instant transfer enabled. DM for today's rates.",
      "sourceUrl": "https://t.me/quickcash_accounts",
      "mediaUrl": null,
      "risk": "critical",
      "confidence": 98,
      "amount": "₹8,000–₹25,000",
      "reviewStatus": "Needs review",
      "isBookmarked": false,
      "timeLabel": "2 min ago",
      "tags": ["Bank account sale", "Instant transfer"],
      "phone": "+91 98765 4•••2",
      "cluster": "CL-019 · 7 linked posts",
      "evidence": [
        "Explicit offer to sell verified accounts",
        "“Instant transfer” signals mule-account intent",
        "Same copy found in 6 other posts"
      ]
    }
  ]
}
```

#### `GET /api/v1/advertisements/:id`
- **Description**: Detailed record of a single advertisement, its indicators, and evidence.
- **Response `200 OK`**: Object matching the schema above plus full raw entity records.

#### `PATCH /api/v1/advertisements/:id/status`
- **Description**: Updates review status.
- **Request Body**:
```json
{ "status": "In progress" }
```

#### `POST /api/v1/advertisements/:id/toggle-review`
- **Description**: Toggles bookmark/review flag.
- **Response `200 OK`**: `{ "id": "ADV-2841", "isBookmarked": true }`

#### `GET /api/v1/advertisements/export`
- **Description**: Streams a CSV file containing all filtered advertisement records.

---

### C. On-Demand Analysis & OCR Scanner

#### `POST /api/v1/analysis/inspect`
- **Description**: Primary intelligence endpoint. Takes raw text, URL, and optional screenshot image; runs OCR (EasyOCR), regex entity extractors, and risk scoring.
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `text` (string, required)
  - `platform` (string, default: `Telegram`)
  - `sourceUrl` (string, optional)
  - `image` (file binary, optional: image/jpeg, image/png)
- **Response `200 OK`**:
```json
{
  "score": 94,
  "risk": "Critical",
  "platform": "Telegram",
  "ocrExtractedText": "EXCLUSIVE OFFER BANK ACCOUNTS FULL KIT UPI PIN WA 9876543210",
  "phrases": [
    "bank accounts available",
    "full access",
    "instant transfer"
  ],
  "phones": ["+91 98765 43210"],
  "urls": ["https://t.me/quickcash_accounts"],
  "upiIds": ["quickcash@okaxis"],
  "imageHash": "8f2a1c9e3b4d5a6f",
  "explanation": "The sample matched 3 high-risk account-sale phrases and contains direct contact indicators.",
  "relatedAds": [
    { "id": "ADV-2841", "risk": "critical", "overlapScore": 0.89 }
  ]
}
```

---

### D. Alerts Center

#### `GET /api/v1/alerts`
- **Description**: Lists threat notifications with unread counts.
- **Query Parameters**: `severity`, `view` (`All alerts`, `Unread`, `Read`), `query`
- **Response `200 OK`**:
```json
{
  "unreadCount": 3,
  "items": [
    {
      "id": "ALT-0301",
      "advertisementId": "ADV-2841",
      "severity": "critical",
      "title": "Urgent account-sale advertisement detected",
      "description": "@quickcash_accounts · Bank account sale and Instant transfer",
      "timestamp": "2 min ago",
      "isRead": false,
      "triageStatus": "Needs review"
    }
  ]
}
```

#### `PATCH /api/v1/alerts/:id/read`
- **Description**: Toggle read/unread state.
- **Request Body**: `{ "isRead": true }`

#### `POST /api/v1/alerts/mark-all-read`
- **Description**: Marks all active alerts as read.

#### `PATCH /api/v1/alerts/:id/status`
- **Description**: Changes triage status (`Needs review`, `In progress`, `Closed`).

---

### E. Campaigns & Campaign DNA Graph

#### `GET /api/v1/campaigns`
- **Description**: Retrieves all identified campaign clusters.
- **Response `200 OK`**:
```json
[
  {
    "id": "CL-019",
    "name": "QuickCash account network",
    "platform": "Telegram",
    "posts": 7,
    "accounts": 4,
    "risk": "critical",
    "confidence": 96,
    "firstSeen": "Today, 09:42",
    "pattern": "Identical account-sale copy and shared contact details",
    "primaryAlertId": "ADV-2841",
    "status": "Open"
  }
]
```

#### `GET /api/v1/campaigns/:id`
- **Description**: Detailed dossier for a campaign cluster including evidence timeline and analyst notes.

#### `GET /api/v1/campaigns/:id/graph`
- **Description**: Generates formatted nodes and edges for the `@xyflow/react` Campaign DNA view.
- **Response `200 OK`**:
```json
{
  "nodes": [
    { "id": "campaign-019", "type": "campaign", "position": { "x": 390, "y": 200 }, "data": { "label": "Potential campaign · CL-019", "detail": "7 linked posts · Telegram" } },
    { "id": "ad-2841", "type": "ad", "position": { "x": 80, "y": 70 }, "data": { "alertId": "ADV-2841", "label": "ADV-2841 · Telegram", "detail": "Critical · sample score 98/100" } },
    { "id": "phone", "type": "phone", "position": { "x": 360, "y": 40 }, "data": { "label": "Shared phone", "detail": "+91 98765 4•••2" } },
    { "id": "upi", "type": "upi", "position": { "x": 690, "y": 300 }, "data": { "label": "Payment ID", "detail": "quickcash@upi" } }
  ],
  "edges": [
    { "id": "e-ad-campaign-1", "source": "ad-2841", "target": "campaign-019", "label": "grouped in", "animated": true },
    { "id": "e-campaign-phone", "source": "campaign-019", "target": "phone", "label": "contact overlap" },
    { "id": "e-campaign-upi", "source": "campaign-019", "target": "upi", "label": "payment detail" }
  ]
}
```

#### `PATCH /api/v1/campaigns/:id/status`
- **Description**: Update cluster status (`Open`, `In review`, `Closed`).

#### `POST /api/v1/campaigns/:id/notes`
- **Description**: Append an analyst note to the campaign dossier.
- **Request Body**: `{ "text": "Corroborated UPI ID with cyber crime intelligence advisory." }`

#### `PATCH /api/v1/campaigns/:id/relations/:relationKey`
- **Description**: Set relation review state (`Unreviewed`, `Flagged`, `Dismissed`).

#### `GET /api/v1/campaigns/:id/export`
- **Description**: Returns formatted JSON intelligence brief.

---

### F. Investigations (Case Management)

#### `GET /api/v1/investigations`
- **Description**: Returns case queue and status aggregation metrics.
- **Response `200 OK`**:
```json
{
  "stats": {
    "openCases": 3,
    "inProgress": 2,
    "criticalPriority": 1,
    "resolved": 4
  },
  "items": [
    {
      "id": "INV-1042",
      "title": "QuickCash account-sale network",
      "alertId": "ADV-2841",
      "owner": "A. Sharma",
      "status": "In progress",
      "priority": "Critical",
      "updated": "2 min ago"
    }
  ]
}
```

#### `POST /api/v1/investigations`
- **Description**: Create new investigation case from an advertisement.
- **Request Body**:
```json
{
  "alertId": "ADV-2841",
  "title": "@quickcash_accounts — Bank account sale",
  "owner": "A. Sharma",
  "priority": "Critical"
}
```

#### `PATCH /api/v1/investigations/:id`
- **Description**: Updates case status or assigned owner.
- **Request Body**: `{ "status": "Closed", "owner": "R. Mehta" }`

#### `GET /api/v1/investigations/export`
- **Description**: Downloads case queue as CSV.

---

### G. Threat Watchlist

#### `GET /api/v1/watchlist`
- **Description**: Lists tracked indicators along with dynamically calculated live matches across the feed.
- **Response `200 OK`**:
```json
[
  {
    "id": "WL-201",
    "type": "Phone number",
    "value": "+91 98765 4•••2",
    "added": "Today, 10:14",
    "matches": 2
  }
]
```

#### `POST /api/v1/watchlist`
- **Description**: Add new indicator to monitor.
- **Request Body**:
```json
{
  "type": "Phone number",
  "value": "+91 98765 43210"
}
```

#### `DELETE /api/v1/watchlist/:id`
- **Description**: Removes an indicator from the watchlist.

#### `GET /api/v1/watchlist/export`
- **Description**: Downloads watchlist as CSV.

---

### H. Analytics & Metrics

#### `GET /api/v1/analytics/overview`
- **Description**: Provides aggregated KPIs for the header and overview cards.

#### `GET /api/v1/analytics/trends?period=7d|30d|90d`
- **Description**: Returns daily/weekly time series data for Recharts AreaChart.
- **Response `200 OK`**:
```json
[
  { "day": "Mon", "total": 42, "suspicious": 12 },
  { "day": "Tue", "total": 55, "suspicious": 18 },
  { "day": "Wed", "total": 49, "suspicious": 16 }
]
```

#### `GET /api/v1/analytics/distributions`
- **Description**: Returns risk categories, platform distribution, and frequent indicators for the analytics screen.

---

### I. Live Social Media Ingestion

#### `POST /api/v1/ingestion/sync`
- **Description**: Triggers an on-demand ingestion run against connected public feeds (Telegram channel previews and Reddit scam feeds).
- **Request Body**:
```json
{
  "sources": ["telegram", "reddit"],
  "channels": ["mule_alerts", "financial_scams_in"]
}
```
- **Response `200 OK`**:
```json
{
  "fetchedCount": 14,
  "flaggedCount": 6,
  "newCampaigns": 1,
  "status": "completed"
}
```

---

## 4. Page-to-Endpoint & Database Mapping Matrix

| Page Name | Frontend File | REST Endpoints Used | Primary PostgreSQL Tables |
| :--- | :--- | :--- | :--- |
| **Overview** | `OverviewPage.jsx` | `GET /analytics/overview`<br/>`GET /analytics/trends`<br/>`GET /advertisements?limit=5` | `advertisements`, `campaign_clusters`, `investigations` |
| **Ad Analysis** | `AnalysisPage.jsx` | `POST /analysis/inspect`<br/>`GET /advertisements?query=...` | `advertisements`, `ad_evidence`, `extracted_indicators` |
| **Ad Monitoring / Explorer** | `MonitoringPage.jsx`<br/>`AdvertisementsPage.jsx` | `GET /advertisements`<br/>`PATCH /advertisements/:id/status`<br/>`POST /advertisements/:id/toggle-review` | `advertisements`, `extracted_indicators`, `ad_evidence` |
| **Campaign DNA** | `CampaignDNAPage.jsx` | `GET /campaigns/:id/graph`<br/>`GET /campaigns` | `campaign_clusters`, `campaign_graph_edges`, `campaign_ads` |
| **Campaign Clusters** | `ClustersPage.jsx` | `GET /campaigns` | `campaign_clusters`, `campaign_ads` |
| **Campaign Investigations** | `CampaignDetailsPage.jsx` | `GET /campaigns/:id`<br/>`POST /campaigns/:id/notes`<br/>`PATCH /campaigns/:id/relations/:key`<br/>`GET /campaigns/:id/export` | `campaign_clusters`, `campaign_notes`, `campaign_timeline`, `campaign_graph_edges` |
| **Investigations Queue** | `InvestigationsPage.jsx` | `GET /investigations`<br/>`POST /investigations`<br/>`PATCH /investigations/:id` | `investigations`, `advertisements`, `users` |
| **Alerts Center** | `AlertsPage.jsx` | `GET /alerts`<br/>`PATCH /alerts/:id/read`<br/>`POST /alerts/mark-all-read`<br/>`PATCH /alerts/:id/status` | `alerts`, `advertisements` |
| **Threat Watchlists** | `WatchlistPage.jsx` | `GET /watchlist`<br/>`POST /watchlist`<br/>`DELETE /watchlist/:id` | `watchlist_entries`, `extracted_indicators` |
| **Analytics** | `AnalyticsPage.jsx` | `GET /analytics/trends`<br/>`GET /analytics/distributions` | `advertisements`, `campaign_clusters`, `investigations` |
| **Reports** | `ReportsPage.jsx` | `GET /campaigns/:id/export`<br/>`GET /advertisements/export` | `campaign_clusters`, `advertisements` |
| **Settings** | `SettingsPage.jsx` | `GET /workspace/settings`<br/>`PUT /workspace/settings` | `workspaces`, `users` |
