# Implementation Plan: Vercel-Render Connection & Zero-Downtime Keep-Alive

## Executive Summary
This plan addresses two critical issues:
1. **Fixing the `Request failed with status 404` error** occurring between the live Vercel frontend and the Render backend.
2. **Preventing cold-start inactivity errors** so that accessing the application at any time never shows a broken connection or failed request.

---

## 1. Root Cause Analysis

### A. Why Status 404 Occurs
| Cause | Mechanism | Impact |
| :--- | :--- | :--- |
| **Missing / Unbaked `VITE_API_URL` on Vercel** | In Vite, `import.meta.env` is baked at build time. If `VITE_API_URL` was not set before building on Vercel (or redeploy was not triggered), `API_BASE` defaults to `"/api/v1"`. | Requests hit `https://<vercel-domain>/api/v1/*`. Vercel has no serverless API route there, returning **404 Not Found**. |
| **Double Pathing (`/api/v1/api/v1`)** | In `frontend/src/services/api.js`, `${RAW_API_URL.replace(/\/$/, "")}/api/v1` appends `/api/v1`. If the user entered `https://<render-url>/api/v1` in Vercel, the final URL becomes `https://<render-url>/api/v1/api/v1/auth/login`. | Render Express server has no route matching `/api/v1/api/v1/*`, returning **404 Not Found**. |
| **No Reverse Proxy in `vercel.json`** | `frontend/vercel.json` only rewrites all routes to `/index.html`. It does not proxy `/api/*` to the Render backend. | Any relative API request fails against the Vercel static host. |
| **Strict Backend Route Mapping** | In `backend/src/app.js`, only `GET /api/health` is handled. `GET /`, `GET /health`, and `GET /api/v1/health` are unhandled. | Probing the root backend domain returns `Cannot GET /` (404). |

---

### B. Why Render Shows "Inactive / Failed Request"
- **Render Free Tier Spin-Down**: Render free web services automatically sleep after **15 minutes** of inactivity.
- **Cold-Start Delay**: Waking up a sleeping container takes **30 to 50 seconds**.
- **Brittle Frontend Error Handling**: In `frontend/src/services/api.js`, any initial request that times out or returns 502/503 during wake-up immediately throws `Request failed with status ...`. The UI displays an error alert/toast immediately instead of gracefully waiting or retrying.

---

## 2. Proposed Architecture & Solution Overview

```
┌────────────────────────────────────────────────────────┐
│  Automated Keep-Alive (Zero Downtime)                 │
│  - GitHub Actions Cron Workflow (every 10-14 mins)     │
│  - Optional External Pinger (cron-job.org / Uptime)   │
└───────────────────────────┬────────────────────────────┘
                            │ Ping GET /api/health
                            ▼
┌────────────────────────────────────────────────────────┐
│  Render Free Web Service (Always Awake)                │
│  - Root & Health handlers: /, /health, /api/v1/health  │
│  - Node.js API Gateway (Port 5000)                     │
└───────────────────────────▲────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │ Direct HTTPS or Proxy   │
               │ Auto-Retry & Backoff    │
               │ Warmup Detection Banner │
               │                         │
┌──────────────┴─────────────────────────┴───────────────┐
│  Vercel Frontend (React + Vite)                        │
│  - Normalized API_BASE (handles trailing /api/v1)     │
│  - Exponential backoff retry on 502/503/timeout/404    │
│  - Friendly "Waking up server..." status banner        │
│  - vercel.json reverse proxy for seamless routing      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Plan

### Step 1: Normalize & Fortify Frontend API Layer (`frontend/src/services/api.js`)
- **Sanitize `API_BASE` URL**: Strip any trailing `/api/v1` or `/api` or `/` from `import.meta.env.VITE_API_URL` before appending `/api/v1`. This guarantees no double-prefixing (`/api/v1/api/v1`).
- **Implement Resilient Auto-Retry with Exponential Backoff**: When a request encounters a network error, timeout, or 502/503/504 (or initial 404 during DNS propagation), automatically retry up to 3 times (with 2s, 4s, 8s intervals) before throwing an error.
- **Warmup Event Dispatcher**: Emit connection status events so the UI can display a reassuring loading banner instead of a red error message.

### Step 2: Configure Vercel Reverse Proxy (`frontend/vercel.json`)
- Add an API rewrite rule in `frontend/vercel.json` pointing to your Render backend URL.
- This allows relative `/api/*` calls from the browser to proxy directly to Render, eliminating CORS issues and missing env var issues.

### Step 3: Expand Backend Health & Probe Endpoints (`backend/src/app.js`)
- Add root and multi-path health handlers:
  - `GET /` -> `{ status: "healthy", service: "employee-attrition-backend", message: "RetainIQ API Gateway Active" }`
  - `GET /health` -> 200 OK
  - `GET /api/health` -> 200 OK
  - `GET /api/v1/health` -> 200 OK
- Ensure CORS allows seamless communication across Vercel deployments.

### Step 4: Add Automated GitHub Actions Keep-Alive Workflow
- Create `.github/workflows/keep_alive.yml`:
  - Triggers via GitHub Actions scheduled cron every 12 minutes (`cron: '*/12 * * * *'`).
  - Sends a lightweight `curl -sSf https://<render-backend>/api/health` request.
  - Keeps the Render free instance active 24/7 without needing external paid services or third-party accounts.

### Step 5: Implement Friendly Server Warmup Banner in Frontend UI
- Add a `ServerWarmupBanner.jsx` component:
  - Probes `/api/health` on initial page load.
  - If the server is cold/spinning up, displays a sleek, non-intrusive status pill:
    `⚡ Connecting to cloud backend (waking up free instance, ~25s)...`
  - Automatically hides once the backend responds `200 OK`.
- Update `LoginModal.jsx`:
  - When login is clicked while waking up, show a friendly spinner: `"Waking up cloud server and signing in..."` instead of the raw `Request failed with status 404`.

### Step 6: Verification & Deployment Instructions
- Verify build and proxy compatibility.
- Test the health check endpoint and verify keep-alive execution.
