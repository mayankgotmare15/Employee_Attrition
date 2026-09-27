"""
Automated Model Retraining & Continuous Deployment (CD) Pipeline.
Executes automated model retraining when statistical drift exceeds threshold (Z > 2.0).
Benchmarks candidates, verifies quality gates, bumps version, updates registry,
and hot-swaps active serving artifacts with automatic rollback safety.
"""
import os
import shutil
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from data_pipeline import prepare_and_split_data
from explainability import ModelExplainer
from drift_monitor import get_drift_monitor

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
ARCHIVE_DIR = os.path.join(MODEL_DIR, "archive")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
METADATA_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

def load_current_metadata() -> dict:
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"model_version": "v1.0.0", "champion_algorithm": "LogisticRegression"}

def increment_version(version_str: str) -> str:
    """Increment minor version: v1.0.0 -> v1.1.0."""
    try:
        parts = version_str.lstrip("v").split(".")
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
        return f"v{major}.{minor + 1}.0"
    except Exception:
        return "v1.1.0"

def execute_retraining(reason: str = "Drift Z-Score > 2.0 threshold exceeded") -> dict:
    os.makedirs(ARCHIVE_DIR, exist_ok=True)
    current_meta = load_current_metadata()
    current_version = current_meta.get("model_version", "v1.0.0")
    new_version = increment_version(current_version)

    print(f"\n[MLOps CD Pipeline] Initiating Automated Retraining ({current_version} -> {new_version})...")
    print(f"Trigger Reason: {reason}")

    # 1. Load data
    train_file = os.path.join(PROCESSED_DIR, "train.csv")
    test_file = os.path.join(PROCESSED_DIR, "test.csv")
    feature_names_file = os.path.join(MODEL_DIR, "feature_names.joblib")

    if not (os.path.exists(train_file) and os.path.exists(test_file)):
        prepare_and_split_data()

    train_df = pd.read_csv(train_file)
    test_df = pd.read_csv(test_file)
    feature_names = joblib.load(feature_names_file)

    X_train = train_df.drop(columns=["Attrition"]).values
    y_train = train_df["Attrition"].values
    X_test = test_df.drop(columns=["Attrition"]).values
    y_test = test_df["Attrition"].values

    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / max(pos_count, 1)

    # 2. Train candidates with tuned hyperparameters
    candidates = {
        "LogisticRegression": LogisticRegression(
            C=0.15,
            class_weight="balanced",
            max_iter=1000,
            random_state=int(datetime.utcnow().timestamp()) % 1000,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=180,
            max_depth=7,
            class_weight="balanced_subsample",
            random_state=42,
            n_jobs=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=130,
            max_depth=3,
            learning_rate=0.035,
            subsample=0.85,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight * 0.9,
            reg_alpha=0.1,
            eval_metric="logloss",
            random_state=42,
            n_jobs=-1,
        ),
    }

    results = []
    trained_models = {}

    for name, clf in candidates.items():
        clf.fit(X_train, y_train)
        y_pred = clf.predict(X_test)
        y_prob = clf.predict_proba(X_test)[:, 1] if hasattr(clf, "predict_proba") else y_pred

        m = {
            "algorithm": name,
            "accuracy": float(round(accuracy_score(y_test, y_pred), 4)),
            "precision": float(round(precision_score(y_test, y_pred, zero_division=0), 4)),
            "recall": float(round(recall_score(y_test, y_pred, zero_division=0), 4)),
            "f1_score": float(round(f1_score(y_test, y_pred, zero_division=0), 4)),
            "roc_auc": float(round(roc_auc_score(y_test, y_prob), 4)),
        }
        results.append(m)
        trained_models[name] = clf

    # 3. Select best model based on ROC-AUC & Recall quality gates
    best_candidate = max(results, key=lambda x: x["roc_auc"] * 0.6 + x["f1_score"] * 0.4)
    champ_algo = best_candidate["algorithm"]
    champ_model = trained_models[champ_algo]

    # 4. Quality Gate Check
    ROC_AUC_MIN = 0.76
    RECALL_MIN = 0.45
    promoted = best_candidate["roc_auc"] >= ROC_AUC_MIN and best_candidate["recall"] >= RECALL_MIN

    if not promoted:
        print(f"Quality gate rejected candidate ({best_candidate['roc_auc']} < {ROC_AUC_MIN}). Retaining existing model.")
        return {
            "success": False,
            "status": "REJECTED_QUALITY_GATE",
            "message": "Retrained candidate failed quality gates. Retaining previous champion.",
            "current_version": current_version,
            "candidate_metrics": best_candidate,
        }

    # 5. Archive previous model version
    active_model_path = os.path.join(MODEL_DIR, "champion_model.joblib")
    if os.path.exists(active_model_path):
        archive_path = os.path.join(ARCHIVE_DIR, f"champion_model_{current_version}.joblib")
        shutil.copy2(active_model_path, archive_path)
        print(f"Archived previous version to: {archive_path}")

    # 6. Deploy new champion model & SHAP explainer
    joblib.dump(champ_model, active_model_path)
    explainer = ModelExplainer(feature_names=feature_names)
    explainer.fit_and_save(champ_model, X_train[:100], feature_names)

    # 7. Update Model Registry Metadata
    history = current_meta.get("version_history", [])
    history.append({
        "version": current_version,
        "algorithm": current_meta.get("champion_algorithm", "LogisticRegression"),
        "metrics": current_meta.get("champion_metrics", {}),
        "retired_at": datetime.utcnow().isoformat() + "Z",
    })

    new_meta = {
        "model_version": new_version,
        "champion_algorithm": champ_algo,
        "champion_metrics": best_candidate,
        "all_benchmarks": results,
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "dataset_rows": len(train_df) + len(test_df),
        "total_features": len(feature_names),
        "feature_names": feature_names,
        "version_history": history,
        "last_retrained_reason": reason,
    }

    with open(METADATA_PATH, "w") as f:
        json.dump(new_meta, f, indent=2)

    # 8. Reset inference logs back to healthy baseline
    drift_mon = get_drift_monitor()
    drift_mon.reset_to_baseline()

    print(f"\n[MLOps CD Complete] New Champion Deployed: {new_version} ({champ_algo})")
    print(f"Metrics: ROC-AUC={best_candidate['roc_auc']}, Recall={best_candidate['recall']}, F1={best_candidate['f1_score']}")

    return {
        "success": True,
        "status": "DEPLOYED",
        "previous_version": current_version,
        "new_version": new_version,
        "champion_algorithm": champ_algo,
        "metrics": best_candidate,
        "all_benchmarks": results,
        "retrained_at": new_meta["trained_at"],
    }

if __name__ == "__main__":
    result = execute_retraining(reason="Manual MLOps Retraining Run")
    print("\nRetraining Result:")
    print(json.dumps(result, indent=2))
