/**
 * Seed script for populating default system users, active model registry,
 * and initial employee profiles in PostgreSQL via Prisma.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Seed Roles & Default Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const users = [
    {
      email: 'admin@company.com',
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash,
    },
    {
      email: 'hrmanager@company.com',
      name: 'Pooja Arora (HR Manager)',
      role: 'HR_MANAGER',
      passwordHash,
    },
    {
      email: 'hranalyst@company.com',
      name: 'Mayank Gotmare (HR Analyst)',
      role: 'HR_ANALYST',
      passwordHash,
    },
    {
      email: 'deptmanager@company.com',
      name: 'Pranav Shende (Sales Dept Manager)',
      role: 'DEPT_MANAGER',
      department: 'Sales',
      passwordHash,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log(`Successfully seeded ${users.length} system users.`);

  // 2. Read ML metadata and register champion model
  const metaPath = path.join(__dirname, '..', '..', 'ml-service', 'models', 'model_metadata.json');
  let modelMeta = {
    model_version: 'v1.0.0',
    champion_algorithm: 'LogisticRegression',
    champion_metrics: { accuracy: 0.7857, f1_score: 0.5039, roc_auc: 0.8080, precision: 0.4000, recall: 0.6809 },
  };

  if (fs.existsSync(metaPath)) {
    modelMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  const modelVersion = await prisma.modelVersion.upsert({
    where: { version: modelMeta.model_version },
    update: {
      status: 'ACTIVE',
      accuracy: modelMeta.champion_metrics.accuracy,
      f1Score: modelMeta.champion_metrics.f1_score,
      rocAuc: modelMeta.champion_metrics.roc_auc,
      precision: modelMeta.champion_metrics.precision,
      recall: modelMeta.champion_metrics.recall,
    },
    create: {
      version: modelMeta.model_version,
      algorithm: modelMeta.champion_algorithm,
      accuracy: modelMeta.champion_metrics.accuracy,
      f1Score: modelMeta.champion_metrics.f1_score,
      rocAuc: modelMeta.champion_metrics.roc_auc,
      precision: modelMeta.champion_metrics.precision,
      recall: modelMeta.champion_metrics.recall,
      status: 'ACTIVE',
    },
  });
  console.log(`Registered active model version: ${modelVersion.version} (${modelVersion.algorithm})`);

  // 3. Seed Sample Employees (Diverse Risk Profiles)
  const sampleEmployees = [
    {
      employeeNumber: 1001,
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@company.com',
      age: 26,
      gender: 'Male',
      maritalStatus: 'Single',
      distanceFromHome: 22,
      department: 'Sales',
      jobRole: 'Sales Representative',
      jobLevel: 1,
      businessTravel: 'Travel_Frequently',
      totalWorkingYears: 3,
      yearsAtCompany: 2,
      yearsInCurrentRole: 1,
      yearsSinceLastPromotion: 2,
      yearsWithCurrManager: 1,
      numCompaniesWorked: 3,
      monthlyIncome: 2300,
      dailyRate: 450,
      hourlyRate: 35,
      monthlyRate: 9800,
      percentSalaryHike: 11,
      stockOptionLevel: 0,
      environmentSatisfaction: 1,
      jobSatisfaction: 2,
      jobInvolvement: 2,
      relationshipSatisfaction: 2,
      workLifeBalance: 1,
      education: 2,
      educationField: 'Marketing',
      performanceRating: 3,
      trainingTimesLastYear: 1,
      overTime: 'Yes',
      status: 'ACTIVE',
    },
    {
      employeeNumber: 1002,
      firstName: 'Ananya',
      lastName: 'Iyer',
      email: 'ananya.iyer@company.com',
      age: 44,
      gender: 'Female',
      maritalStatus: 'Married',
      distanceFromHome: 4,
      department: 'Research & Development',
      jobRole: 'Research Director',
      jobLevel: 4,
      businessTravel: 'Non-Travel',
      totalWorkingYears: 18,
      yearsAtCompany: 12,
      yearsInCurrentRole: 8,
      yearsSinceLastPromotion: 1,
      yearsWithCurrManager: 6,
      numCompaniesWorked: 2,
      monthlyIncome: 14500,
      dailyRate: 1150,
      hourlyRate: 85,
      monthlyRate: 21000,
      percentSalaryHike: 18,
      stockOptionLevel: 2,
      environmentSatisfaction: 4,
      jobSatisfaction: 4,
      jobInvolvement: 4,
      relationshipSatisfaction: 4,
      workLifeBalance: 3,
      education: 4,
      educationField: 'Life Sciences',
      performanceRating: 4,
      trainingTimesLastYear: 3,
      overTime: 'No',
      status: 'ACTIVE',
    },
    {
      employeeNumber: 1003,
      firstName: 'Vikram',
      lastName: 'Patil',
      email: 'vikram.patil@company.com',
      age: 33,
      gender: 'Male',
      maritalStatus: 'Married',
      distanceFromHome: 12,
      department: 'Research & Development',
      jobRole: 'Laboratory Technician',
      jobLevel: 2,
      businessTravel: 'Travel_Rarely',
      totalWorkingYears: 7,
      yearsAtCompany: 4,
      yearsInCurrentRole: 2,
      yearsSinceLastPromotion: 3,
      yearsWithCurrManager: 2,
      numCompaniesWorked: 1,
      monthlyIncome: 4800,
      dailyRate: 720,
      hourlyRate: 55,
      monthlyRate: 13500,
      percentSalaryHike: 13,
      stockOptionLevel: 1,
      environmentSatisfaction: 3,
      jobSatisfaction: 3,
      jobInvolvement: 3,
      relationshipSatisfaction: 3,
      workLifeBalance: 2,
      education: 3,
      educationField: 'Medical',
      performanceRating: 3,
      trainingTimesLastYear: 2,
      overTime: 'Yes',
      status: 'ACTIVE',
    },
  ];

  for (const emp of sampleEmployees) {
    await prisma.employee.upsert({
      where: { employeeNumber: emp.employeeNumber },
      update: {},
      create: emp,
    });
  }
  console.log(`Successfully seeded ${sampleEmployees.length} sample employees.`);
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
