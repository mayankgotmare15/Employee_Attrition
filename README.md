# Employee Attrition Prediction & HR Analytics System with MLOps

An end-to-end Machine Learning and HR Analytics system designed to help organizations proactively identify employees at risk of leaving, understand the key reasons why using Explainable AI (SHAP), and take retention actions before resignation occurs.

---

## 👥 Project Information & Team

* **Institution:** Department of Information Technology, St. Vincent Pallotti College of Engineering and Technology, Nagpur
* **Academic Year:** 2026–27
* **Industry Partner:** IT DAKSH
* **Industry Mentor:** Ms. Pooja Arora
* **Project Guide:** Dr. A. Gahankar
* **Alumni Mentor:** Mr. Karan Masirkar
* **Team Members:**
  * **Pranav Shende** (Backend API, Security & RBAC, Mobile Application, Cloud Infrastructure)
  * **Mayank Gotmare** (ML Pipeline, Feature Engineering, MLOps Retraining, Web Dashboard)

---

## ✨ Key Features

1. **AI-Powered Attrition Risk Scoring:**
   * Predicts attrition probability for any employee in real-time.
   * Categorizes risk into actionable tiers: **Low (<40%)**, **Medium (40%–70%)**, and **High (>70%)**.
   * Selected champion model: **Class-Weighted Logistic Regression** ($\text{ROC-AUC} = 0.8080$, $\text{Recall} = 68.09\%$).

2. **Explainable AI (SHAP):**
   * Transparently explains *why* an employee is flagged (e.g., high overtime, commute distance, promotion lag, salary satisfaction).
   * Generates tailored HR retention recommendations for each individual.

3. **Modern Web Dashboard (Aceternity UI + Dark Mode):**
   * Bento KPI metric cards with live statistics.
   * Interactive risk distribution and department vulnerability charts.
   * Priority leaver alerts and filterable workforce directory.
   * **Flexible Bulk CSV Upload:** Ingest and score up to 1,500+ employee records in seconds with automatic column mapping and downloadable sample templates.

4. **Cross-Platform Mobile App (React Native / Expo):**
   * Accessible on iOS and Android for department managers and HR executives on the go.
   * Workforce overview, high-risk notifications, and individual employee drill-down cards.

5. **Automated MLOps Retraining Loop:**
   * Real-time monitoring of statistical prediction drift ($Z$-score).
   * Automatically triggers continuous model retraining whenever $Z > 2.0$ to prevent model degradation over time.

---

## 🏗️ How the System Works

```
[ React Web Dashboard / Mobile App ]
                 │
                 ▼
[ Node.js API Gateway (Port 5000) ] ────▶ [ PostgreSQL (Database) ]
                 │
                 ▼
[ FastAPI ML Microservice (Port 8000) ]
        ├── ML Model (Logistic Regression)
        ├── Explainability Engine (SHAP)
        └── MLOps Drift Monitor (Z > 2.0 Auto-Retraining)
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18 or v20+)
* **Python** (v3.10+)
* **PostgreSQL** running locally on port `5432` with a database named `attrition_db`

---

### Step 1: Start the ML Microservice
```powershell
cd ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **Swagger API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 2: Start the Node.js Backend API
Open a second terminal:
```powershell
cd backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```
* **Backend API Gateway:** [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

### Step 3: Start the React Web Dashboard
Open a third terminal:
```powershell
cd frontend
npm install
npm run dev
```
* **Web Application:** [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

### Step 4 (Optional): Start the Mobile App
Open a fourth terminal:
```powershell
cd mobile
npm install
npm start
```
* Scan the QR code using the **Expo Go** app on your phone, or press `w` to open the web preview.

---

### Option B: Run Everything via Docker Compose (1 Command)
If you have Docker Desktop installed, you can launch the entire stack at once:
```bash
docker-compose up --build
```
* Web Dashboard: [http://localhost](http://localhost)
* API Gateway: [http://localhost/api/v1](http://localhost/api/v1)
* ML Docs: [http://localhost/ml/docs](http://localhost/ml/docs)

---

### Option C: Deploy Frontend to Vercel
Deploy the React web dashboard directly to Vercel in under 2 minutes:
1. Import repository `mayankgotmare15/Employee_Attrition` on [vercel.com](https://vercel.com).
2. Select Root Directory as `frontend` (or leave default root `./`).
3. Set Environment Variable `VITE_API_URL` to your hosted backend URL.
4. Click **Deploy**. Detailed instructions are in [Vercel Deployment Guide](docs/vercel_deployment.md).


---

## 🧪 Testing the Project

RetainIQ includes a single, unified test command that runs all 4 test suites across the entire stack:

```powershell
node test_all.js
```

### What gets tested:
1. **ML Microservice:** Verifies health checks, metrics, and risk prediction endpoints.
2. **MLOps Drift Engine:** Simulates prediction drift ($Z > 2.0$) and confirms automated retraining (PRD TC-04).
3. **Backend API Gateway:** Tests JWT authentication, role permissions, and employee queries.
4. **Frontend Production Build:** Validates that the React application compiles cleanly without errors.

---

## 🔑 Demo Login Accounts

You can switch between these pre-configured accounts directly in the dashboard or mobile app:

| Role | Email | Password | What They Can Access |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@company.com` | `Password@123` | Full access, MLOps model controls, user management |
| **HR Manager** | `hrmanager@company.com` | `Password@123` | Entire employee directory, CSV bulk upload, retention alerts |
| **HR Analyst** | `hranalyst@company.com` | `Password@123` | Workforce analytics, trend drill-downs, employee scoring |
| **Dept Manager** | `deptmanager@company.com` | `Password@123` | Department-only view (Sales team), restricted from other depts |

---

## 📁 Repository Structure

```
Employee_Attrition/
├── ml-service/          # Python FastAPI ML microservice, SHAP explainer, drift monitor
│   ├── app/             # REST API routes and predictor
│   ├── models/          # Trained champion model and preprocessor
│   └── src/             # Data cleaning, training, explainability, retraining
├── backend/             # Node.js Express API gateway, Prisma ORM, JWT auth
│   ├── prisma/          # Database schema and seed data
│   └── src/             # Controllers, routes, and middleware
├── frontend/            # React 18 web dashboard (Tailwind CSS, Aceternity UI, Chart.js)
│   └── src/             # Dashboard components, modals, and charts
├── mobile/              # React Native / Expo mobile application
│   └── src/             # Screens (Dashboard, Alerts, Directory, Employee Detail)
├── nginx/               # Reverse proxy configuration for production
├── aws/                 # AWS deployment guide, ECS definitions, CloudWatch alarms
├── .github/workflows/   # CI/CD automated test and deployment pipelines
├── docker-compose.yml   # Multi-container local/cloud deployment
├── test_all.js          # Master test runner
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Machine Learning** | Python 3.10, Scikit-learn, XGBoost, SHAP, Joblib, Pandas |
| **ML Microservice** | FastAPI, Uvicorn, Pydantic v2 |
| **Backend & APIs** | Node.js, Express.js, Prisma ORM, JWT, Multer |
| **Database** | PostgreSQL 15 |
| **Web Dashboard** | React 18, Vite, Tailwind CSS, Chart.js, Lucide Icons |
| **Mobile App** | React Native, Expo |
| **DevOps & Cloud** | Docker, Docker Compose, Nginx, GitHub Actions, AWS (ECS, RDS, S3, CloudWatch) |

---

## 📄 License
Developed for the Final Year Capstone Project (2026–27) by **Pranav Shende** and **Mayank Gotmare** at **St. Vincent Pallotti College of Engineering and Technology, Nagpur** in collaboration with **IT DAKSH**.
