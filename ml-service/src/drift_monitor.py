"""
MLOps Drift Detection Engine.
Monitors inference distributions in real-time, calculates statistical Z-score and PSI,
and evaluates PRD drift trigger condition (Z > 2.0).
"""
import os
import json
import math
import numpy as np
from datetime import datetime
from typing import Dict, Any, List

LOGS_DIR = os.path.join(os.path.dirname(__file__), "..", "logs")
INFERENCE_LOG_PATH = os.path.join(LOGS_DIR, "inference_history.json")

# Baseline parameters established from held-out validation test split
BASELINE_MEAN = 0.3558
BASELINE_STD = 0.2541
DRIFT_THRESHOLD_Z = 2.0  # PRD FR-9 & Section 5.3 trigger threshold

class DriftMonitor:
    def __init__(self):
        os.makedirs(LOGS_DIR, exist_ok=True)
        if not os.path.exists(INFERENCE_LOG_PATH):
            # Seed with normal baseline inference events
            self._seed_baseline_logs()

    def _seed_baseline_logs(self):
        """Seed initial normal inference records matching baseline parameters."""
        np.random.seed(42)
        initial_probs = np.clip(np.random.normal(BASELINE_MEAN, BASELINE_STD * 0.7, 30), 0.01, 0.99)
        records = [
            {
                "employee_id": 1000 + i,
                "probability": float(round(p, 4)),
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "simulated": False,
            }
            for i, p in enumerate(initial_probs)
        ]
        with open(INFERENCE_LOG_PATH, "w") as f:
            json.dump(records, f, indent=2)

    def load_records(self) -> List[Dict[str, Any]]:
        if not os.path.exists(INFERENCE_LOG_PATH):
            return []
        try:
            with open(INFERENCE_LOG_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return []

    def save_records(self, records: List[Dict[str, Any]]):
        with open(INFERENCE_LOG_PATH, "w") as f:
            json.dump(records, f, indent=2)

    def log_prediction(self, probability: float, employee_id: int = None, simulated: bool = False):
        """Record live inference prediction probability."""
        records = self.load_records()
        records.append({
            "employee_id": employee_id,
            "probability": float(round(probability, 4)),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "simulated": simulated,
        })
        # Keep rolling window of last 200 predictions
        if len(records) > 200:
            records = records[-200:]
        self.save_records(records)

    @staticmethod
    def calculate_psi(expected: np.ndarray, actual: np.ndarray, bins: int = 5) -> float:
        """Calculate Population Stability Index (PSI) between baseline and live windows."""
        if len(expected) == 0 or len(actual) == 0:
            return 0.0

        bin_edges = np.linspace(0.0, 1.0, bins + 1)
        expected_counts, _ = np.histogram(expected, bins=bin_edges)
        actual_counts, _ = np.histogram(actual, bins=bin_edges)

        # Convert to proportions with smoothing epsilon to prevent division by zero
        eps = 1e-4
        expected_pct = (expected_counts + eps) / (len(expected) + eps * bins)
        actual_pct = (actual_counts + eps) / (len(actual) + eps * bins)

        psi = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(round(psi, 4))

    def evaluate_drift(self, window_size: int = 40) -> Dict[str, Any]:
        """
        Evaluate statistical drift using standard Z-test on mean probability:
        Z = |x_bar - mu_0| / (sigma_0 / sqrt(n))
        """
        records = self.load_records()
        if len(records) < 5:
            return {
                "drift_detected": False,
                "z_score": 0.0,
                "threshold": DRIFT_THRESHOLD_Z,
                "psi": 0.0,
                "sample_size": len(records),
                "baseline_mean": BASELINE_MEAN,
                "current_mean": BASELINE_MEAN,
                "status": "INSUFFICIENT_DATA",
                "recommendation": "Gather more live predictions before drift assessment.",
            }

        # Analyze the latest window of inferences
        window = records[-window_size:] if len(records) > window_size else records
        probs = np.array([r["probability"] for r in window])

        n = len(probs)
        current_mean = float(np.mean(probs))
        std_error = BASELINE_STD / math.sqrt(n)

        # Z-test statistic
        z_score = abs(current_mean - BASELINE_MEAN) / std_error if std_error > 0 else 0.0
        z_score = float(round(z_score, 4))

        # Baseline sample for PSI
        np.random.seed(42)
        baseline_sample = np.clip(np.random.normal(BASELINE_MEAN, BASELINE_STD, 100), 0.0, 1.0)
        psi = self.calculate_psi(baseline_sample, probs)

        drift_detected = bool(z_score > DRIFT_THRESHOLD_Z)

        status = "DRIFT_ALERT" if drift_detected else "NORMAL"
        recommendation = (
            f"Drift detected (Z={z_score:.2f} > {DRIFT_THRESHOLD_Z}). Retraining pipeline triggered."
            if drift_detected
            else f"Inference distribution stable (Z={z_score:.2f} <= {DRIFT_THRESHOLD_Z}). Normal operation."
        )

        return {
            "drift_detected": drift_detected,
            "z_score": z_score,
            "threshold": DRIFT_THRESHOLD_Z,
            "psi": psi,
            "sample_size": n,
            "baseline_mean": BASELINE_MEAN,
            "current_mean": float(round(current_mean, 4)),
            "status": status,
            "recommendation": recommendation,
            "evaluated_at": datetime.utcnow().isoformat() + "Z",
        }

    def simulate_drift(self, count: int = 25, elevated_mean: float = 0.68) -> Dict[str, Any]:
        """
        PRD TC-04: Injects a batch of elevated risk predictions simulating real-world
        workforce stress, forcing Z-score > 2.0 to trigger retraining.
        """
        np.random.seed(123)
        drift_probs = np.clip(np.random.normal(elevated_mean, 0.15, count), 0.45, 0.99)

        for p in drift_probs:
            self.log_prediction(float(p), simulated=True)

        return self.evaluate_drift()

    def reset_to_baseline(self):
        """Reset inference logs back to healthy baseline."""
        self._seed_baseline_logs()
        return self.evaluate_drift()

# Global singleton monitor
_monitor = None

def get_drift_monitor() -> DriftMonitor:
    global _monitor
    if _monitor is None:
        _monitor = DriftMonitor()
    return _monitor

if __name__ == "__main__":
    monitor = get_drift_monitor()
    report = monitor.evaluate_drift()
    print("Normal Baseline Drift Evaluation:")
    print(json.dumps(report, indent=2))
