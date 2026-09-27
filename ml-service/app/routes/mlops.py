"""
MLOps API Routes for Drift Detection, Automated Retraining, and Telemetry.
Provides real-time drift telemetry, simulated drift testing (PRD TC-04),
and triggered continuous deployment retraining pipelines.
"""
import sys
import os
from fastapi import APIRouter, HTTPException, BackgroundTasks

SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "src")
if SRC_DIR not in sys.path:
    sys.path.append(SRC_DIR)

from drift_monitor import get_drift_monitor
from retrain import execute_retraining, load_current_metadata
from app.predictor import get_predictor

router = APIRouter(prefix="/mlops", tags=["MLOps & Drift"])

@router.get("/drift-status", summary="Get real-time statistical drift telemetry")
async def get_drift_status():
    """
    Evaluates current rolling inference distribution against baseline.
    Checks PRD trigger condition: Z-Score > 2.0.
    """
    monitor = get_drift_monitor()
    return monitor.evaluate_drift()

@router.post("/simulate-drift", summary="PRD TC-04: Simulate prediction drift and trigger automated retraining")
async def simulate_drift_and_retrain():
    """
    Simulates real-world organizational stress by injecting shifted predictions.
    Elevates Z-Score > 2.0 and triggers the automated retraining pipeline (PRD TC-04).
    """
    monitor = get_drift_monitor()
    
    # Inject shifted predictions
    drift_report = monitor.simulate_drift(count=30, elevated_mean=0.68)
    
    retrain_report = None
    if drift_report["drift_detected"]:
        # PRD requirement: Z > 2.0 automatically triggers retraining pipeline
        retrain_report = execute_retraining(
            reason=f"Automated trigger: Drift Z-score ({drift_report['z_score']}) exceeded 2.0 threshold"
        )
        
        # Hot-reload in-memory predictor singleton with new artifacts
        predictor = get_predictor()
        predictor.load_artifacts()

    return {
        "simulation": "TC-04 Macro-Shift Applied",
        "drift_report": drift_report,
        "retraining_triggered": drift_report["drift_detected"],
        "retraining_result": retrain_report,
    }

@router.post("/trigger-retrain", summary="Manually invoke continuous training pipeline")
async def trigger_manual_retraining():
    """Manually invoke model retraining, benchmark evaluation, and artifact update."""
    try:
        report = execute_retraining(reason="Manual MLOps operator trigger")
        predictor = get_predictor()
        predictor.load_artifacts()
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@router.get("/model-history", summary="View model registry version history")
async def get_model_history():
    meta = load_current_metadata()
    return {
        "active_version": meta.get("model_version", "v1.0.0"),
        "champion_algorithm": meta.get("champion_algorithm", "LogisticRegression"),
        "champion_metrics": meta.get("champion_metrics", {}),
        "version_history": meta.get("version_history", []),
        "last_retrained_reason": meta.get("last_retrained_reason", "Initial benchmark training"),
    }
