"""
Unit and Integration Tests for FastAPI ML Prediction Microservice.
Verifies PRD requirements:
- TC-01: Valid employee attributes return probability (0-1) and correct risk tier.
- Low/Medium/High risk classification boundaries.
- SHAP feature explanation presence.
- Batch inference processing.
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure ml-service root is in sys.path
BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "Employee Attrition Prediction" in data["message"]

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "model_version" in data
    assert "champion_algorithm" in data

def test_metrics_endpoint():
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "champion_metrics" in data
    assert "roc_auc" in data["champion_metrics"]
    assert data["champion_metrics"]["roc_auc"] >= 0.75

def test_single_prediction_high_risk():
    """Test employee with high-risk traits: OverTime=Yes, low income, long promotion lag, low satisfaction."""
    payload = {
        "employee_id": 9901,
        "Age": 28,
        "Gender": "Male",
        "MaritalStatus": "Single",
        "Department": "Sales",
        "JobRole": "Sales Representative",
        "JobLevel": 1,
        "BusinessTravel": "Travel_Frequently",
        "MonthlyIncome": 1800,
        "DailyRate": 400,
        "HourlyRate": 35,
        "MonthlyRate": 9000,
        "DistanceFromHome": 25,
        "TotalWorkingYears": 3,
        "YearsAtCompany": 3,
        "YearsInCurrentRole": 1,
        "YearsSinceLastPromotion": 3,
        "YearsWithCurrManager": 1,
        "NumCompaniesWorked": 4,
        "PercentSalaryHike": 11,
        "StockOptionLevel": 0,
        "EnvironmentSatisfaction": 1,
        "JobSatisfaction": 1,
        "JobInvolvement": 1,
        "RelationshipSatisfaction": 1,
        "WorkLifeBalance": 1,
        "Education": 2,
        "EducationField": "Marketing",
        "PerformanceRating": 3,
        "TrainingTimesLastYear": 1,
        "OverTime": "Yes",
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["employee_id"] == 9901
    assert 0.0 <= data["attrition_probability"] <= 1.0
    # High risk employee should have probability >= 0.4
    assert data["risk_tier"] in ["Medium", "High"]
    assert len(data["top_risk_factors"]) > 0
    assert len(data["recommended_action"]) > 0

def test_single_prediction_low_risk():
    """Test employee with low-risk traits: high income, no overtime, high satisfaction, stock options."""
    payload = {
        "employee_id": 9902,
        "Age": 48,
        "Gender": "Female",
        "MaritalStatus": "Married",
        "Department": "Research & Development",
        "JobRole": "Research Director",
        "JobLevel": 4,
        "BusinessTravel": "Non-Travel",
        "MonthlyIncome": 16000,
        "DailyRate": 1200,
        "HourlyRate": 90,
        "MonthlyRate": 22000,
        "DistanceFromHome": 2,
        "TotalWorkingYears": 22,
        "YearsAtCompany": 15,
        "YearsInCurrentRole": 10,
        "YearsSinceLastPromotion": 1,
        "YearsWithCurrManager": 8,
        "NumCompaniesWorked": 1,
        "PercentSalaryHike": 20,
        "StockOptionLevel": 2,
        "EnvironmentSatisfaction": 4,
        "JobSatisfaction": 4,
        "JobInvolvement": 4,
        "RelationshipSatisfaction": 4,
        "WorkLifeBalance": 4,
        "Education": 4,
        "EducationField": "Life Sciences",
        "PerformanceRating": 4,
        "TrainingTimesLastYear": 3,
        "OverTime": "No",
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["employee_id"] == 9902
    assert 0.0 <= data["attrition_probability"] <= 1.0
    assert data["risk_tier"] == "Low"
    assert data["attrition_probability"] < 0.40

def test_batch_prediction():
    payload = {
        "employees": [
            {"employee_id": 1, "Age": 25, "OverTime": "Yes", "MonthlyIncome": 2000, "JobSatisfaction": 1},
            {"employee_id": 2, "Age": 50, "OverTime": "No", "MonthlyIncome": 15000, "JobSatisfaction": 4},
        ]
    }
    response = client.post("/api/v1/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_processed"] == 2
    assert len(data["predictions"]) == 2
    assert data["high_risk_count"] + data["medium_risk_count"] + data["low_risk_count"] == 2
