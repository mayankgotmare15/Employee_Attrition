"""
Main FastAPI Application Entrypoint for Employee Attrition Prediction Service.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.predict import router as predict_router
from app.routes.health import router as health_router
from app.routes.mlops import router as mlops_router

app = FastAPI(
    title="Employee Attrition Prediction & MLOps Service",
    description="MLOps-backed inference microservice providing employee attrition risk scoring, tier categorization, SHAP explainability, and drift-triggered retraining.",
    version="1.0.0",
)

# CORS Middleware to allow web and backend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1 and root
app.include_router(health_router)
app.include_router(predict_router, prefix="/api/v1")
app.include_router(mlops_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Employee Attrition Prediction & HR Analytics ML Service is active.",
        "docs_url": "/docs",
        "api_v1_predict": "/api/v1/predict",
        "api_v1_mlops_drift": "/api/v1/mlops/drift-status",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
