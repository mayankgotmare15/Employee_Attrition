/**
 * PRD TC-04 Verification Script:
 * "Simulate prediction drift above z = 2.0 -> Retraining pipeline is triggered automatically"
 * Validates the complete MLOps feedback loop across Backend, PostgreSQL, and ML Microservice.
 */
require('dotenv').config();
const assert = require('assert');
const app = require('../src/app');
const prisma = require('../src/prisma');

const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}`;

async function runTC04Test() {
  console.log('====================================================');
  console.log('STARTING PRD TC-04 DRIFT & RETRAINING VERIFICATION');
  console.log('====================================================');

  const server = app.listen(PORT);

  try {
    // 1. Authenticate as HR Manager (authorized for MLOps actions)
    console.log('\n[1/4] Authenticating as HR Manager (Pooja Arora)...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hrmanager@company.com',
        password: 'Password@123',
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert(token, 'Must obtain JWT auth token');
    console.log('  ✔ Authenticated successfully as HR_MANAGER');

    // 2. Check Baseline Drift Telemetry
    console.log('\n[2/4] Checking baseline drift status before simulation...');
    const driftRes = await fetch(`${BASE_URL}/api/v1/analytics/drift-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const driftData = await driftRes.json();
    assert.strictEqual(driftRes.status, 200);
    console.log(`  ✔ Current Status: ${driftData.data.status}`);
    console.log(`  ✔ Baseline Z-score: ${driftData.data.z_score} (Threshold: ${driftData.data.threshold})`);

    // 3. Execute PRD TC-04: Simulate Prediction Drift above Z = 2.0
    console.log('\n[3/4] EXECUTING PRD TC-04: Injecting macro-drift simulation...');
    const simRes = await fetch(`${BASE_URL}/api/v1/analytics/simulate-drift`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(simRes.status, 200, 'Simulate drift endpoint should succeed');
    const simData = await simRes.json();
    assert.strictEqual(simData.success, true);

    const report = simData.data;
    console.log(`  ✔ Simulated Drift Detected: ${report.drift_report.drift_detected}`);
    console.log(`  ✔ Elevated Z-score: ${report.drift_report.z_score} (> 2.0)`);
    console.log(`  ✔ Retraining Pipeline Automatically Triggered: ${report.retraining_triggered}`);

    assert(report.drift_report.z_score > 2.0, 'Z-score must exceed 2.0');
    assert.strictEqual(report.retraining_triggered, true, 'Retraining must be triggered');

    const retrain = report.retraining_result;
    console.log(`  ✔ Retraining Outcome: ${retrain.status}`);
    console.log(`  ✔ Previous Version: ${retrain.previous_version} -> New Deployed Version: ${retrain.new_version}`);
    console.log(`  ✔ Champion Model: ${retrain.champion_algorithm} (ROC-AUC: ${retrain.metrics.roc_auc})`);

    // 4. Verify PostgreSQL Model Registry Synchronization
    console.log('\n[4/4] Verifying PostgreSQL Model Version Registry...');
    const activeModel = await prisma.modelVersion.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'desc' },
    });
    assert(activeModel, 'Active model must exist in database');
    assert.strictEqual(activeModel.version, retrain.new_version, 'Database version must match retrained version');
    console.log(`  ✔ Database Active Version synced: ${activeModel.version} (${activeModel.algorithm})`);

    console.log('\n====================================================');
    console.log('PRD TC-04 VERIFICATION PASSED WITH 100% SUCCESS!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TC-04 Test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTC04Test();
