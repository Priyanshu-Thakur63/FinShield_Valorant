# 🛡️ FinShield AI — Autonomous Financial Threat Intelligence & Mule Network Defense

> **Next-generation cyber defense platform engineered to detect, correlate, and dismantle coordinated financial fraud campaigns, mule account recruitment networks, and banking phishing infrastructure across social media and the open web.**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![React Flow](https://img.shields.io/badge/React_Flow-FF0072?style=for-the-badge&logo=react-table&logoColor=white)](https://reactflow.dev)

---

## 📋 Executive Overview

Financial institutions and regulatory authorities face an explosion of decentralized cyber-enabled fraud: **mule-account recruitment campaigns, instant-loan scams, and credential phishing attacks** orchestrated across Telegram, Instagram, Reddit, Facebook, and disposable web domains.

**FinShield AI** unifies multi-platform web scraping, heuristic AI threat classifiers, automated URL probing, and graph knowledge bases into an enterprise security operations dashboard. Analysts can monitor live threat streams in real time, explore entity relationships via **Campaign DNA**, and investigate fraud rings before funds are siphoned.

---

## 🚀 Key Features

### 1. 📊 Real-Data Threat Analytics Dashboard
- **Live PostgreSQL Telemetry**: Real-time aggregation of advertisements, threat velocity, and risk severity distribution directly from PostgreSQL.
- **Dynamic Time-Series Activity Graph**: Area charts with selectable time windows (**Last 24 Hours**, **Last 7 Days**, **Last 30 Days**, **All Time**) with customizable overlays for phishing URL detections.
- **Targeted Brand Impact Matrix**: Automated classification of attacks targeting major Indian financial institutions (**State Bank of India**, **HDFC Bank**, **ICICI Bank**, **Reserve Bank of India**).
- **Multi-Platform Channel Breakdown**: Comparative volume and AI confidence scores across Reddit, Instagram, Facebook, and Web feeds.
- **IoC & Signature Frequency**: Real-time frequency meters tracking extracted bank account sales, loan bait, and credential harvesting signals.

### 2. 🧬 Interactive Campaign DNA Graph (Knowledge Graph)
- **Coordinated Cluster Visualization**: Interactive node-link relationship canvas powered by `@xyflow/react`.
- **Dynamic Entity Mapping**: Visualizes correlated advertisements, shared public phone numbers, spoofed domains, payment identifiers (UPI), and visual image fingerprints.
- **Cluster Selector**: Switch between discovered networks including:
  - `CL-019`: QuickCash account network (Phishing domains targeting SBI, ICICI, HDFC)
  - `CL-014`: Finserve onboarding group (Instagram accounts & financial promotion tags)
  - `CL-011`: Easy Finance recruitment (Facebook group recruitment & loan assistance)
  - `CL-008`: FastTrack savings referrals (Open web & Reddit instant transfer schemes)
- **Deep Inspection**: Click any node to review author handles, asking amounts, content snippets, and jump directly to case files.

### 3. 🔍 Real-Time URL Threat & Phishing Scanner
- **Active URL Probing**: Evaluates live HTTP status codes, SSL certificate validity, page titles, and credential entry forms.
- **Heuristic Threat Engine**: Detects homoglyph attacks, brand impersonation, high-risk disposable TLDs (`.top`, `.xyz`, `.club`), and redirection chains.
- **Automated Web Threat Feeds**: Periodically scrapes OpenPhish and cybersecurity intelligence feeds, classifying and persisting threats to PostgreSQL.

### 4. 🌐 Multi-Source Ingestion Pipeline
- **Reddit Threat Intelligence**: Live RSS/API scraper monitoring subreddits including `r/phishing`, `r/Scams`, and `r/malware`.
- **Apify Cloud Scraping**: Scrapers configured for Instagram hashtags, Facebook community posts, and open web crawlers.
- **On-Demand Ad Inspection**: Multi-modal inspection engine supporting manual text analysis, platform simulation, and image artifact extraction.

### 5. 📁 SOC Case Management & Investigations
- **Triage Queue**: Move threats through *Needs review*, *In progress*, and *Closed* stages.
- **Investigator Assignment**: Assign priority tiers (Critical, High, Medium, Low) and tracking leads.
- **Watchlist Engine**: Real-time pattern matching against tracked telephone numbers, social handles, and crypto/UPI addresses.
- **Export Capabilities**: Generate print-ready executive summaries, CSV threat exports, and JSON case bundles.

---

## 🏗️ System Architecture

```text
               ┌────────────────────────────────────────────────────────┐
               │           PUBLIC THREAT & WEB FEED SOURCES             │
               │   Reddit (r/phishing, r/Scams) · Instagram · Facebook  │
               │         OpenPhish Feeds · Open Web Crawlers            │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                  [Ingestion Engine]
                       Apify Crawlers · RSS Clients · Feed Scrapers
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │              FINSHIELD AI FASTAPI BACKEND               │
               │                                                        │
               │  ┌───────────────────────┐  ┌───────────────────────┐  │
               │  │ Heuristic Classifier  │  │   Active URL Probe    │  │
               │  │  Score: 0 - 100 Risk  │  │  SSL, Forms, Brands   │  │
               │  └───────────┬───────────┘  └───────────┬───────────┘  │
               │              │                          │              │
               │              └────────────┬─────────────┘              │
               │                           ▼                            │
               │              ┌─────────────────────────┐               │
               │              │ Entity Correlation Core │               │
               │              │  Campaign Clustering    │               │
               │              └────────────┬────────────┘               │
               └───────────────────────────┼────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                  POSTGRESQL DATABASE                   │
               │  advertisements · campaign_clusters · campaign_ads     │
               │  extracted_indicators · scanned_urls · investigations   │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                      [REST API]
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │              VITE + REACT 19 FRONTEND APP              │
               │                                                        │
               │  ┌──────────────────────┐    ┌──────────────────────┐  │
               │  │   Threat Analytics   │    │     Campaign DNA     │  │
               │  │ (Recharts Area/Donut)│    │(ReactFlow Node Graph)│  │
               │  └──────────────────────┘    └──────────────────────┘  │
               │  ┌──────────────────────┐    ┌──────────────────────┐  │
               │  │   Threat Explorer    │    │   Case Investigations│  │
               │  │ (Triage & Filtering) │    │  (Watchlists & Export│  │
               │  └──────────────────────┘    └──────────────────────┘  │
               └────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Recharts, `@xyflow/react` (React Flow), TailwindCSS, DM Sans / DM Mono Typography |
| **Backend** | Python 3.12+, FastAPI, Uvicorn, Pydantic, Psycopg2 (Connection Pooling) |
| **Database** | PostgreSQL 15+ (Relational schema, B-Tree indexes, GIN search) |
| **Web Scraping** | Apify Actors (Instagram/Facebook/Web Content Crawler), Feedparser, Requests, Regex IOC Parsers |
| **Data Formats** | REST JSON APIs, CSV exports, JSON evidence files |

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- **PostgreSQL** instance running locally or on cloud

---

### Step 1: Database Setup
1. Create a PostgreSQL database named `finshield_db`:
   ```bash
   createdb finshield_db
   ```
2. Initialize tables with schema:
   ```bash
   psql -d finshield_db -f backend/schema.sql
   ```

---

### Step 2: Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify/update `.env` configuration:
   ```env
   DATABASE_URL=postgresql://postgres:123456789@localhost:5432/finshield_db
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=123456789
   DB_NAME=finshield_db
   PORT=8000
   HOST=0.0.0.0
   APIFY_API_TOKEN=your_apify_token_here
   ```
5. Launch the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *Backend will start at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)*

---

### Step 3: Frontend Setup
1. In the project root directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at:
   ```text
   http://localhost:5173
   ```

---

## 📊 Pitch Deck & Presentation (8 Slides)

FinShield AI includes a **professional 8-slide pitch deck** designed specifically for hackathon evaluation, executive reviews, and jury presentations:

1. **PowerPoint Deck (`.pptx`)**:
   - Location: [`presentation/FinShield_AI_Pitch_Deck.pptx`](presentation/FinShield_AI_Pitch_Deck.pptx)
   - Format: 16:9 Widescreen, Dark Cybersecurity theme (`#0B0E14` Obsidian, `#D8FB72` Electric Lime), real live-system screenshots, and data cards.
   - Regenerate anytime with: `python presentation/build_deck.py`

2. **Interactive Browser Deck (`index.html`)**:
   - Location: [`presentation/index.html`](presentation/index.html)
   - Features: Fullscreen presentation mode (`F`), keyboard navigation (Arrow keys / Space), live screenshot gallery, and 1-click **Export to PDF** button.
   - Open locally in any browser or serve via:
     ```bash
     # Simply double-click presentation/index.html or run:
     npx serve presentation
     ```

### Slide Outline:
- **Slide 1**: Title & Executive Vision (IEEE SKIT Hackathon 2026 • Team Valorant)
- **Slide 2**: The Crisis: Decentralized Financial Cybercrime & Mule Siphoning
- **Slide 3**: Unified 4-Tier Defensive Architecture (Ingest → NLP → URL Probe → Graph)
- **Slide 4**: Real-Time Threat Analytics Dashboard (Live PostgreSQL Telemetry)
- **Slide 5**: Signature Innovation: Campaign DNA Knowledge Graph (React Flow)
- **Slide 6**: Real-Time Deep URL Threat Scanner & DOM Credential Sniffer
- **Slide 7**: SOC Operations: Incident Triage to Legal Takedown Evidence
- **Slide 8**: Business Impact, Production Stack & Deployment Roadmap

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status and database latency check |
| `GET` | `/api/v1/analytics/overview` | Threat analytics aggregates, time series trend, risk distribution, brand breakdown |
| `GET` | `/api/v1/advertisements` | Paginated advertisements feed with search, platform, and risk filters |
| `PATCH`| `/api/v1/advertisements/{id}/status` | Update review status (*Needs review*, *In progress*, *Closed*) |
| `GET` | `/api/v1/campaigns` | Discovered campaign clusters with linked accounts and post counts |
| `GET` | `/api/v1/campaigns/{id}/graph` | Dynamic ReactFlow knowledge graph nodes and edges for campaign cluster |
| `POST`| `/api/v1/url-scanner/scan` | On-demand phishing detection and live website probing |
| `GET` | `/api/v1/url-scanner/recent` | Recently classified phishing and legitimate URLs |
| `POST`| `/api/v1/url-scanner/scrape-feed` | Trigger automated threat intelligence feed scrapers |
| `POST`| `/api/v1/ingestion/sync` | Trigger live multi-platform ingestion (Reddit + Apify + Web) |
| `GET` | `/api/v1/investigations` | Active security case files queue |
| `GET` | `/api/v1/watchlist` | Monitored telephone, handle, and domain indicators |

---

## 🛡️ Responsible Security & Ethical Use

FinShield AI is built strictly as a **defensive cybersecurity and financial fraud mitigation platform**. 
- It monitors publicly accessible feeds to alert analysts to fraudulent impersonation and illegal mule schemes.
- Discovered IoCs and campaign signatures are intended for use by verified financial fraud investigators, trust & safety teams, and law enforcement partners.

---

## 👥 Contributors & Hackathon Team

**Team FinShield / Valorant** — IEEE SKIT Hackathon 2026.
Developed with passion to secure financial digital ecosystems and protect citizens from cyber fraud.
