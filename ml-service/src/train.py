"""
Model Training and Benchmark Script for Employee Attrition Prediction.
Trains Logistic Regression, Random Forest, and XGBoost with class-imbalance adjustments.
Selects champion model based on ROC-AUC & F1-Score, saves model artifacts, and fits SHAP explainer.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)

from data_pipeline import prepare_and_split_data
from explainability import ModelExplainer

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")

def evaluate_model(name: str, model, X_test, y_test) -> dict:
    """Evaluate model and return standardized metrics dictionary."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
    
    metrics = {
        "algorithm": name,
        "accuracy": float(round(accuracy_score(y_test, y_pred), 4)),
        "precision": float(round(precision_score(y_test, y_pred, zero_division=0), 4)),
        "recall": float(round(recall_score(y_test, y_pred, zero_division=0), 4)),
        "f1_score": float(round(f1_score(y_test, y_pred, zero_division=0), 4)),
        "roc_auc": float(round(roc_auc_score(y_test, y_prob), 4)),
    }
    return metrics

def train_and_benchmark():
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Check or load preprocessed data
    train_file = os.path.join(PROCESSED_DIR, "train.csv")
    test_file = os.path.join(PROCESSED_DIR, "test.csv")
    feature_names_file = os.path.join(MODEL_DIR, "feature_names.joblib")
    
    if not (os.path.exists(train_file) and os.path.exists(test_file) and os.path.exists(feature_names_file)):
        print("Preprocessed files not found. Running data pipeline first...")
        prepare_and_split_data()
        
    train_df = pd.read_csv(train_file)
    test_df = pd.read_csv(test_file)
    feature_names = joblib.load(feature_names_file)
    
    X_train = train_df.drop(columns=["Attrition"]).values
    y_train = train_df["Attrition"].values
    X_test = test_df.drop(columns=["Attrition"]).values
    y_test = test_df["Attrition"].values
    
    # Calculate scale_pos_weight for XGBoost
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / max(pos_count, 1)
    
    models = {
        "LogisticRegression": LogisticRegression(
            C=0.1,
            class_weight="balanced",
            max_iter=1000,
            random_state=42,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=200,
            max_depth=6,
            min_samples_leaf=3,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=120,
            max_depth=3,
            learning_rate=0.04,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight * 0.85,
            reg_alpha=0.1,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        ),
    }
    
    results = []
    trained_instances = {}
    
    print("\n" + "="*50)
    print("STARTING MODEL BENCHMARKING (Phase 1)")
    print("="*50)
    
    for name, clf in models.items():
        print(f"\nTraining {name}...")
        clf.fit(X_train, y_train)
        metrics = evaluate_model(name, clf, X_test, y_test)
        results.append(metrics)
        trained_instances[name] = clf
        
        print(f"Results for {name}:")
        print(f"  Accuracy : {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall   : {metrics['recall']:.4f}")
        print(f"  F1-Score : {metrics['f1_score']:.4f}")
        print(f"  ROC-AUC  : {metrics['roc_auc']:.4f}")
        
    def champion_criterion(m):
        return m["roc_auc"] * 0.6 + m["f1_score"] * 0.4
        
    best_result = max(results, key=champion_criterion)
    champion_name = best_result["algorithm"]
    champion_model = trained_instances[champion_name]
    
    print("\n" + "="*50)
    print(f"CHAMPION MODEL SELECTED: {champion_name}")
    print(f"ROC-AUC: {best_result['roc_auc']:.4f}, F1: {best_result['f1_score']:.4f}, Recall: {best_result['recall']:.4f}")
    print("="*50)
    
    # Save champion model
    champion_path = os.path.join(MODEL_DIR, "champion_model.joblib")
    joblib.dump(champion_model, champion_path)
    print(f"Saved champion model to: {champion_path}")
    
    # Fit & save SHAP explainer
    explainer = ModelExplainer(feature_names=feature_names)
    explainer.fit_and_save(champion_model, X_train[:100], feature_names)
    
    # Save benchmark metadata & registry JSON
    metadata = {
        "model_version": "v1.0.0",
        "champion_algorithm": champion_name,
        "champion_metrics": best_result,
        "all_benchmarks": results,
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "dataset_rows": len(train_df) + len(test_df),
        "total_features": len(feature_names),
        "feature_names": feature_names,
    }
    
    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to: {metadata_path}")
    
    return metadata

if __name__ == "__main__":
    train_and_benchmark()
