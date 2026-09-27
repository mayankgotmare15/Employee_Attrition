# Full-Stack Deployment: Connecting Vercel Frontend to the Backend & Database

This guide explains how to deploy the **Node.js API Gateway**, **FastAPI ML Microservice**, and **PostgreSQL Database**, and connect them to your live **Vercel Frontend**.

---

## 🌐 How They Connect Together

```
┌────────────────────────────────────────────────────────┐
│  Vercel (Global Edge CDN)                              │
│  React 18 Web Dashboard (SPA)                          │
│  URL: https://employee-attrition-frontend.vercel.app   │
└───────────────────────────┬────────────────────────────┘
                            │
                            │  HTTPS REST API Requests
                            │  (Configured via VITE_API_URL)
                            ▼
┌────────────────────────────────────────────────────────┐
│  Cloud Host (Render / Railway / AWS)                   │
│  Node.js API Gateway (Port 5000)                       │
│  URL: https://retainiq-backend.onrender.com            │
└─────────────┬────────────────────────────┬─────────────┘
              │ (Internal API Calls)       │ (Prisma SQL Queries)
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│ FastAPI ML Microservice   ││ PostgreSQL 15 Database    │
│ (Port 8000)               ││ (Users, Employees, Models)│
└───────────────────────────┘└───────────────────────────┘
```

---

## 🚀 Option 1: 1-Click Cloud Deployment via Render (Recommended & Free)

We have configured a complete Infrastructure-as-Code blueprint in [`render.yaml`](file:///c:/Projects/Employee_Attrition/render.yaml) that automatically creates the database, the ML service, and the backend.

### Step 1: Sign up on Render
1. Go to **[render.com](https://render.com)** and sign in with your GitHub account.

### Step 2: Deploy Blueprint
1. In the Render Dashboard, click the blue **"New +"** button $\rightarrow$ select **"Blueprint"**.
2. Select your repository:
   ```
   mayankgotmare15/Employee_Attrition
   ```
3. Render will read [`render.yaml`](file:///c:/Projects/Employee_Attrition/render.yaml) and show 3 resources to create:
   * **`retainiq-db`:** Managed PostgreSQL Database (Free tier).
   * **`retainiq-ml-service`:** FastAPI Microservice with Python 3.10 and model artifacts (Free tier).
   * **`retainiq-backend`:** Node.js Express Gateway with automated database migration & seeding (Free tier).
4. Click **"Apply"**.
5. Render will provision the database, build the containers, and run `npx prisma db push && node prisma/seed.js` automatically.

### Step 3: Copy Your Backend Public URL
Once `retainiq-backend` finishes deploying, copy its public URL from the Render dashboard:
```
https://retainiq-backend-xxxx.onrender.com
```

### Step 4: Connect Vercel to Your Live Backend
1. Go to your project on **[vercel.com](https://vercel.com)**.
2. Go to **Settings** $\rightarrow$ **Environment Variables**.
3. Add a new variable:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://retainiq-backend-xxxx.onrender.com` *(Paste your Render backend URL)*
4. Click **Save**.
5. Go to the **Deployments** tab $\rightarrow$ Click three dots (`...`) on your latest deployment $\rightarrow$ **Redeploy**.

✅ **Done!** Your live Vercel frontend is now communicating directly with your cloud backend, ML prediction microservice, and PostgreSQL database.

---

## ⚡ Option 2: Quick Demo via Tunnel (Instant — 0 Cloud Setup Needed)

If you want your live Vercel frontend to immediately connect to your local backend running on your machine (ideal for viva demonstrations):

### Step 1: Start your local services
Make sure your local backend (port 5000) and ML service (port 8000) are running.

### Step 2: Expose Port 5000 via Ngrok or Localtunnel
In a new terminal:
```bash
npx localtunnel --port 5000
```
*(Or if you use ngrok: `ngrok http 5000`)*

It will provide an instant HTTPS URL, for example:
```
https://bright-panda-12.loca.lt
```

### Step 3: Add to Vercel
1. In Vercel $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**:
   * `VITE_API_URL` = `https://bright-panda-12.loca.lt`
2. Click **Redeploy** on Vercel.
3. Your Vercel website will immediately fetch live data from your machine!

---

## 🔒 Verification & Security Checklist

* **CORS Enabled:** The backend Express application ([`backend/src/app.js`](file:///c:/Projects/Employee_Attrition/backend/src/app.js)) has `cors()` enabled for all origins, allowing any `*.vercel.app` domain to make requests without CORS errors.
* **Auto-Seed on Startup:** The backend container automatically executes `npx prisma db push` and `node prisma/seed.js` on first boot, so default accounts (`admin@company.com`, `Password@123`) and the champion model are available immediately.
* **JWT Persistence:** The frontend stores the authentication token in `localStorage`, maintaining user sessions across page reloads.
