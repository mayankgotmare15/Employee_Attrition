const prisma = require('../prisma');
const MLClient = require('../services/mlClient');
const { toMLFeatures } = require('./employeeController');

/**
 * Trigger an on-demand prediction for an individual employee
 */
async function predictForEmployee(req, res, next) {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Role check for Department Managers
    if (req.user.role === 'DEPT_MANAGER' && req.user.department && employee.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied: employee outside your department.' });
    }

    // Call ML Microservice
    const mlPayload = toMLFeatures(employee);
    const mlResult = await MLClient.predictSingle(mlPayload);

    // Fetch or verify active model version
    let activeModel = await prisma.modelVersion.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'desc' },
    });

    if (!activeModel) {
      // Fallback create default version if not registered
      activeModel = await prisma.modelVersion.create({
        data: {
          version: mlResult.model_version || 'v1.0.0',
          algorithm: 'LogisticRegression',
          accuracy: 0.7857,
          f1Score: 0.5039,
          rocAuc: 0.8080,
          status: 'ACTIVE',
        },
      });
    }

    // Save Prediction in PostgreSQL
    const predictionRecord = await prisma.prediction.create({
      data: {
        employeeId: employee.id,
        modelVersionId: activeModel.id,
        attritionProbability: mlResult.attrition_probability,
        riskTier: mlResult.risk_tier.toUpperCase(),
        recommendedAction: mlResult.recommended_action,
        topRiskFactors: mlResult.top_risk_factors,
      },
      include: {
        modelVersion: { select: { version: true, algorithm: true } },
      },
    });

    res.json({
      success: true,
      data: {
        predictionId: predictionRecord.id,
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        department: employee.department,
        jobRole: employee.jobRole,
        attritionProbability: predictionRecord.attritionProbability,
        riskTier: predictionRecord.riskTier,
        recommendedAction: predictionRecord.recommendedAction,
        topRiskFactors: predictionRecord.topRiskFactors,
        modelVersion: predictionRecord.modelVersion.version,
        predictedAt: predictionRecord.predictedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get prediction history for an employee in chronological order (PRD FR-4 & TC-05)
 */
async function getPredictionHistory(req, res, next) {
  try {
    const employeeId = parseInt(req.params.employeeId);
    if (isNaN(employeeId)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, firstName: true, lastName: true, department: true, jobRole: true },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Role check for Department Managers
    if (req.user.role === 'DEPT_MANAGER' && req.user.department && employee.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied: employee outside your department.' });
    }

    const history = await prisma.prediction.findMany({
      where: { employeeId },
      orderBy: { predictedAt: 'desc' },
      include: {
        modelVersion: { select: { version: true, algorithm: true } },
      },
    });

    res.json({
      success: true,
      employee,
      totalPredictions: history.length,
      history,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Batch score all employees across the organization or within a department
 */
async function batchPredictAll(req, res, next) {
  try {
    const { department } = req.body;
    const where = { status: 'ACTIVE' };

    if (req.user.role === 'DEPT_MANAGER' && req.user.department) {
      where.department = req.user.department;
    } else if (department) {
      where.department = department;
    }

    const employees = await prisma.employee.findMany({ where });
    if (employees.length === 0) {
      return res.json({ success: true, message: 'No active employees to evaluate.', count: 0 });
    }

    const activeModel = await prisma.modelVersion.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { id: 'desc' },
    });

    const mlList = employees.map(toMLFeatures);
    const batchResult = await MLClient.predictBatch(mlList);

    const savedRecords = [];
    for (let i = 0; i < batchResult.predictions.length; i++) {
      const pred = batchResult.predictions[i];
      const emp = employees[i];

      const record = await prisma.prediction.create({
        data: {
          employeeId: emp.id,
          modelVersionId: activeModel.id,
          attritionProbability: pred.attrition_probability,
          riskTier: pred.risk_tier.toUpperCase(),
          recommendedAction: pred.recommended_action,
          topRiskFactors: pred.top_risk_factors,
        },
      });
      savedRecords.push(record);
    }

    res.json({
      success: true,
      message: `Batch prediction completed for ${savedRecords.length} employees.`,
      summary: {
        totalEvaluated: batchResult.total_processed,
        highRisk: batchResult.high_risk_count,
        mediumRisk: batchResult.medium_risk_count,
        lowRisk: batchResult.low_risk_count,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  predictForEmployee,
  getPredictionHistory,
  batchPredictAll,
};
