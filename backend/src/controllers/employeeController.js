const fs = require('fs');
const csv = require('csv-parser');
const prisma = require('../prisma');
const MLClient = require('../services/mlClient');

/**
 * Map employee DB record to the feature payload expected by FastAPI ML Service
 */
function toMLFeatures(emp) {
  return {
    employee_id: emp.id,
    Age: emp.age,
    Gender: emp.gender,
    MaritalStatus: emp.maritalStatus,
    DistanceFromHome: emp.distanceFromHome,
    Department: emp.department,
    JobRole: emp.jobRole,
    JobLevel: emp.jobLevel,
    BusinessTravel: emp.businessTravel,
    TotalWorkingYears: emp.totalWorkingYears,
    YearsAtCompany: emp.yearsAtCompany,
    YearsInCurrentRole: emp.yearsInCurrentRole,
    YearsSinceLastPromotion: emp.yearsSinceLastPromotion,
    YearsWithCurrManager: emp.yearsWithCurrManager,
    NumCompaniesWorked: emp.numCompaniesWorked,
    MonthlyIncome: emp.monthlyIncome,
    DailyRate: emp.dailyRate,
    HourlyRate: emp.hourlyRate,
    MonthlyRate: emp.monthlyRate,
    PercentSalaryHike: emp.percentSalaryHike,
    StockOptionLevel: emp.stockOptionLevel,
    EnvironmentSatisfaction: emp.environmentSatisfaction,
    JobSatisfaction: emp.jobSatisfaction,
    JobInvolvement: emp.jobInvolvement,
    RelationshipSatisfaction: emp.relationshipSatisfaction,
    WorkLifeBalance: emp.workLifeBalance,
    Education: emp.education,
    EducationField: emp.educationField,
    PerformanceRating: emp.performanceRating,
    TrainingTimesLastYear: emp.trainingTimesLastYear,
    OverTime: emp.overTime,
  };
}

/**
 * List employees with pagination, search, and role-based department filtering
 */
async function getEmployees(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { search, department, jobRole, riskTier, status = 'ACTIVE' } = req.query;

    const where = {};

    // Role-based department restriction: Dept Managers only see their own department
    if (req.user.role === 'DEPT_MANAGER' && req.user.department) {
      where.department = req.user.department;
    } else if (department) {
      where.department = department;
    }

    if (jobRole) where.jobRole = jobRole;
    if (status) where.status = status;

    if (search) {
      const searchNum = parseInt(search);
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        ...(!isNaN(searchNum) ? [{ employeeNumber: searchNum }] : []),
      ];
    }

    // Filter by risk tier on latest prediction
    if (riskTier) {
      where.predictions = {
        some: {
          riskTier: riskTier.toUpperCase(),
        },
      };
    }

    const [total, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          predictions: {
            take: 1,
            orderBy: { predictedAt: 'desc' },
            include: { modelVersion: { select: { version: true, algorithm: true } } },
          },
        },
      }),
    ]);

    const formatted = employees.map((emp) => ({
      ...emp,
      latestPrediction: emp.predictions[0] || null,
      predictions: undefined, // remove array for cleaner payload
    }));

    res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get employee by ID with prediction history
 */
async function getEmployeeById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid employee ID' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        predictions: {
          orderBy: { predictedAt: 'desc' },
          include: { modelVersion: { select: { version: true, algorithm: true } } },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    // Dept manager check
    if (req.user.role === 'DEPT_MANAGER' && req.user.department && employee.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied: employee outside your department.' });
    }

    res.json({
      success: true,
      data: {
        ...employee,
        latestPrediction: employee.predictions[0] || null,
        history: employee.predictions,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new employee and automatically compute initial attrition risk
 */
async function createEmployee(req, res, next) {
  try {
    const employeeData = req.body;

    // Dept manager check
    if (req.user.role === 'DEPT_MANAGER' && req.user.department) {
      employeeData.department = req.user.department;
    }

    const employee = await prisma.employee.create({
      data: employeeData,
    });

    // Run ML prediction if microservice is reachable
    let initialPrediction = null;
    try {
      const mlFeatures = toMLFeatures(employee);
      const predictionResult = await MLClient.predictSingle(mlFeatures);

      // Fetch active model version
      const activeModel = await prisma.modelVersion.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { id: 'desc' },
      });

      if (activeModel) {
        initialPrediction = await prisma.prediction.create({
          data: {
            employeeId: employee.id,
            modelVersionId: activeModel.id,
            attritionProbability: predictionResult.attrition_probability,
            riskTier: predictionResult.risk_tier.toUpperCase(),
            recommendedAction: predictionResult.recommended_action,
            topRiskFactors: predictionResult.top_risk_factors,
          },
        });
      }
    } catch (mlErr) {
      console.warn('ML Prediction on creation failed (will proceed):', mlErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: {
        ...employee,
        latestPrediction: initialPrediction,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an existing employee
 */
async function updateEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const updateData = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (req.user.role === 'DEPT_MANAGER' && req.user.department && existing.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied: employee outside your department.' });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Employee updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete an employee
 */
async function deleteEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    if (req.user.role === 'DEPT_MANAGER' && req.user.department && existing.department !== req.user.department) {
      return res.status(403).json({ success: false, message: 'Access denied: employee outside your department.' });
    }

    await prisma.employee.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Employee deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Bulk CSV Upload & Ingestion
 */
async function uploadCSV(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No CSV file provided.' });
  }

  const filePath = req.file.path;
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        let importedCount = 0;
        const activeModel = await prisma.modelVersion.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { id: 'desc' },
        });

        for (const row of results) {
          const empNum = parseInt(row.EmployeeNumber || row.employeeNumber || (10000 + importedCount));
          const employeePayload = {
            employeeNumber: empNum,
            firstName: row.FirstName || row.firstName || `Employee`,
            lastName: row.LastName || row.lastName || `${empNum}`,
            email: row.Email || row.email || `emp${empNum}@company.com`,
            age: parseInt(row.Age || 30),
            gender: row.Gender || 'Male',
            maritalStatus: row.MaritalStatus || 'Married',
            distanceFromHome: parseInt(row.DistanceFromHome || 5),
            department: row.Department || 'Research & Development',
            jobRole: row.JobRole || 'Research Scientist',
            jobLevel: parseInt(row.JobLevel || 1),
            businessTravel: row.BusinessTravel || 'Travel_Rarely',
            totalWorkingYears: parseInt(row.TotalWorkingYears || 5),
            yearsAtCompany: parseInt(row.YearsAtCompany || 3),
            yearsInCurrentRole: parseInt(row.YearsInCurrentRole || 2),
            yearsSinceLastPromotion: parseInt(row.YearsSinceLastPromotion || 1),
            yearsWithCurrManager: parseInt(row.YearsWithCurrManager || 2),
            numCompaniesWorked: parseInt(row.NumCompaniesWorked || 1),
            monthlyIncome: parseInt(row.MonthlyIncome || 4500),
            dailyRate: parseInt(row.DailyRate || 800),
            hourlyRate: parseInt(row.HourlyRate || 65),
            monthlyRate: parseInt(row.MonthlyRate || 14000),
            percentSalaryHike: parseInt(row.PercentSalaryHike || 14),
            stockOptionLevel: parseInt(row.StockOptionLevel || 1),
            environmentSatisfaction: parseInt(row.EnvironmentSatisfaction || 3),
            jobSatisfaction: parseInt(row.JobSatisfaction || 3),
            jobInvolvement: parseInt(row.JobInvolvement || 3),
            relationshipSatisfaction: parseInt(row.RelationshipSatisfaction || 3),
            workLifeBalance: parseInt(row.WorkLifeBalance || 3),
            education: parseInt(row.Education || 3),
            educationField: row.EducationField || 'Life Sciences',
            performanceRating: parseInt(row.PerformanceRating || 3),
            trainingTimesLastYear: parseInt(row.TrainingTimesLastYear || 2),
            overTime: row.OverTime || 'No',
            status: 'ACTIVE',
          };

          const emp = await prisma.employee.upsert({
            where: { employeeNumber: empNum },
            update: employeePayload,
            create: employeePayload,
          });

          // Score via ML
          if (activeModel) {
            try {
              const predResult = await MLClient.predictSingle(toMLFeatures(emp));
              await prisma.prediction.create({
                data: {
                  employeeId: emp.id,
                  modelVersionId: activeModel.id,
                  attritionProbability: predResult.attrition_probability,
                  riskTier: predResult.risk_tier.toUpperCase(),
                  recommendedAction: predResult.recommended_action,
                  topRiskFactors: predResult.top_risk_factors,
                },
              });
            } catch (pErr) {
              // Continue if single predict fails
            }
          }
          importedCount++;
        }

        // Clean up uploaded file
        fs.unlink(filePath, () => {});

        res.json({
          success: true,
          message: `Successfully processed and scored ${importedCount} employees from CSV.`,
          count: importedCount,
        });
      } catch (procErr) {
        fs.unlink(filePath, () => {});
        next(procErr);
      }
    })
    .on('error', (err) => {
      fs.unlink(filePath, () => {});
      next(err);
    });
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadCSV,
  toMLFeatures,
};
