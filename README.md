# Employee Attrition Prediction & HR Analytics System with MLOps

An end-to-end MLOps-driven enterprise platform for proactive workforce retention and attrition risk scoring. Structured across the complete Software Development Life Cycle (SDLC).

---

## 🛠️ Architecture & Tech Stack

* **ML & Inference Microservice (`ml-service/`):** Python 3.10, FastAPI, Scikit-learn, XGBoost, SHAP Explainability, Joblib.
* **Backend API Gateway (`backend/`):** Node.js, Express.js, Prisma ORM, PostgreSQL, JWT Authentication.
* **Web Client (`frontend/`):** React.js, Tailwind CSS, Chart.js, Redux Toolkit *(Phase 3)*.
* **Mobile Client (`mobile/`):** React Native *(Phase 5)*.
* **DevOps & MLOps:** Docker, MLflow, AWS (EC2/ECS, RDS, S3, CloudWatch).

---

## 🚀 Phase 1 Implementation Summary

Phase 1 establishes the Machine Learning pipeline, model benchmarking, inference microservice, and relational persistence schema:

1. **Curated HR Dataset:**
   - Integrated the 1,470-record, 35-attribute IBM HR Analytics Employee Attrition dataset.
   - Cleaned uninformative constants (`EmployeeCount`, `StandardHours`, `Over18`).
   - Engineered domain features: `TotalSatisfaction`, `TenurePerRole`, `IncomePerAge`, and `PromotionLag`.
2. **Model Benchmarking & Selection:**
   - Benchmarked **Logistic Regression**, **Random Forest**, and **XGBoost** with class-imbalance weighting.
   - Champion selected: Logistic Regression ($\text{ROC-AUC} = 0.8080$, $\text{Recall} = 0.6809$).
   - Trained and exported **SHAP Explainer** (`models/shap_explainer.joblib`) for local feature attribution.
3. **FastAPI Inference Microservice (`ml-service/`):**
   - High-performance REST endpoints with Pydantic validation:
     - `POST /api/v1/predict` (single employee real-time inference).
     - `POST /api/v1/predict/batch` (bulk employee scoring).
     - `GET /health` & `GET /metrics` (health check & model telemetry).
   - PRD Risk Classification:
     - **Low:** Attrition Probability $< 40\%$
     - **Medium:** Attrition Probability $40\% - 70\%$
     - **High:** Attrition Probability $> 70\%$
4. **Data Layer (`backend/prisma/schema.prisma`):**
   - PostgreSQL schema with Prisma ORM: `User` (RBAC), `Employee` (30+ HR features), `Prediction` (history & SHAP drivers), and `ModelVersion` (model registry).
   - Database seeder (`backend/prisma/seed.js`).

---

## 💻 Quickstart Guide

### 1. Run the ML Prediction Microservice
```powershell
# From project root
cd ml-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Run Test Suite
```powershell
python -m pytest ml-service/tests/test_service.py -v
```

### 3. Run Phase 1 Inference Demo
```powershell
python ml-service/src/demo_inference.py
```
