/**
 * Microservice Client for FastAPI ML Prediction & MLOps Engine.
 */
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

class MLClient {
  /**
   * Request single-employee prediction from FastAPI microservice.
   */
  static async predictSingle(employeeData) {
    const url = `${ML_SERVICE_URL}/api/v1/predict`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employeeData),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ML Microservice predict failed (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  /**
   * Request batch prediction from FastAPI microservice.
   */
  static async predictBatch(employeesList) {
    const url = `${ML_SERVICE_URL}/api/v1/predict/batch`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees: employeesList }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ML Microservice batch predict failed (${response.status}): ${errText}`);
    }

    return await response.json();
  }

  /**
   * Get current statistical drift status (Z-score, PSI, threshold).
   */
  static async getDriftStatus() {
    const url = `${ML_SERVICE_URL}/api/v1/mlops/drift-status`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch drift status (${response.status})`);
    }
    return await response.json();
  }

  /**
   * PRD TC-04: Simulate prediction drift and trigger automated retraining.
   */
  static async simulateDrift() {
    const url = `${ML_SERVICE_URL}/api/v1/mlops/simulate-drift`;
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Failed to simulate drift (${response.status})`);
    }
    return await response.json();
  }

  /**
   * Manually trigger continuous deployment retraining pipeline.
   */
  static async triggerRetrain() {
    const url = `${ML_SERVICE_URL}/api/v1/mlops/trigger-retrain`;
    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Failed to trigger retraining (${response.status})`);
    }
    return await response.json();
  }

  /**
   * Check ML service health.
   */
  static async checkHealth() {
    try {
      const res = await fetch(`${ML_SERVICE_URL}/health`);
      return await res.json();
    } catch (err) {
      return { status: 'unreachable', error: err.message };
    }
  }

  /**
   * Fetch model metrics.
   */
  static async getMetrics() {
    const res = await fetch(`${ML_SERVICE_URL}/metrics`);
    return await res.json();
  }
}

module.exports = MLClient;
