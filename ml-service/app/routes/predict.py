"""
Prediction API Routes for FastAPI Microservice.
Provides real-time single and batch prediction endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.schemas import (
    EmployeeFeatures,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
)
from app.predictor import AttritionPredictor, get_predictor

router = APIRouter(prefix="/predict", tags=["Prediction"])

@router.post(
    "",
    response_model=PredictionResponse,
    summary="Predict attrition risk for a single employee",
    description="Calculates probability, assigns Low/Medium/High risk tier, and generates SHAP drivers and recommendations.",
)
async def predict_attrition(
    employee: EmployeeFeatures,
    predictor: AttritionPredictor = Depends(get_predictor),
):
    try:
        return predictor.predict_single(employee)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@router.post(
    "/batch",
    response_model=BatchPredictionResponse,
    summary="Bulk attrition risk prediction",
    description="Batch process multiple employee records (e.g. from bulk CSV ingestion).",
)
async def predict_attrition_batch(
    payload: BatchPredictionRequest,
    predictor: AttritionPredictor = Depends(get_predictor),
):
    try:
        return predictor.predict_batch(payload.employees)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {str(e)}")
