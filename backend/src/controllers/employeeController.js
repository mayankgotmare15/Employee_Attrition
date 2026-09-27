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
 * Helper: Clean and safely parse integer values from CSV fields
 */
function safeInt(val, fallback, min = null, max = null) {
  if (val === undefined || val === null || val === '') return fallback;
  const cleaned = String(val).replace(/[$%,\s]/g, '');
  const parsed = parseInt(cleaned, 10);
  if (isNaN(parsed)) return fallback;
  if (min !== null && parsed < min) return min;
  if (max !== null && parsed > max) return max;
  return parsed;
}

/**
 * Helper: Clean string values
 */
function safeStr(val, fallback) {
  if (!val || typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Normalization helpers for categorical fields
 */
function normalizeDepartment(val) {
  const s = (val || '').toLowerCase();
  if (s.includes('sales')) return 'Sales';
  if (s.includes('human') || s.includes('hr')) return 'Human Resources';
  return 'Research & Development';
}

function normalizeGender(val) {
  const s = (val || '').toLowerCase();
  if (s.startsWith('f')) return 'Female';
  if (s.startsWith('m')) return 'Male';
  return 'Other';
}

function normalizeMaritalStatus(val) {
  const s = (val || '').toLowerCase();
  if (s.includes('divorc')) return 'Divorced';
  if (s.includes('sing')) return 'Single';
  return 'Married';
}

function normalizeBusinessTravel(val) {
  const s = (val || '').toLowerCase();
  if (s.includes('freq')) return 'Travel_Frequently';
  if (s.includes('non') || s.includes('no')) return 'Non-Travel';
  return 'Travel_Rarely';
}

function normalizeOverTime(val) {
  const s = (val || '').toLowerCase();
  if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Yes';
  return 'No';
}

/**
 * Helper: Case-insensitive and alias-aware row property accessor
 */
function createRowGetter(row) {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    if (key) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_\-]+/g, '');
      normalized[cleanKey] = val !== undefined && val !== null ? String(val).trim() : '';
    }
  }
  return function get(keys, defaultVal = '') {
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of keyList) {
      const cleanK = k.toLowerCase().replace(/[\s_\-]+/g, '');
      if (normalized[cleanK] !== undefined && normalized[cleanK] !== '') {
        return normalized[cleanK];
      }
    }
    return defaultVal;
  };
}

/**
 * Flexible Bulk CSV Upload & High-Performance Batch Ingestion
 */
async function uploadCSV(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No CSV file provided.' });
  }

  const filePath = req.file.path;
  const rawRows = [];

  fs.createReadStream(filePath)
    .pipe(csv({ mapHeaders: ({ header }) => (header ? header.trim().replace(/^\ufeff/, '') : '') }))
    .on('data', (data) => rawRows.push(data))
    .on('end', async () => {
      try {
        if (rawRows.length === 0) {
          fs.unlink(filePath, () => {});
          return res.status(400).json({ success: false, message: 'Uploaded CSV file contains no data rows.' });
        }

        // Fetch active model for inference
        const activeModel = await prisma.modelVersion.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { id: 'desc' },
        });

        // Determine starting employeeNumber
        const maxEmp = await prisma.employee.findFirst({
          orderBy: { employeeNumber: 'desc' },
          select: { employeeNumber: true },
        });
        let nextEmpNum = (maxEmp && maxEmp.employeeNumber ? maxEmp.employeeNumber : 1000) + 1;

        // Existing emails set to prevent duplicate email conflicts
        const existingUsers = await prisma.employee.findMany({ select: { email: true } });
        const usedEmails = new Set(existingUsers.map((e) => e.email).filter(Boolean));

        let importedCount = 0;
        let highCount = 0;
        let medCount = 0;
        let lowCount = 0;

        // Chunk processing to optimize DB and ML throughput
        const CHUNK_SIZE = 100;
        for (let i = 0; i < rawRows.length; i += CHUNK_SIZE) {
          const chunk = rawRows.slice(i, i + CHUNK_SIZE);
          const employeeRecords = [];

          for (const row of chunk) {
            const get = createRowGetter(row);

            // 1. Employee Number
            let empNum = safeInt(get(['employeenumber', 'employeeid', 'empid', 'id', 'empno', 'number']), null);
            if (!empNum || empNum <= 0) {
              empNum = nextEmpNum++;
            }

            // 2. Names
            let firstName = get(['firstname', 'first', 'fname']);
            let lastName = get(['lastname', 'last', 'lname']);
            const fullName = get(['name', 'fullname', 'employeename']);
            if (fullName && (!firstName || !lastName)) {
              const parts = fullName.split(/\s+/);
              firstName = parts[0] || 'Employee';
              lastName = parts.slice(1).join(' ') || `${empNum}`;
            } else {
              firstName = firstName || 'Employee';
              lastName = lastName || `${empNum}`;
            }

            // 3. Email
            let email = get(['email', 'mail', 'emailaddress']);
            if (!email || !email.includes('@')) {
              email = `emp${empNum}@company.com`;
            }
            if (usedEmails.has(email)) {
              email = `emp${empNum}_${Date.now().toString().slice(-4)}@company.com`;
            }
            usedEmails.add(email);

            // 4. Attributes with robust fallbacks
            const payload = {
              employeeNumber: empNum,
              firstName: safeStr(firstName, 'Employee'),
              lastName: safeStr(lastName, `${empNum}`),
              email,
              age: safeInt(get(['age', 'employeeage', 'emp_age']), 32, 18, 80),
              gender: normalizeGender(get(['gender', 'sex'])),
              maritalStatus: normalizeMaritalStatus(get(['maritalstatus', 'marital_status', 'marital'])),
              distanceFromHome: safeInt(get(['distancefromhome', 'distance_from_home', 'distance', 'commute']), 5, 1, 100),
              department: normalizeDepartment(get(['department', 'dept'])),
              jobRole: safeStr(get(['jobrole', 'job_role', 'role', 'position', 'designation', 'title']), 'Research Scientist'),
              jobLevel: safeInt(get(['joblevel', 'job_level', 'level']), 1, 1, 5),
              businessTravel: normalizeBusinessTravel(get(['businesstravel', 'business_travel', 'travel'])),
              totalWorkingYears: safeInt(get(['totalworkingyears', 'total_working_years', 'experience', 'totalexperience']), 6, 0, 50),
              yearsAtCompany: safeInt(get(['yearsatcompany', 'years_at_company', 'tenure']), 3, 0, 45),
              yearsInCurrentRole: safeInt(get(['yearsincurrentrole', 'years_in_current_role']), 2, 0, 40),
              yearsSinceLastPromotion: safeInt(get(['yearssincelastpromotion', 'years_since_last_promotion', 'promotionlag']), 1, 0, 30),
              yearsWithCurrManager: safeInt(get(['yearswithcurrmanager', 'years_with_curr_manager']), 2, 0, 35),
              numCompaniesWorked: safeInt(get(['numcompaniesworked', 'num_companies_worked', 'priorcompanies']), 1, 0, 20),
              monthlyIncome: safeInt(get(['monthlyincome', 'monthly_income', 'salary', 'income', 'monthlysalary']), 4800, 1000, 200000),
              dailyRate: safeInt(get(['dailyrate', 'daily_rate']), 800, 100, 5000),
              hourlyRate: safeInt(get(['hourlyrate', 'hourly_rate']), 65, 10, 500),
              monthlyRate: safeInt(get(['monthlyrate', 'monthly_rate']), 14000, 1000, 100000),
              percentSalaryHike: safeInt(get(['percentsalaryhike', 'percent_salary_hike', 'salaryhike', 'hike']), 14, 0, 100),
              stockOptionLevel: safeInt(get(['stockoptionlevel', 'stock_option_level', 'stockoptions']), 0, 0, 3),
              environmentSatisfaction: safeInt(get(['environmentsatisfaction', 'environment_satisfaction', 'envsatis']), 3, 1, 4),
              jobSatisfaction: safeInt(get(['jobsatisfaction', 'job_satisfaction']), 3, 1, 4),
              jobInvolvement: safeInt(get(['jobinvolvement', 'job_involvement']), 3, 1, 4),
              relationshipSatisfaction: safeInt(get(['relationshipsatisfaction', 'relationship_satisfaction']), 3, 1, 4),
              workLifeBalance: safeInt(get(['worklifebalance', 'work_life_balance', 'wlb']), 3, 1, 4),
              education: safeInt(get(['education', 'educationlevel']), 3, 1, 5),
              educationField: safeStr(get(['educationfield', 'education_field', 'field', 'degree']), 'Life Sciences'),
              performanceRating: safeInt(get(['performancerating', 'performance_rating', 'rating']), 3, 1, 4),
              trainingTimesLastYear: safeInt(get(['trainingtimeslastyear', 'training_times_last_year', 'trainings']), 2, 0, 10),
              overTime: normalizeOverTime(get(['overtime', 'over_time', 'ot'])),
              status: 'ACTIVE',
            };

            employeeRecords.push(payload);
          }

          // Upsert employees into Postgres
          const upsertedEmps = [];
          for (const empData of employeeRecords) {
            const emp = await prisma.employee.upsert({
              where: { employeeNumber: empData.employeeNumber },
              update: empData,
              create: empData,
            });
            upsertedEmps.push(emp);
          }

          // Vectorized Batch Inference via ML Microservice
          if (activeModel && upsertedEmps.length > 0) {
            try {
              const featuresList = upsertedEmps.map((emp) => toMLFeatures(emp));
              const batchResult = await MLClient.predictBatch(featuresList);

              if (batchResult && batchResult.predictions) {
                // Bulk insert predictions
                for (const p of batchResult.predictions) {
                  const empId = p.employee_id;
                  if (empId) {
                    await prisma.prediction.create({
                      data: {
                        employeeId: empId,
                        modelVersionId: activeModel.id,
                        attritionProbability: p.attrition_probability,
                        riskTier: p.risk_tier.toUpperCase(),
                        recommendedAction: p.recommended_action,
                        topRiskFactors: p.top_risk_factors,
                      },
                    });

                    if (p.risk_tier.toUpperCase() === 'HIGH') highCount++;
                    else if (p.risk_tier.toUpperCase() === 'MEDIUM') medCount++;
                    else lowCount++;
                  }
                }
              }
            } catch (mlErr) {
              console.warn('Batch ML scoring warning for chunk:', mlErr.message);
            }
          }

          importedCount += upsertedEmps.length;
        }

        // Clean up uploaded file
        fs.unlink(filePath, () => {});

        res.json({
          success: true,
          message: `Successfully ingested and scored ${importedCount} employee records from CSV.`,
          count: importedCount,
          riskBreakdown: {
            high: highCount,
            medium: medCount,
            low: lowCount,
          },
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

/**
 * Return downloadable sample CSV template
 */
function getSampleCSV(req, res) {
  const sampleHeaders = [
    'EmployeeNumber',
    'FirstName',
    'LastName',
    'Email',
    'Age',
    'Gender',
    'Department',
    'JobRole',
    'MonthlyIncome',
    'OverTime',
    'TotalWorkingYears',
    'YearsAtCompany',
    'YearsInCurrentRole',
    'YearsSinceLastPromotion',
    'YearsWithCurrManager',
    'DistanceFromHome',
    'JobLevel',
    'BusinessTravel',
    'MaritalStatus',
    'EnvironmentSatisfaction',
    'JobSatisfaction',
    'JobInvolvement',
    'RelationshipSatisfaction',
    'WorkLifeBalance',
    'Education',
    'EducationField',
    'NumCompaniesWorked',
    'PerformanceRating',
    'StockOptionLevel',
    'TrainingTimesLastYear',
    'DailyRate',
    'HourlyRate',
    'MonthlyRate',
    'PercentSalaryHike'
  ].join(',');

  const sampleRows = [
    '2001,Aarav,Sharma,aarav.sharma@company.com,34,Male,Research & Development,Research Scientist,6200,Yes,9,4,3,1,3,6,2,Travel_Rarely,Married,3,4,3,3,3,3,Life Sciences,1,3,1,2,800,65,14000,15',
    '2002,Priya,Patel,priya.patel@company.com,29,Female,Sales,Sales Executive,4900,Yes,6,3,2,0,2,12,1,Travel_Frequently,Single,2,2,2,3,2,3,Marketing,2,3,0,3,750,55,13000,12',
    '2003,Rohan,Verma,rohan.verma@company.com,42,Male,Research & Development,Healthcare Representative,8500,No,18,12,7,4,6,3,3,Non-Travel,Married,4,4,4,4,3,4,Medical,3,4,2,2,950,80,18000,18',
    '2004,Ananya,Iyer,ananya.iyer@company.com,26,Female,Human Resources,Human Resources,3800,Yes,3,2,1,0,1,18,1,Travel_Rarely,Single,2,2,3,2,2,2,Human Resources,1,3,0,1,600,45,11000,11',
    '2005,Vikram,Malhotra,vikram.malhotra@company.com,38,Male,Sales,Sales Executive,7200,No,14,8,5,2,4,4,2,Travel_Rarely,Married,3,3,3,3,3,3,Life Sciences,2,3,1,3,880,70,16000,14'
  ].join('\n');

  const csvContent = `${sampleHeaders}\n${sampleRows}`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="employee_attrition_sample_template.csv"');
  res.status(200).send(csvContent);
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadCSV,
  getSampleCSV,
  toMLFeatures,
};

