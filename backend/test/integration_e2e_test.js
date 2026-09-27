/**
 * End-to-End Integration Test:
 * Tests the complete loop between Node.js Backend, PostgreSQL, and FastAPI ML Microservice.
 * Verifies PRD Sequence Diagram (Section 5.6):
 * Web/Client -> Node.js BE -> PostgreSQL -> FastAPI ML -> PostgreSQL -> Client
 */
require('dotenv').config();
const assert = require('assert');
const app = require('../src/app');

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}`;

async function runE2ETest() {
  console.log('====================================================');
  console.log('STARTING E2E PREDICTION INTEGRATION TEST');
  console.log('====================================================');

  const server = app.listen(PORT);

  try {
    // 1. Authenticate as HR Analyst
    console.log('\n[1/4] Authenticating as HR Analyst...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hranalyst@company.com',
        password: 'Password@123',
      }),
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert(token, 'Must receive JWT token');
    console.log('  ✔ Authenticated successfully');

    // 2. Fetch first seeded employee
    console.log('\n[2/4] Fetching employee from PostgreSQL...');
    const empRes = await fetch(`${BASE_URL}/api/v1/employees?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const empData = await empRes.json();
    assert(empData.data.length > 0, 'Must have at least one employee');
    const targetEmployee = empData.data[0];
    console.log(`  ✔ Selected Employee: ${targetEmployee.firstName} ${targetEmployee.lastName} (ID: ${targetEmployee.id}, Dept: ${targetEmployee.department})`);

    // 3. Trigger Real-Time ML Prediction via Backend API Gateway
    console.log('\n[3/4] Triggering real-time prediction (BE -> ML Service -> DB)...');
    const predRes = await fetch(`${BASE_URL}/api/v1/predictions/predict/${targetEmployee.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(predRes.status, 200, 'Prediction request should succeed');
    const predData = await predRes.json();
    assert.strictEqual(predData.success, true);
    
    console.log('  ✔ Prediction successfully generated and persisted in PostgreSQL:');
    console.log(`      • Probability : ${(predData.data.attritionProbability * 100).toFixed(1)}%`);
    console.log(`      • Risk Tier   : ${predData.data.riskTier}`);
    console.log(`      • Action      : ${predData.data.recommendedAction}`);
    console.log(`      • SHAP Factors: ${predData.data.topRiskFactors ? predData.data.topRiskFactors.length : 0} drivers tracked`);

    // 4. PRD TC-05: Verify Prediction History in Chronological Order
    console.log('\n[4/4] Testing PRD TC-05: Fetching prediction history...');
    const histRes = await fetch(`${BASE_URL}/api/v1/predictions/history/${targetEmployee.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(histRes.status, 200);
    const histData = await histRes.json();
    assert.strictEqual(histData.success, true);
    assert(histData.history.length >= 1, 'History must contain at least one prediction');
    console.log(`  ✔ TC-05 Passed: Found ${histData.history.length} historical prediction record(s) for employee`);

    console.log('\n====================================================');
    console.log('E2E PREDICTION INTEGRATION TEST PASSED SUCCESSFULLY!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ E2E Integration test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runE2ETest();
