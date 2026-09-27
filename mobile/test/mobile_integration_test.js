/**
 * Mobile App Integration Verification Script.
 * Tests mobile client communication with Node.js Backend API Gateway.
 */
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api/v1';

async function runMobileTests() {
  console.log('====================================================');
  console.log('STARTING PHASE 5 MOBILE APP INTEGRATION TEST');
  console.log('====================================================');

  try {
    // 1. Mobile Authentication (Sales Dept Manager Persona)
    console.log('\n[1/5] Testing Mobile Login (Sales Dept Manager)...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'deptmanager@company.com',
        password: 'Password@123',
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert(loginData.token, 'Must receive JWT token');
    const token = loginData.token;
    console.log(`  ✔ Mobile Login successful: ${loginData.user.name} (${loginData.user.role})`);

    // 2. Fetch Mobile Dashboard Overview
    console.log('\n[2/5] Testing Mobile Dashboard KPI Aggregation...');
    const ovRes = await fetch(`${API_BASE}/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(ovRes.status, 200);
    const ovData = await ovRes.json();
    assert(ovData.success, 'Overview request must succeed');
    console.log(`  ✔ Headcount in Scope: ${ovData.data.summary.totalEmployees}`);
    console.log(`  ✔ High Risk Leavers: ${ovData.data.riskDistribution.high.count}`);

    // 3. Fetch Mobile Workforce Directory
    console.log('\n[3/5] Testing Mobile Workforce Directory List...');
    const empRes = await fetch(`${API_BASE}/employees?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(empRes.status, 200);
    const empData = await empRes.json();
    assert(empData.data.length > 0, 'Employees should be returned');
    const sampleEmp = empData.data[0];
    console.log(`  ✔ Retrieved ${empData.data.length} records. Sample: ${sampleEmp.firstName} ${sampleEmp.lastName} (${sampleEmp.department})`);

    // 4. Fetch Mobile Employee Retention Drill-Down
    console.log('\n[4/5] Testing Mobile Employee Detail & SHAP Explainability...');
    const detailRes = await fetch(`${API_BASE}/employees/${sampleEmp.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(detailRes.status, 200);
    const detailData = await detailRes.json();
    const empDetail = detailData.data;
    console.log(`  ✔ Profile Loaded: ${empDetail.firstName} ${empDetail.lastName}`);
    if (empDetail.latestPrediction) {
      console.log(`  ✔ Calibrated Risk: ${empDetail.latestPrediction.riskTier} (${(empDetail.latestPrediction.attritionProbability * 100).toFixed(1)}%)`);
      console.log(`  ✔ Strategy: ${empDetail.latestPrediction.recommendedAction.substring(0, 50)}...`);
    }

    // 5. Fetch MLOps Drift Telemetry for Mobile Dashboard
    console.log('\n[5/5] Testing Mobile MLOps Drift Status...');
    const driftRes = await fetch(`${API_BASE}/analytics/drift-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(driftRes.status, 200);
    const driftData = await driftRes.json();
    console.log(`  ✔ MLOps Telemetry: Status=${driftData.data.status}, Z-Score=${driftData.data.z_score}, Threshold=${driftData.data.threshold}`);

    console.log('\n====================================================');
    console.log('PHASE 5 MOBILE INTEGRATION TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Mobile integration test failed:', err);
    process.exitCode = 1;
  }
}

runMobileTests();
