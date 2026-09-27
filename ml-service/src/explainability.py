"""
Explainability Module using SHAP (SHapley Additive exPlanations).
Supports Tree-based models (XGBoost, RandomForest) and Linear models (LogisticRegression).
Produces local feature contributions to explain why an employee is at risk of attrition.
"""
import os
import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.linear_model import LogisticRegression

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
EXPLAINER_PATH = os.path.join(MODEL_DIR, "shap_explainer.joblib")

class ModelExplainer:
    def __init__(self, model=None, feature_names=None):
        self.model = model
        self.feature_names = feature_names
        self.explainer = None
        
        if os.path.exists(EXPLAINER_PATH):
            try:
                self.explainer = joblib.load(EXPLAINER_PATH)
            except Exception as e:
                print(f"Warning: could not load existing SHAP explainer: {e}")

    def fit_and_save(self, model, X_sample, feature_names):
        """Fit a SHAP Explainer (TreeExplainer or LinearExplainer) and serialize it."""
        self.model = model
        self.feature_names = feature_names
        print(f"Fitting SHAP Explainer for model type: {type(model).__name__}...")
        
        if isinstance(model, LogisticRegression):
            self.explainer = shap.LinearExplainer(model, X_sample)
        else:
            try:
                self.explainer = shap.TreeExplainer(model)
            except Exception:
                self.explainer = shap.Explainer(model, X_sample)
                
        joblib.dump(self.explainer, EXPLAINER_PATH)
        print(f"SHAP Explainer saved to {EXPLAINER_PATH}")
        return self.explainer

    def explain_instance(self, transformed_row: np.ndarray, top_k: int = 5):
        """
        Explain a single prediction instance.
        Returns top_k positive and negative feature contributions.
        """
        if self.explainer is None:
            if os.path.exists(EXPLAINER_PATH):
                self.explainer = joblib.load(EXPLAINER_PATH)
            else:
                return []

        if transformed_row.ndim == 1:
            transformed_row = transformed_row.reshape(1, -1)

        try:
            shap_values = self.explainer.shap_values(transformed_row)
        except Exception:
            shap_obj = self.explainer(transformed_row)
            shap_values = shap_obj.values

        # Normalize shapes
        if isinstance(shap_values, list):
            values = shap_values[1][0] if len(shap_values) > 1 else shap_values[0]
        elif len(np.shape(shap_values)) == 3:
            values = shap_values[0, :, 1]
        elif len(np.shape(shap_values)) == 2:
            values = shap_values[0]
        else:
            values = shap_values

        factors = []
        for i, val in enumerate(values):
            feat_name = self.feature_names[i] if self.feature_names and i < len(self.feature_names) else f"feature_{i}"
            val_float = float(val)
            # Filter negligible contributions
            if abs(val_float) > 1e-4:
                factors.append({
                    "feature": feat_name,
                    "importance": round(val_float, 4),
                    "impact": "Increases Risk" if val_float > 0 else "Decreases Risk",
                })

        # Sort by absolute SHAP impact
        factors.sort(key=lambda x: abs(x["importance"]), reverse=True)
        return factors[:top_k]
