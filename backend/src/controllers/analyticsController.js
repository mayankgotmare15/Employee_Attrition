const prisma = require('../prisma');

/**
 * Get comprehensive HR dashboard statistics and risk distribution
 */
async function getDashboardOverview(req, res, next) {
  try {
    const where = {};

    // Restrict department for Dept Managers
    if (req.user.role === 'DEPT_MANAGER' && req.user.department) {
      where.department = req.user.department;
    }

    const [totalEmployees, activeEmployees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.count({ where: { ...where, status: 'ACTIVE' } }),
    ]);

    // Fetch all employees in scope with their latest prediction
    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        department: true,
        jobRole: true,
        monthlyIncome: true,
        predictions: {
          take: 1,
          orderBy: { predictedAt: 'desc' },
          select: {
            id: true,
            attritionProbability: true,
            riskTier: true,
            recommendedAction: true,
            topRiskFactors: true,
            predictedAt: true,
          },
        },
      },
    });

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let unpredictedCount = 0;
    let sumProb = 0;
    let predictedCount = 0;

    const departmentStats = {};
    const highRiskAlerts = [];

    for (const emp of employees) {
      const pred = emp.predictions[0];
      const dept = emp.department;

      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, high: 0, medium: 0, low: 0, sumProb: 0 };
      }
      departmentStats[dept].total++;

      if (pred) {
        predictedCount++;
        sumProb += pred.attritionProbability;
        departmentStats[dept].sumProb += pred.attritionProbability;

        if (pred.riskTier === 'HIGH') {
          highCount++;
          departmentStats[dept].high++;
          highRiskAlerts.push({
            employeeId: emp.id,
            employeeNumber: emp.employeeNumber,
            name: `${emp.firstName} ${emp.lastName}`,
            department: emp.department,
            jobRole: emp.jobRole,
            monthlyIncome: emp.monthlyIncome,
            attritionProbability: pred.attritionProbability,
            riskTier: pred.riskTier,
            recommendedAction: pred.recommendedAction,
            topFactors: pred.topRiskFactors,
            predictedAt: pred.predictedAt,
          });
        } else if (pred.riskTier === 'MEDIUM') {
          mediumCount++;
          departmentStats[dept].medium++;
        } else {
          lowCount++;
          departmentStats[dept].low++;
        }
      } else {
        unpredictedCount++;
      }
    }

    // Sort high-risk alerts by highest probability first
    highRiskAlerts.sort((a, b) => b.attritionProbability - a.attritionProbability);

    const avgRisk = predictedCount > 0 ? Number((sumProb / predictedCount).toFixed(4)) : 0.0;

    // Format department stats
    const formattedDeptStats = Object.keys(departmentStats).map((dept) => {
      const d = departmentStats[dept];
      return {
        department: dept,
        totalEmployees: d.total,
        highRiskCount: d.high,
        mediumRiskCount: d.medium,
        lowRiskCount: d.low,
        avgRiskProbability: d.total > 0 ? Number((d.sumProb / d.total).toFixed(4)) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          scoredEmployees: predictedCount,
          unscoredEmployees: unpredictedCount,
          averageAttritionRisk: avgRisk,
        },
        riskDistribution: {
          high: { count: highCount, percentage: predictedCount > 0 ? Number(((highCount / predictedCount) * 100).toFixed(1)) : 0 },
          medium: { count: mediumCount, percentage: predictedCount > 0 ? Number(((mediumCount / predictedCount) * 100).toFixed(1)) : 0 },
          low: { count: lowCount, percentage: predictedCount > 0 ? Number(((lowCount / predictedCount) * 100).toFixed(1)) : 0 },
        },
        departmentBreakdown: formattedDeptStats,
        urgentAttentionEmployees: highRiskAlerts.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardOverview,
};
