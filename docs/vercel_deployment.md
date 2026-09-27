# Deploying RetainIQ on Vercel

This guide explains how to deploy the **RetainIQ HR Analytics Dashboard** on **Vercel** with global CDN distribution, automatic SSL, and continuous deployment from GitHub.

---

## ⚡ 2-Minute Quick Deploy via Vercel Web Console

### Step 1: Sign in to Vercel
1. Navigate to **[vercel.com](https://vercel.com)** and sign in with your GitHub account.
2. Click the **"Add New..."** button in the top right and select **"Project"**.

---

### Step 2: Import Your GitHub Repository
1. In the **"Import Git Repository"** list, find:
   ```
   mayankgotmare15/Employee_Attrition
   ```
2. Click **"Import"**.

---

### Step 3: Project Configuration

Vercel will automatically detect the settings from our configured [`vercel.json`](file:///c:/Projects/Employee_Attrition/vercel.json):

* **Framework Preset:** `Vite` (Auto-detected)
* **Root Directory:**
  * **Option A (Recommended):** Click **Edit** next to Root Directory and select `frontend`.
  * **Option B:** Leave as `./` (The root [`vercel.json`](file:///c:/Projects/Employee_Attrition/vercel.json) handles building `frontend` automatically).
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

---

### Step 4: Environment Variables (Optional)

Expand the **"Environment Variables"** section:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of your deployed Backend API | `https://your-backend.onrender.com` |

> **Note:** If `VITE_API_URL` is omitted, the dashboard defaults to local development mode (`http://localhost:5000/api/v1`).

---

### Step 5: Click "Deploy"
1. Click the blue **Deploy** button.
2. Vercel will install dependencies, compile the production bundle via Vite in ~30 seconds, and issue your live URL:
   ```
   https://employee-attrition-frontend.vercel.app
   ```

---

## 💻 Alternative: Deploying via Vercel CLI

If you prefer using the terminal:

```powershell
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Deploy from the frontend directory
cd frontend
vercel

# 3. Deploy to production
vercel --prod
```

---

## 🌐 Full-Stack Architecture in Cloud Production

Since RetainIQ is a multi-tier enterprise system with Machine Learning and PostgreSQL, here is the standard production deployment setup:

```
┌────────────────────────────────────────────────────────┐
│  Vercel Edge Network                                   │
│  React 18 Web Dashboard (SPA)                          │
│  https://employee-attrition.vercel.app                 │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS REST API Requests)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Render / Railway / AWS EC2 / ECS                      │
│  Node.js API Gateway (Port 5000)                       │
│  FastAPI ML Prediction Microservice (Port 8000)        │
└───────────────────────────┬────────────────────────────┘
                            │ (PostgreSQL Connection)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Supabase / Neon / Render / AWS RDS                    │
│  PostgreSQL 15 Managed Database                        │
└────────────────────────────────────────────────────────┘
```

### Free-Tier Cloud Hosting Recommendations:
* **Database (PostgreSQL):**
  * **[Supabase](https://supabase.com)** (Free 500MB PostgreSQL with instant connection string)
  * **[Neon.tech](https://neon.tech)** (Free serverless PostgreSQL)
* **Backend Gateway & ML Microservice:**
  * **[Render.com](https://render.com)** (Free web services for Node.js and Python FastAPI)
  * **[Railway.app](https://railway.app)** (Deploy directly using the root `docker-compose.yml`)

---

## 🛠️ Verifying SPA Client-Side Routing
Both [`frontend/vercel.json`](file:///c:/Projects/Employee_Attrition/frontend/vercel.json) and root [`vercel.json`](file:///c:/Projects/Employee_Attrition/vercel.json) include single-page rewrite rules:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This ensures that refreshing pages or navigating directly to dashboard routes does not produce `404 Not Found` errors.
