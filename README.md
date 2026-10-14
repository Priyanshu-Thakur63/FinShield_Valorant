# FinShield AI

A frontend-only React/Vite prototype for reviewing suspicious financial-advertisement examples. The interface uses synthetic local data; it does not connect to social platforms, run a production AI model, or send content to a server.

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local URL when the development server starts. Create a production build with `npm run build`; preview it with `npm run preview`.

## Workspace pages

- **Overview** — Sample KPIs, risk distribution, trend chart, priority advertisements, and quick navigation.
- **Advertisement analysis** — Local rules-based demonstration with phrase highlighting and phone, URL, and UPI extraction. Attached images are preview-only.
- **Ad monitoring / Advertisement explorer** — Search and filter the sample feed; explorer rows support sorting, pagination, selection, and locally saved review statuses.
- **Campaign DNA** — Interactive React Flow graph with synthetic ad and indicator relationships, filters, zoom, pan, and a selection panel.
- **Campaign investigations** — Synthetic evidence timeline, status changes, relationship flag/dismiss actions, analyst notes, related ads, and JSON export.
- **Analytics** — Recharts trends, risk and platform distributions, common indicators, campaign sizes, and investigation statuses.
- **Alerts center** — Searchable severity filters and locally saved read state and investigation status.
- **Investigations / Watchlists** — Existing case-management and indicator-tracking examples.
- **Reports** — Print-ready campaign summary plus local CSV and JSON exports.
- **Settings** — Locally saved display, notification, and dashboard preferences; reset demo data.
- **Landing page** — Product overview and navigation into the workspace.

## Frontend architecture

- `src/data/seedData.js` contains synthetic advertisements, campaigns, cases, and preferences.
- `src/services/` contains mock analysis, campaign relationship, and dashboard-statistics logic.
- `src/pages/` contains independently loaded workspace screens.
- `src/components/` contains the shared layout, tables, charts, and presentation components.
- `src/hooks/usePersistentState.js` stores selected demo state in browser `localStorage`.
- `src/utils/` contains local file-download and CSV helpers.

All scores, campaign links, and time-series charts are illustrative. A shared identifier or risk label is not proof of wrongdoing. No backend, authentication, API integration, AI inference, or social-media collection is included.
