"""
Inference Engine and Risk Scoring for Employee Attrition.
Loads serialized pipeline artifacts, computes probabilities, maps PRD risk tiers,
and generates actionable HR recommendations with SHAP explanations.
"""
import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any

# Ensure src is importable
SRC_DIR = os.path.join(os.path.dirname(__file__), "..", "src")
if SRC_DIR not in sys.path:
    sys.path.append(SRC_DIR)

from data_pipeline import clean_data, engineer_features
from explainability import ModelExplainer
from app.schemas import (
    EmployeeFeatures,
    PredictionResponse,
    RiskFactor,
    BatchPredictionResponse,
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

class AttritionPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.feature_names = None
        self.explainer = None
        self.metadata = {}
        self.load_artifacts()

    def load_artifacts(self):
        """Load all model and preprocessing artifacts into memory."""
        champion_path = os.path.join(MODEL_DIR, "champion_model.joblib")
        preprocessor_path = os.path.join(MODEL_DIR, "preprocessor.joblib")
        feature_names_path = os.path.join(MODEL_DIR, "feature_names.joblib")
        metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")

        if not (os.path.exists(champion_path) and os.path.exists(preprocessor_path)):
            raise FileNotFoundError(
                f"Model artifacts not found in {MODEL_DIR}. Please run `python ml-service/src/train.py` first."
            )

        self.model = joblib.load(champion_path)
        self.preprocessor = joblib.load(preprocessor_path)
        self.feature_names = joblib.load(feature_names_path)
        
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                self.metadata = json.load(f)

        self.explainer = ModelExplainer(model=self.model, feature_names=self.feature_names)
        print(f"Loaded champion model ({self.metadata.get('champion_algorithm', 'Unknown')}) successfully.")

    @staticmethod
    def classify_risk_tier(prob: float) -> str:
        """PRD FR-3: Low (<0.4), Medium (0.4-0.7), High (>0.7)."""
        if prob < 0.40:
            return "Low"
        elif prob <= 0.70:
            return "Medium"
        else:
            return "High"

    @staticmethod
    def generate_recommendation(prob: float, tier: str, top_factors: List[Dict[str, Any]]) -> str:
        """Produce actionable HR interventions based on risk level and top driving features."""
        if tier == "Low":
            return "Employee engagement is healthy. Maintain regular check-ins and recognize recent contributions."

        # Search for primary stress factors
        driver_names = [f["feature"].lower() for f in top_factors if f.get("impact") == "Increases Risk"]
        drivers_str = " ".join(driver_names)

        interventions = []
        if "overtime" in drivers_str:
            interventions.append("Conduct an immediate workload and overtime audit to prevent burnout.")
        if "income" in drivers_str or "monthlyincome" in drivers_str or "salary" in drivers_str:
            interventions.append("Review compensation benchmark against market rates and assess retention bonus.")
        if "promotion" in drivers_str or "role" in drivers_str:
            interventions.append("Schedule a career development review to clarify promotion trajectories.")
        if "satisfaction" in drivers_str or "environment" in drivers_str:
            interventions.append("Arrange an empathetic, confidential 1-on-1 session to address workplace friction.")
        if "distance" in drivers_str or "travel" in drivers_str:
            interventions.append("Offer flexible or hybrid work arrangements to reduce commute burden.")

        if not interventions:
            if tier == "High":
                return "Urgent: Conduct structured retention conversation within 7 days. Review total rewards and team dynamics."
            return "Monitor quarterly performance metrics and initiate proactive check-in regarding job satisfaction."

        return " ".join(interventions)

    def predict_single(self, emp: EmployeeFeatures) -> PredictionResponse:
        """Run real-time inference for a single employee."""
        emp_dict = emp.model_dump()
        emp_id = emp_dict.pop("employee_id", None)
        
        # Convert to DataFrame
        df = pd.DataFrame([emp_dict])
        df = clean_data(df)
        df = engineer_features(df)
        
        # Transform features
        X_trans = self.preprocessor.transform(df)
        
        # Model probability
        probs = self.model.predict_proba(X_trans)[0]
        attrition_prob = float(round(probs[1], 4))
        risk_tier = self.classify_risk_tier(attrition_prob)
        
        # Compute explainability
        raw_factors = self.explainer.explain_instance(X_trans[0], top_k=5)
        top_risk_factors = [RiskFactor(**f) for f in raw_factors]
        
        recommendation = self.generate_recommendation(attrition_prob, risk_tier, raw_factors)
        version = self.metadata.get("model_version", "v1.0.0")

        return PredictionResponse(
            employee_id=emp_id,
            attrition_probability=attrition_prob,
            risk_tier=risk_tier,
            recommended_action=recommendation,
            top_risk_factors=top_risk_factors,
            model_version=version,
        )

    def predict_batch(self, employees: List[EmployeeFeatures]) -> BatchPredictionResponse:
        """Run high-speed vectorized batch inference for multiple employees."""
        if not employees:
            return BatchPredictionResponse(
                total_processed=0,
                high_risk_count=0,
                medium_risk_count=0,
                low_risk_count=0,
                predictions=[],
            )

        emp_dicts = [emp.model_dump() for emp in employees]
        emp_ids = [d.pop("employee_id", None) for d in emp_dicts]

        df = pd.DataFrame(emp_dicts)
        df = clean_data(df)
        df = engineer_features(df)

        X_trans = self.preprocessor.transform(df)
        probs_all = self.model.predict_proba(X_trans)[:, 1]

        try:
            shap_factors_batch = self.explainer.explain_batch(X_trans, top_k=5)
        except Exception as e:
            print(f"Warning: Batch SHAP computation error: {e}")
            shap_factors_batch = [[] for _ in range(len(employees))]

        version = self.metadata.get("model_version", "v1.0.0")
        predictions: List[PredictionResponse] = []
        high_cnt = 0
        med_cnt = 0
        low_cnt = 0

        for i, prob in enumerate(probs_all):
            attrition_prob = float(round(prob, 4))
            risk_tier = self.classify_risk_tier(attrition_prob)
            if risk_tier == "High":
                high_cnt += 1
            elif risk_tier == "Medium":
                med_cnt += 1
            else:
                low_cnt += 1

            raw_factors = shap_factors_batch[i] if i < len(shap_factors_batch) else []
            top_risk_factors = [RiskFactor(**f) for f in raw_factors]
            recommendation = self.generate_recommendation(attrition_prob, risk_tier, raw_factors)

            predictions.append(
                PredictionResponse(
                    employee_id=emp_ids[i],
                    attrition_probability=attrition_prob,
                    risk_tier=risk_tier,
                    recommended_action=recommendation,
                    top_risk_factors=top_risk_factors,
                    model_version=version,
                )
            )

        return BatchPredictionResponse(
            total_processed=len(predictions),
            high_risk_count=high_cnt,
            medium_risk_count=med_cnt,
            low_risk_count=low_cnt,
            predictions=predictions,
        )


# Global singleton predictor instance
_predictor = None

def get_predictor() -> AttritionPredictor:
    global _predictor
    if _predictor is None:
        _predictor = AttritionPredictor()
    return _predictor
