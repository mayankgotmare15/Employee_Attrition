"""
MLOps Drift and Retraining Verification Test Suite.
Validates PRD Test Case TC-04:
- TC-04: Simulate prediction drift above z = 2.0 -> Retraining pipeline is triggered automatically.
- Model registry version tracking and automated deployment.
"""
import sys
import os
import pytest
from fastapi.testclient import TestClient

BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from app.main import app

client = TestClient(app)

def test_drift_status_endpoint():
    """Verify drift telemetry schema and threshold."""
    response = client.get("/api/v1/mlops/drift-status")
    assert response.status_code == 200
    data = response.json()
    assert "z_score" in data
    assert "threshold" in data
    assert data["threshold"] == 2.0
    assert "drift_detected" in data
    assert "baseline_mean" in data

def test_model_history_endpoint():
    """Verify model registry version tracking."""
    response = client.get("/api/v1/mlops/model-history")
    assert response.status_code == 200
    data = response.json()
    assert "active_version" in data
    assert "champion_algorithm" in data

def test_tc04_simulate_drift_and_auto_retrain():
    """
    PRD TC-04: Simulate prediction drift above z = 2.0 -> Retraining pipeline is triggered automatically.
    """
    response = client.post("/api/v1/mlops/simulate-drift")
    assert response.status_code == 200
    data = response.json()
    
    # 1. Verify drift was detected above z = 2.0
    drift_report = data["drift_report"]
    assert drift_report["drift_detected"] is True, f"Drift should be detected, z_score={drift_report['z_score']}"
    assert drift_report["z_score"] > 2.0, f"Z-score must exceed 2.0 (got {drift_report['z_score']})"
    
    # 2. Verify retraining was triggered automatically
    assert data["retraining_triggered"] is True
    
    # 3. Verify retraining pipeline produced a newly deployed model
    retrain_res = data["retraining_result"]
    assert retrain_res is not None
    assert retrain_res["status"] == "DEPLOYED"
    assert retrain_res["new_version"] != retrain_res["previous_version"]
    assert retrain_res["metrics"]["roc_auc"] >= 0.75
