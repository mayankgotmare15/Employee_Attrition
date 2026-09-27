"""
Health and Monitoring Routes for FastAPI ML Service.
"""
import time
from fastapi import APIRouter, Depends
from app.predictor import AttritionPredictor, get_predictor

router = APIRouter(tags=["Health & Monitoring"])

START_TIME = time.time()

@router.get("/health", summary="Service health check")
async def health_check(predictor: AttritionPredictor = Depends(get_predictor)):
    uptime_seconds = round(time.time() - START_TIME, 2)
    return {
        "status": "healthy",
        "service": "employee-attrition-ml-service",
        "uptime_seconds": uptime_seconds,
        "model_version": predictor.metadata.get("model_version", "v1.0.0"),
        "champion_algorithm": predictor.metadata.get("champion_algorithm", "Unknown"),
    }

@router.get("/metrics", summary="Model benchmark and validation metrics")
async def model_metrics(predictor: AttritionPredictor = Depends(get_predictor)):
    return {
        "model_version": predictor.metadata.get("model_version", "v1.0.0"),
        "trained_at": predictor.metadata.get("trained_at"),
        "champion_metrics": predictor.metadata.get("champion_metrics"),
        "all_benchmarks": predictor.metadata.get("all_benchmarks", []),
        "total_features": predictor.metadata.get("total_features"),
    }
