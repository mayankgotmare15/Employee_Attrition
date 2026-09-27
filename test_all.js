/**
 * Unified Full-Stack Test Suite Runner.
 * Executes all Phase 1-5 test suites and produces a unified report.
 */
const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd, label) {
  return new Promise((resolve) => {
    console.log(`\n======================================================`);
    console.log(`▶ RUNNING: [${label}]`);
    console.log(`Command: ${command} ${args.join(' ')}`);
    console.log(`Directory: ${cwd}`);
    console.log(`======================================================`);

    const start = Date.now();
    const proc = spawn(command, args, { cwd, shell: true, stdio: 'inherit' });

    proc.on('close', (code) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      resolve({
        label,
        code,
        duration: `${duration}s`,
        status: code === 0 ? 'PASSED' : 'FAILED',
      });
    });

    proc.on('error', (err) => {
      resolve({
        label,
        code: 1,
        duration: '0s',
        status: `ERROR: ${err.message}`,
      });
    });
  });
}

async function runAll() {
  console.log('######################################################');
  console.log('#   RETAINIQ MLOPS: COMPREHENSIVE FULL-STACK TEST   #');
  console.log('######################################################');

  const rootDir = __dirname;
  const results = [];

  // Suite 1: ML Microservice & Prediction Tests
  results.push(await runCommand(
    'python',
    ['-m', 'pytest', 'ml-service/tests/test_service.py', '-v'],
    rootDir,
    'Suite 1: ML Microservice Unit & Prediction Tests'
  ));

  // Suite 2: ML MLOps & TC-04 Retraining Engine
  results.push(await runCommand(
    'python',
    ['-m', 'pytest', 'ml-service/tests/test_mlops.py', '-v'],
    rootDir,
    'Suite 2: ML Drift Engine & TC-04 Retraining'
  ));

  // Suite 3: Backend API Gateway, Auth & RBAC
  results.push(await runCommand(
    'node',
    ['test/api_test.js'],
    path.join(rootDir, 'backend'),
    'Suite 3: Backend API Gateway, Auth & RBAC'
  ));

  // Suite 4: Frontend Production Build Validation
  results.push(await runCommand(
    'npm',
    ['run', 'build'],
    path.join(rootDir, 'frontend'),
    'Suite 4: React Frontend Production Build Validation'
  ));

  console.log('\n######################################################');
  console.log('#                  SUMMARY REPORT                    #');
  console.log('######################################################');
  console.table(results);

  const allPassed = results.every(r => r.code === 0);
  if (allPassed) {
    console.log('\n🎉 ALL FULL-STACK SUITES PASSED CLEANLY! Zero Regressions Found.');
    process.exit(0);
  } else {
    console.log('\n❌ SOME TEST SUITES FAILED. Check individual output above.');
    process.exit(1);
  }
}

runAll();
