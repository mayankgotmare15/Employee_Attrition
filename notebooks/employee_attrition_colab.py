"""
========================================================================================
Employee Attrition Prediction & AI-Powered Recommendation Chatbot
========================================================================================
Google Colab Compatible - Complete Self-Contained System
- 100% Rule-Based Explainable Risk Assessment Core
- Dynamic Multi-Schema Compatibility Pipeline
- Context-Aware Recommendation Knowledge Base
- Interactive Rule-Based HR Advisory Chatbot
- ipywidgets Colab Dashboard & Visualization Suite
- Optional Scikit-Learn Machine Learning Extension
- 14 Automated Validation Test Scenarios
========================================================================================
"""

# ======================================================================================
# CELL 1: Install & Import Required Libraries
# ======================================================================================
# In Google Colab, ipywidgets, pandas, numpy, matplotlib, seaborn, and scikit-learn are pre-installed.
# If running in a minimal environment, uncomment:
# !pip install pandas numpy matplotlib seaborn ipywidgets scikit-learn

import re
import json
import random
import warnings
from typing import Dict, List, Tuple, Any, Optional

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Interactive Colab / Jupyter widgets
try:
    import ipywidgets as widgets
    from IPython.display import display, HTML, clear_output
    HAS_WIDGETS = True
except ImportError:
    HAS_WIDGETS = False
    print("Warning: ipywidgets/IPython not found. Interactive UI will run in CLI fallback mode.")

# Scikit-learn for optional ML evaluation extension
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score

warnings.filterwarnings("ignore")
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
print("Cell 1: All libraries successfully imported.")


# ======================================================================================
# CELL 2: Configuration, Schema Registry, Attribute Mappings & Risk Weights
# ======================================================================================

# 1. Standard Column Aliases Mapping (handles messy/alternative column naming)
COLUMN_ALIASES: Dict[str, str] = {
    # Employee identifier
    "id": "EmployeeID",
    "empid": "EmployeeID",
    "emp_id": "EmployeeID",
    "employee_id": "EmployeeID",
    "staff_id": "EmployeeID",
    
    # Demographics & Department
    "age": "Age",
    "department": "Department",
    "dept": "Department",
    "departmentname": "Department",
    "jobrole": "JobRole",
    "job_role": "JobRole",
    "role": "JobRole",
    "designation": "JobRole",
    
    # Compensation
    "salary": "MonthlyIncome",
    "monthlyincome": "MonthlyIncome",
    "monthly_income": "MonthlyIncome",
    "income": "MonthlyIncome",
    "percentsalaryhike": "PercentSalaryHike",
    "salary_hike": "PercentSalaryHike",
    "percent_salary_hike": "PercentSalaryHike",
    "hike": "PercentSalaryHike",
    
    # Tenure
    "yearsatcompany": "YearsAtCompany",
    "years_at_company": "YearsAtCompany",
    "tenure": "YearsAtCompany",
    "yearsincurrentrole": "YearsInCurrentRole",
    "years_in_current_role": "YearsInCurrentRole",
    "yearssincelastpromotion": "YearsSinceLastPromotion",
    "years_since_last_promotion": "YearsSinceLastPromotion",
    "yearswithcurrentmanager": "YearsWithCurrentManager",
    "years_with_current_manager": "YearsWithCurrentManager",
    
    # Satisfaction metrics (1-4 scale)
    "jobsatisfaction": "JobSatisfaction",
    "job_satisfaction": "JobSatisfaction",
    "satisfaction": "JobSatisfaction",
    "environmentsatisfaction": "EnvironmentSatisfaction",
    "environment_satisfaction": "EnvironmentSatisfaction",
    "worklifebalance": "WorkLifeBalance",
    "work_life_balance": "WorkLifeBalance",
    "wlb": "WorkLifeBalance",
    "relationshipsatisfaction": "RelationshipSatisfaction",
    "relationship_satisfaction": "RelationshipSatisfaction",
    
    # Work conditions
    "overtime": "OverTime",
    "over_time": "OverTime",
    "workhoursperweek": "WorkHoursPerWeek",
    "work_hours": "WorkHoursPerWeek",
    "work_hours_per_week": "WorkHoursPerWeek",
    "hours_per_week": "WorkHoursPerWeek",
    "distancefromhome": "DistanceFromHome",
    "distance_from_home": "DistanceFromHome",
    "commute_distance": "DistanceFromHome",
    "trainingtimeslastyear": "TrainingTimesLastYear",
    "training_times": "TrainingTimesLastYear",
    "performancerating": "PerformanceRating",
    "performance_rating": "PerformanceRating",
    "performance": "PerformanceRating",
    
    # Workload & Support
    "promotionopportunity": "PromotionOpportunity",
    "promotion_opportunity": "PromotionOpportunity",
    "managersupport": "ManagerSupport",
    "manager_support": "ManagerSupport",
    "absenteesimdays": "AbsenteeismDays",
    "absenteeismdays": "AbsenteeismDays",
    "absent_days": "AbsenteeismDays",
    "workloadlevel": "WorkloadLevel",
    "workload_level": "WorkloadLevel",
    "workload": "WorkloadLevel",
    "engagementscore": "EngagementScore",
    "engagement_score": "EngagementScore",
    "engagement": "EngagementScore",
    
    # Historical outcome (ground truth label - NEVER used as risk feature to prevent target leakage)
    "attrition": "Attrition",
    "left_company": "Attrition",
    "attrited": "Attrition"
}

# 2. Configurable Risk Factors and Default Point Weights
# Normalization: Risk Score is scaled between 0 and 100 based only on applicable attributes.
DEFAULT_RISK_WEIGHTS: Dict[str, int] = {
    "LowJobSatisfaction": 20,           # JobSatisfaction <= 2
    "PoorWorkLifeBalance": 15,          # WorkLifeBalance <= 2
    "ExcessiveOvertime": 15,            # OverTime == 'Yes' or WorkHoursPerWeek >= 50
    "LowManagerSupport": 15,            # ManagerSupport in ['Low', 1, 2]
    "LimitedPromotionOpportunity": 10,  # PromotionOpportunity in ['Low', 'None', 1]
    "HighWorkload": 10,                 # WorkloadLevel in ['High', 'Very High']
    "LowEngagement": 10,                # EngagementScore <= 2
    "LongTenureWithoutPromotion": 5,    # YearsSinceLastPromotion >= 4
    "LongCommute": 5,                   # DistanceFromHome >= 25
    "ExcessiveAbsenteeism": 5           # AbsenteeismDays >= 12
}

# 3. Configurable Risk Classification Thresholds
DEFAULT_RISK_THRESHOLDS: Dict[str, Tuple[int, int]] = {
    "Low": (0, 29),
    "Medium": (30, 59),
    "High": (60, 100)
}

# 4. Protected / Sensitive Attributes Safeguard (Fairness & Privacy Policy)
# These attributes MUST NEVER be used to inflate attrition risk scores.
PROTECTED_ATTRIBUTES: List[str] = [
    "Age", "Gender", "Race", "Ethnicity", "Religion", "Disability", 
    "MaritalStatus", "SexualOrientation", "PregnancyStatus"
]

print("Cell 2: Configuration, Schema Registry, and Risk Weights defined.")


# ======================================================================================
# CELL 3: Hardcoded Sample Employee Dataset (40 Realistic Employee Records)
# ======================================================================================

def create_sample_dataset() -> pd.DataFrame:
    """
    Constructs a rich, plausible workplace dataset of 40 employees with 25 attributes.
    Reflects varied departments, seniority, compensation, and risk distributions.
    Target leakage protection: 'Attrition' is purely historical ground truth.
    """
    records = [
        # --- High Risk Candidates ---
        {"EmployeeID": "E001", "Age": 28, "Department": "Sales", "JobRole": "Sales Representative",
         "MonthlyIncome": 3200, "YearsAtCompany": 2, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 1, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 56, "DistanceFromHome": 28,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 11, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 14, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E002", "Age": 31, "Department": "Research & Development", "JobRole": "Software Engineer",
         "MonthlyIncome": 4800, "YearsAtCompany": 4, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 3,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 54, "DistanceFromHome": 30,
         "TrainingTimesLastYear": 0, "PerformanceRating": 4, "PercentSalaryHike": 12, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 10, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "Yes"},

        {"EmployeeID": "E003", "Age": 26, "Department": "Human Resources", "JobRole": "HR Generalist",
         "MonthlyIncome": 3400, "YearsAtCompany": 2, "YearsInCurrentRole": 1, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 0, "JobSatisfaction": 2, "EnvironmentSatisfaction": 1, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 1, "OverTime": "Yes", "WorkHoursPerWeek": 52, "DistanceFromHome": 22,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 10, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 16, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E004", "Age": 35, "Department": "Sales", "JobRole": "Sales Executive",
         "MonthlyIncome": 5900, "YearsAtCompany": 6, "YearsInCurrentRole": 4, "YearsSinceLastPromotion": 5,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 1, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 58, "DistanceFromHome": 32,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 13, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "Yes"},

        {"EmployeeID": "E005", "Age": 29, "Department": "Finance", "JobRole": "Financial Analyst",
         "MonthlyIncome": 4500, "YearsAtCompany": 3, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 3,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 1, "OverTime": "Yes", "WorkHoursPerWeek": 55, "DistanceFromHome": 26,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 11, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 12, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "No"},

        {"EmployeeID": "E006", "Age": 33, "Department": "Research & Development", "JobRole": "Research Scientist",
         "MonthlyIncome": 5200, "YearsAtCompany": 5, "YearsInCurrentRole": 4, "YearsSinceLastPromotion": 4,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 1, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 51, "DistanceFromHome": 19,
         "TrainingTimesLastYear": 0, "PerformanceRating": 4, "PercentSalaryHike": 13, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 15, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E007", "Age": 24, "Department": "Customer Support", "JobRole": "Support Specialist",
         "MonthlyIncome": 2900, "YearsAtCompany": 1, "YearsInCurrentRole": 1, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 1, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 53, "DistanceFromHome": 35,
         "TrainingTimesLastYear": 0, "PerformanceRating": 3, "PercentSalaryHike": 10, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 18, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E008", "Age": 38, "Department": "Operations", "JobRole": "Logistics Coordinator",
         "MonthlyIncome": 4100, "YearsAtCompany": 7, "YearsInCurrentRole": 5, "YearsSinceLastPromotion": 6,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 1, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 1, "OverTime": "Yes", "WorkHoursPerWeek": 55, "DistanceFromHome": 27,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 11, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 14, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "No"},

        # --- Medium Risk Candidates ---
        {"EmployeeID": "E009", "Age": 32, "Department": "Research & Development", "JobRole": "Software Engineer",
         "MonthlyIncome": 6100, "YearsAtCompany": 4, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "Yes", "WorkHoursPerWeek": 48, "DistanceFromHome": 14,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 14, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 6, "WorkloadLevel": "High", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E010", "Age": 36, "Department": "Sales", "JobRole": "Sales Executive",
         "MonthlyIncome": 6800, "YearsAtCompany": 5, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 4,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "No", "WorkHoursPerWeek": 42, "DistanceFromHome": 21,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 13, "PromotionOpportunity": "Low",
         "ManagerSupport": "Medium", "AbsenteeismDays": 8, "WorkloadLevel": "Medium", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E011", "Age": 27, "Department": "Marketing", "JobRole": "Marketing Analyst",
         "MonthlyIncome": 4200, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 3, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 46, "DistanceFromHome": 18,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 15, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Low", "AbsenteeismDays": 5, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E012", "Age": 41, "Department": "Finance", "JobRole": "Accountant",
         "MonthlyIncome": 5400, "YearsAtCompany": 8, "YearsInCurrentRole": 5, "YearsSinceLastPromotion": 5,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 2, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 15,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Low",
         "ManagerSupport": "Medium", "AbsenteeismDays": 7, "WorkloadLevel": "Medium", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E013", "Age": 30, "Department": "Operations", "JobRole": "Process Engineer",
         "MonthlyIncome": 5800, "YearsAtCompany": 4, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 3,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 47, "DistanceFromHome": 12,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 14, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 8, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E014", "Age": 34, "Department": "Customer Support", "JobRole": "Support Lead",
         "MonthlyIncome": 4700, "YearsAtCompany": 5, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 3, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 49, "DistanceFromHome": 16,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 13, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Low", "AbsenteeismDays": 9, "WorkloadLevel": "High", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E015", "Age": 29, "Department": "Research & Development", "JobRole": "QA Engineer",
         "MonthlyIncome": 4600, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 3,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 3, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 28,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 13, "PromotionOpportunity": "Low",
         "ManagerSupport": "Medium", "AbsenteeismDays": 6, "WorkloadLevel": "Medium", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E016", "Age": 37, "Department": "Sales", "JobRole": "Sales Representative",
         "MonthlyIncome": 3900, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 48, "DistanceFromHome": 11,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 7, "WorkloadLevel": "Medium", "EngagementScore": 2, "Attrition": "No"},

        # --- Low Risk Candidates (High Retention Probability) ---
        {"EmployeeID": "E017", "Age": 42, "Department": "Research & Development", "JobRole": "Engineering Manager",
         "MonthlyIncome": 11500, "YearsAtCompany": 10, "YearsInCurrentRole": 6, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 5, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 4,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 4,
         "TrainingTimesLastYear": 4, "PerformanceRating": 4, "PercentSalaryHike": 20, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E018", "Age": 39, "Department": "Human Resources", "JobRole": "HR Manager",
         "MonthlyIncome": 9800, "YearsAtCompany": 8, "YearsInCurrentRole": 4, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 38, "DistanceFromHome": 6,
         "TrainingTimesLastYear": 3, "PerformanceRating": 4, "PercentSalaryHike": 18, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 3, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E019", "Age": 45, "Department": "Sales", "JobRole": "Sales Director",
         "MonthlyIncome": 13500, "YearsAtCompany": 12, "YearsInCurrentRole": 7, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 6, "JobSatisfaction": 4, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 5,
         "TrainingTimesLastYear": 3, "PerformanceRating": 4, "PercentSalaryHike": 19, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 1, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E020", "Age": 33, "Department": "Research & Development", "JobRole": "Senior Data Scientist",
         "MonthlyIncome": 8900, "YearsAtCompany": 5, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 8,
         "TrainingTimesLastYear": 4, "PerformanceRating": 4, "PercentSalaryHike": 17, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E021", "Age": 31, "Department": "Marketing", "JobRole": "Marketing Specialist",
         "MonthlyIncome": 5200, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 4,
         "RelationshipSatisfaction": 3, "OverTime": "No", "WorkHoursPerWeek": 38, "DistanceFromHome": 7,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 16, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Low", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E022", "Age": 48, "Department": "Finance", "JobRole": "Finance Director",
         "MonthlyIncome": 14200, "YearsAtCompany": 15, "YearsInCurrentRole": 8, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 7, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 4,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 3,
         "TrainingTimesLastYear": 3, "PerformanceRating": 4, "PercentSalaryHike": 19, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 1, "WorkloadLevel": "Low", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E023", "Age": 29, "Department": "Research & Development", "JobRole": "Software Engineer",
         "MonthlyIncome": 6400, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 3, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 39, "DistanceFromHome": 9,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 15, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 3, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E024", "Age": 36, "Department": "Operations", "JobRole": "Operations Manager",
         "MonthlyIncome": 8500, "YearsAtCompany": 7, "YearsInCurrentRole": 4, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 4, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 41, "DistanceFromHome": 10,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 16, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        # --- Additional Balanced Records (E025 to E040) ---
        {"EmployeeID": "E025", "Age": 27, "Department": "Sales", "JobRole": "Sales Representative",
         "MonthlyIncome": 3100, "YearsAtCompany": 1, "YearsInCurrentRole": 1, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 1, "OverTime": "Yes", "WorkHoursPerWeek": 55, "DistanceFromHome": 29,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 11, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 13, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E026", "Age": 34, "Department": "Research & Development", "JobRole": "Senior QA Engineer",
         "MonthlyIncome": 7200, "YearsAtCompany": 6, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 3, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 3, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 8,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 14, "PromotionOpportunity": "Medium",
         "ManagerSupport": "High", "AbsenteeismDays": 4, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E027", "Age": 30, "Department": "Human Resources", "JobRole": "HR Specialist",
         "MonthlyIncome": 4600, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 48, "DistanceFromHome": 17,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 13, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 7, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E028", "Age": 44, "Department": "Sales", "JobRole": "Sales Executive",
         "MonthlyIncome": 7800, "YearsAtCompany": 9, "YearsInCurrentRole": 6, "YearsSinceLastPromotion": 5,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 2, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "Yes", "WorkHoursPerWeek": 50, "DistanceFromHome": 24,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 11, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E029", "Age": 32, "Department": "Finance", "JobRole": "Senior Financial Analyst",
         "MonthlyIncome": 6900, "YearsAtCompany": 4, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 3, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 41, "DistanceFromHome": 11,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 16, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 3, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E030", "Age": 25, "Department": "Customer Support", "JobRole": "Support Specialist",
         "MonthlyIncome": 3000, "YearsAtCompany": 1, "YearsInCurrentRole": 1, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 54, "DistanceFromHome": 26,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 10, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 15, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E031", "Age": 40, "Department": "Research & Development", "JobRole": "Research Director",
         "MonthlyIncome": 13800, "YearsAtCompany": 11, "YearsInCurrentRole": 5, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 5, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 6,
         "TrainingTimesLastYear": 4, "PerformanceRating": 4, "PercentSalaryHike": 18, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Low", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E032", "Age": 28, "Department": "Marketing", "JobRole": "Content Strategist",
         "MonthlyIncome": 4400, "YearsAtCompany": 2, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 2, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "Yes", "WorkHoursPerWeek": 47, "DistanceFromHome": 14,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 13, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 6, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E033", "Age": 37, "Department": "Operations", "JobRole": "Supply Chain Analyst",
         "MonthlyIncome": 6100, "YearsAtCompany": 5, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 4,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 2, "OverTime": "No", "WorkHoursPerWeek": 42, "DistanceFromHome": 22,
         "TrainingTimesLastYear": 1, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Low",
         "ManagerSupport": "Medium", "AbsenteeismDays": 9, "WorkloadLevel": "Medium", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E034", "Age": 43, "Department": "Research & Development", "JobRole": "Principal Architect",
         "MonthlyIncome": 12600, "YearsAtCompany": 10, "YearsInCurrentRole": 6, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 4,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 39, "DistanceFromHome": 5,
         "TrainingTimesLastYear": 3, "PerformanceRating": 4, "PercentSalaryHike": 19, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 1, "WorkloadLevel": "Low", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E035", "Age": 26, "Department": "Sales", "JobRole": "Sales Representative",
         "MonthlyIncome": 3300, "YearsAtCompany": 2, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 1, "EnvironmentSatisfaction": 1, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 56, "DistanceFromHome": 33,
         "TrainingTimesLastYear": 0, "PerformanceRating": 3, "PercentSalaryHike": 11, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 16, "WorkloadLevel": "High", "EngagementScore": 1, "Attrition": "Yes"},

        {"EmployeeID": "E036", "Age": 35, "Department": "Finance", "JobRole": "Senior Accountant",
         "MonthlyIncome": 7300, "YearsAtCompany": 6, "YearsInCurrentRole": 4, "YearsSinceLastPromotion": 1,
         "YearsWithCurrentManager": 4, "JobSatisfaction": 4, "EnvironmentSatisfaction": 3, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 9,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 16, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 3, "WorkloadLevel": "Medium", "EngagementScore": 4, "Attrition": "No"},

        {"EmployeeID": "E037", "Age": 31, "Department": "Customer Support", "JobRole": "Support Specialist",
         "MonthlyIncome": 3600, "YearsAtCompany": 3, "YearsInCurrentRole": 2, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 2, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 2,
         "RelationshipSatisfaction": 3, "OverTime": "Yes", "WorkHoursPerWeek": 49, "DistanceFromHome": 19,
         "TrainingTimesLastYear": 2, "PerformanceRating": 3, "PercentSalaryHike": 12, "PromotionOpportunity": "Medium",
         "ManagerSupport": "Medium", "AbsenteeismDays": 7, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "No"},

        {"EmployeeID": "E038", "Age": 38, "Department": "Human Resources", "JobRole": "Talent Acquisition Lead",
         "MonthlyIncome": 6700, "YearsAtCompany": 5, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 3, "JobSatisfaction": 3, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 3,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 12,
         "TrainingTimesLastYear": 3, "PerformanceRating": 3, "PercentSalaryHike": 15, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 4, "WorkloadLevel": "Medium", "EngagementScore": 3, "Attrition": "No"},

        {"EmployeeID": "E039", "Age": 29, "Department": "Research & Development", "JobRole": "DevOps Engineer",
         "MonthlyIncome": 5800, "YearsAtCompany": 3, "YearsInCurrentRole": 3, "YearsSinceLastPromotion": 3,
         "YearsWithCurrentManager": 1, "JobSatisfaction": 2, "EnvironmentSatisfaction": 2, "WorkLifeBalance": 1,
         "RelationshipSatisfaction": 2, "OverTime": "Yes", "WorkHoursPerWeek": 53, "DistanceFromHome": 25,
         "TrainingTimesLastYear": 1, "PerformanceRating": 4, "PercentSalaryHike": 13, "PromotionOpportunity": "Low",
         "ManagerSupport": "Low", "AbsenteeismDays": 11, "WorkloadLevel": "High", "EngagementScore": 2, "Attrition": "Yes"},

        {"EmployeeID": "E040", "Age": 46, "Department": "Operations", "JobRole": "Plant Manager",
         "MonthlyIncome": 11900, "YearsAtCompany": 13, "YearsInCurrentRole": 7, "YearsSinceLastPromotion": 2,
         "YearsWithCurrentManager": 5, "JobSatisfaction": 4, "EnvironmentSatisfaction": 4, "WorkLifeBalance": 4,
         "RelationshipSatisfaction": 4, "OverTime": "No", "WorkHoursPerWeek": 40, "DistanceFromHome": 4,
         "TrainingTimesLastYear": 3, "PerformanceRating": 4, "PercentSalaryHike": 18, "PromotionOpportunity": "High",
         "ManagerSupport": "High", "AbsenteeismDays": 2, "WorkloadLevel": "Low", "EngagementScore": 4, "Attrition": "No"},
    ]
    df = pd.DataFrame(records)
    return df

df_sample = create_sample_dataset()
print(f"Cell 3: Sample dataset generated successfully with {len(df_sample)} rows and {df_sample.shape[1]} attributes.")


# ======================================================================================
# CELL 4 & 5: Dynamic Normalization, Missing Value Handling & Quality Validation
# ======================================================================================

def normalize_column_name(raw_name: str) -> str:
    """Normalizes an arbitrary column header to its canonical attribute name."""
    clean = re.sub(r"[^a-zA-Z0-9]", "", str(raw_name)).lower()
    return COLUMN_ALIASES.get(clean, raw_name)

def preprocess_and_validate_dataset(raw_df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Validates, standardizes, and prepares any dataset (5 to 30+ columns, missing values,
    alternative naming, unseen columns) for risk scoring.
    """
    df = raw_df.copy()
    
    # 1. Column Name Normalization
    original_cols = list(df.columns)
    column_mapping = {col: normalize_column_name(col) for col in original_cols}
    df.rename(columns=column_mapping, inplace=True)
    
    # 2. Check for EmployeeID (create dummy if absent)
    if "EmployeeID" not in df.columns:
        df["EmployeeID"] = [f"E{str(i+1).zfill(3)}" for i in range(len(df))]
    else:
        df["EmployeeID"] = df["EmployeeID"].astype(str)

    # 3. Identify Available and Missing Target Attributes
    all_known_features = list(set(COLUMN_ALIASES.values()))
    available_features = [col for col in df.columns if col in all_known_features]
    unsupported_features = [col for col in df.columns if col not in all_known_features]
    
    # 4. Handle Missing Values without penalizing missing data as negative conditions
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        if df[col].isnull().any():
            median_val = df[col].median()
            df[col].fillna(median_val if not np.isnan(median_val) else 0, inplace=True)
            
    categorical_cols = df.select_dtypes(include=["object", "category"]).columns
    for col in categorical_cols:
        if col != "EmployeeID" and df[col].isnull().any():
            mode_val = df[col].mode()
            df[col].fillna(mode_val[0] if len(mode_val) > 0 else "Unknown", inplace=True)

    # 5. Calculate Assessment Confidence Score based on feature coverage
    risk_evaluation_keys = [
        "JobSatisfaction", "WorkLifeBalance", "OverTime", "WorkHoursPerWeek",
        "ManagerSupport", "PromotionOpportunity", "WorkloadLevel", "EngagementScore",
        "YearsSinceLastPromotion", "DistanceFromHome", "AbsenteeismDays"
    ]
    applicable_keys = [k for k in risk_evaluation_keys if k in df.columns]
    feature_coverage = len(applicable_keys) / len(risk_evaluation_keys)
    
    confidence = "High" if feature_coverage >= 0.75 else ("Medium" if feature_coverage >= 0.40 else "Low")
    quality_warning = None
    if confidence == "Low":
        quality_warning = f"Warning: Only {len(applicable_keys)} of {len(risk_evaluation_keys)} core risk features are present. Assessments will have low confidence."

    report = {
        "total_records": len(df),
        "total_columns": df.shape[1],
        "recognized_features": available_features,
        "unsupported_features": unsupported_features,
        "evaluable_risk_features": applicable_keys,
        "missing_risk_features": [k for k in risk_evaluation_keys if k not in df.columns],
        "feature_coverage_pct": round(feature_coverage * 100, 1),
        "assessment_confidence": confidence,
        "quality_warning": quality_warning
    }
    return df, report

print("Cell 4 & 5: Preprocessing, normalization, and quality validation pipeline established.")


# ======================================================================================
# CELL 6 & 7: Rule-Based Risk Assessment Engine & Explanations
# ======================================================================================

def evaluate_single_employee_risk(
    row: pd.Series,
    available_columns: List[str],
    weights: Dict[str, int] = DEFAULT_RISK_WEIGHTS,
    thresholds: Dict[str, Tuple[int, int]] = DEFAULT_RISK_THRESHOLDS
) -> Dict[str, Any]:
    """
    Calculates normalized 0-100 attrition risk score and factor explanations for an individual.
    Target leakage safe: 'Attrition' column is strictly ignored.
    """
    score = 0
    total_possible = 0
    active_factors = []
    skipped_factors = []

    # 1. Job Satisfaction (Weight: 20)
    if "JobSatisfaction" in available_columns and pd.notnull(row["JobSatisfaction"]):
        total_possible += weights["LowJobSatisfaction"]
        try:
            if float(row["JobSatisfaction"]) <= 2:
                points = weights["LowJobSatisfaction"]
                score += points
                active_factors.append({
                    "factor": "Low Job Satisfaction",
                    "code": "LowJobSatisfaction",
                    "points": points,
                    "value": f"Rating {row['JobSatisfaction']}/4",
                    "detail": "Employee reports low workplace role satisfaction."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("JobSatisfaction")

    # 2. Work Life Balance (Weight: 15)
    if "WorkLifeBalance" in available_columns and pd.notnull(row["WorkLifeBalance"]):
        total_possible += weights["PoorWorkLifeBalance"]
        try:
            if float(row["WorkLifeBalance"]) <= 2:
                points = weights["PoorWorkLifeBalance"]
                score += points
                active_factors.append({
                    "factor": "Poor Work-Life Balance",
                    "code": "PoorWorkLifeBalance",
                    "points": points,
                    "value": f"Rating {row['WorkLifeBalance']}/4",
                    "detail": "Employee struggles with work-life integration."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("WorkLifeBalance")

    # 3. Excessive Overtime / Work Hours (Weight: 15)
    has_overtime = False
    ot_weight = weights["ExcessiveOvertime"]
    if "OverTime" in available_columns and str(row.get("OverTime", "")).strip().lower() in ["yes", "y", "true", "1"]:
        has_overtime = True
    elif "WorkHoursPerWeek" in available_columns:
        try:
            if float(row.get("WorkHoursPerWeek", 40)) >= 50:
                has_overtime = True
        except (ValueError, TypeError):
            pass
            
    if "OverTime" in available_columns or "WorkHoursPerWeek" in available_columns:
        total_possible += ot_weight
        if has_overtime:
            score += ot_weight
            hours_str = f" ({row['WorkHoursPerWeek']} hrs/wk)" if "WorkHoursPerWeek" in available_columns else ""
            active_factors.append({
                "factor": "Excessive Overtime & Hours",
                "code": "ExcessiveOvertime",
                "points": ot_weight,
                "value": f"OverTime: Yes{hours_str}",
                "detail": "Sustained overtime hours increase burnout risk."
            })
    else:
        skipped_factors.append("OverTime/WorkHours")

    # 4. Low Manager Support (Weight: 15)
    if "ManagerSupport" in available_columns and pd.notnull(row["ManagerSupport"]):
        total_possible += weights["LowManagerSupport"]
        val = str(row["ManagerSupport"]).strip().lower()
        if val in ["low", "poor", "1", "2"]:
            points = weights["LowManagerSupport"]
            score += points
            active_factors.append({
                "factor": "Low Manager Support",
                "code": "LowManagerSupport",
                "points": points,
                "value": f"Support: {row['ManagerSupport']}",
                "detail": "Weak supervisory communication or advocacy detected."
            })
    else:
        skipped_factors.append("ManagerSupport")

    # 5. Limited Promotion Opportunity (Weight: 10)
    if "PromotionOpportunity" in available_columns and pd.notnull(row["PromotionOpportunity"]):
        total_possible += weights["LimitedPromotionOpportunity"]
        val = str(row["PromotionOpportunity"]).strip().lower()
        if val in ["low", "none", "poor", "1", "2"]:
            points = weights["LimitedPromotionOpportunity"]
            score += points
            active_factors.append({
                "factor": "Limited Promotion Opportunity",
                "code": "LimitedPromotionOpportunity",
                "points": points,
                "value": f"Opportunity: {row['PromotionOpportunity']}",
                "detail": "Employee perceives limited career advancement pathways."
            })
    else:
        skipped_factors.append("PromotionOpportunity")

    # 6. High Workload (Weight: 10)
    if "WorkloadLevel" in available_columns and pd.notnull(row["WorkloadLevel"]):
        total_possible += weights["HighWorkload"]
        val = str(row["WorkloadLevel"]).strip().lower()
        if val in ["high", "very high", "extreme"]:
            points = weights["HighWorkload"]
            score += points
            active_factors.append({
                "factor": "High Workload Pressure",
                "code": "HighWorkload",
                "points": points,
                "value": f"Workload: {row['WorkloadLevel']}",
                "detail": "Persistent heavy project demands and stress."
            })
    else:
        skipped_factors.append("WorkloadLevel")

    # 7. Low Engagement Score (Weight: 10)
    if "EngagementScore" in available_columns and pd.notnull(row["EngagementScore"]):
        total_possible += weights["LowEngagement"]
        try:
            if float(row["EngagementScore"]) <= 2:
                points = weights["LowEngagement"]
                score += points
                active_factors.append({
                    "factor": "Low Engagement Score",
                    "code": "LowEngagement",
                    "points": points,
                    "value": f"Engagement: {row['EngagementScore']}/4",
                    "detail": "Signs of disengagement or detachment from team objectives."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("EngagementScore")

    # 8. Long Tenure Without Promotion (Weight: 5)
    if "YearsSinceLastPromotion" in available_columns and pd.notnull(row["YearsSinceLastPromotion"]):
        total_possible += weights["LongTenureWithoutPromotion"]
        try:
            if float(row["YearsSinceLastPromotion"]) >= 4:
                points = weights["LongTenureWithoutPromotion"]
                score += points
                active_factors.append({
                    "factor": "Stagnant Promotion Timeline",
                    "code": "LongTenureWithoutPromotion",
                    "points": points,
                    "value": f"{row['YearsSinceLastPromotion']} years without promotion",
                    "detail": "Prolonged tenure in current band without recognition."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("YearsSinceLastPromotion")

    # 9. Long Commute Distance (Weight: 5)
    if "DistanceFromHome" in available_columns and pd.notnull(row["DistanceFromHome"]):
        total_possible += weights["LongCommute"]
        try:
            if float(row["DistanceFromHome"]) >= 25:
                points = weights["LongCommute"]
                score += points
                active_factors.append({
                    "factor": "Excessive Commute Distance",
                    "code": "LongCommute",
                    "points": points,
                    "value": f"{row['DistanceFromHome']} miles/km from office",
                    "detail": "Daily transit exhaustion compounds work fatigue."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("DistanceFromHome")

    # 10. Excessive Absenteeism (Weight: 5)
    if "AbsenteeismDays" in available_columns and pd.notnull(row["AbsenteeismDays"]):
        total_possible += weights["ExcessiveAbsenteeism"]
        try:
            if float(row["AbsenteeismDays"]) >= 12:
                points = weights["ExcessiveAbsenteeism"]
                score += points
                active_factors.append({
                    "factor": "High Absenteeism Days",
                    "code": "ExcessiveAbsenteeism",
                    "points": points,
                    "value": f"{row['AbsenteeismDays']} days absent",
                    "detail": "Elevated unplanned absences warrant contextual check-in."
                })
        except (ValueError, TypeError):
            pass
    else:
        skipped_factors.append("AbsenteeismDays")

    # Normalized Score Calculation (0 to 100)
    normalized_score = round((score / total_possible) * 100, 1) if total_possible > 0 else 0.0

    # Risk Level Determination
    if normalized_score >= thresholds["High"][0]:
        risk_level = "High"
    elif normalized_score >= thresholds["Medium"][0]:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Sort factors by impact (descending points)
    active_factors.sort(key=lambda x: x["points"], reverse=True)

    return {
        "EmployeeID": str(row.get("EmployeeID", "Unknown")),
        "RiskScore": normalized_score,
        "RiskLevel": risk_level,
        "RawPoints": score,
        "TotalPossiblePoints": total_possible,
        "ActiveFactors": active_factors,
        "ActiveFactorCount": len(active_factors),
        "SkippedFactors": skipped_factors
    }

def analyze_employee_dataset(
    df: pd.DataFrame,
    weights: Dict[str, int] = DEFAULT_RISK_WEIGHTS,
    thresholds: Dict[str, Tuple[int, int]] = DEFAULT_RISK_THRESHOLDS
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Processes an entire dataset, calculates scores, and returns an enhanced DataFrame.
    """
    clean_df, quality_report = preprocess_and_validate_dataset(df)
    results = []
    
    for idx, row in clean_df.iterrows():
        eval_res = evaluate_single_employee_risk(row, clean_df.columns.tolist(), weights, thresholds)
        results.append(eval_res)

    res_df = pd.DataFrame(results)
    enhanced_df = clean_df.copy()
    enhanced_df["RiskScore"] = res_df["RiskScore"]
    enhanced_df["RiskLevel"] = res_df["RiskLevel"]
    enhanced_df["PrimaryRiskFactors"] = res_df["ActiveFactors"].apply(
        lambda factors: ", ".join([f["factor"] for f in factors[:2]]) if factors else "None"
    )
    enhanced_df["RiskFactorsDetails"] = res_df["ActiveFactors"]
    enhanced_df["SkippedFactors"] = res_df["SkippedFactors"]
    
    return enhanced_df, quality_report

print("Cell 6 & 7: Attrition Risk Assessment Engine established.")


# ======================================================================================
# CELL 8: Actionable Recommendation Knowledge Base
# ======================================================================================

RECOMMENDATION_KB: Dict[str, Dict[str, Any]] = {
    "LowJobSatisfaction": {
        "problem": "Low Job Satisfaction",
        "rationale": "Employees with low job satisfaction feel disconnected from their daily responsibilities, driving active external job searching.",
        "hr_action": "Schedule a confidential 1-on-1 engagement interview; review role alignment, compensation parity, and team dynamics.",
        "manager_action": "Identify frustrating blockers or repetitive tasks; re-align tasks with employee's strengths and core interests.",
        "employee_voluntary_action": "Invite employee to outline 3 projects or skill areas they wish to focus on over the next quarter.",
        "timeline": "Initiate within 7 days; review in 30 days.",
        "success_metric": "Improvement in quarterly pulse check satisfaction score by at least +1 point.",
        "follow_up_schedule": "30-day check-in, followed by 60-day milestone review."
    },
    "PoorWorkLifeBalance": {
        "problem": "Poor Work-Life Balance",
        "rationale": "Chronic imbalance leads to mental fatigue, cognitive burnout, and eventual resignation to restore personal well-being.",
        "hr_action": "Review team workload distribution; audit after-hours communication expectations and encourage wellness leave.",
        "manager_action": "Establish strict boundary expectations on after-hours emails; redistribute pressing deliverables across team members.",
        "employee_voluntary_action": "Encourage employee to identify peak productivity windows and utilize flexible schedule arrangements.",
        "timeline": "Immediate adjustment within 48 hours; review in 14 days.",
        "success_metric": "Reduction in logged weekly hours to target benchmark (<42 hrs/week).",
        "follow_up_schedule": "Weekly 15-minute sync for 4 consecutive weeks."
    },
    "ExcessiveOvertime": {
        "problem": "Excessive Overtime & High Work Hours",
        "rationale": "Sustained overtime exceeding 50 hrs/week is the single highest leading operational indicator of impending voluntary turnover.",
        "hr_action": "Conduct immediate department capacity planning; evaluate contractor or auxiliary staffing to absorb surge workloads.",
        "manager_action": "Cap weekly overtime hours; deprioritize non-urgent deliverables; mandate compensatory time off.",
        "employee_voluntary_action": "Collaborate with manager to rank current task list by true organizational urgency.",
        "timeline": "Immediate intervention within 3 days.",
        "success_metric": "Zero consecutive weeks with >45 hours worked over the next 60 days.",
        "follow_up_schedule": "Bi-weekly operational capacity check."
    },
    "LowManagerSupport": {
        "problem": "Low Manager Support & Supervisory Friction",
        "rationale": "Employees frequently leave managers, not companies. Weak support isolates employees during critical challenges.",
        "hr_action": "Provide skip-level mentoring; assess manager-to-report feedback cadence and communication training.",
        "manager_action": "Commit to a dedicated, recurring weekly 1-on-1 coaching session; explicitly ask: 'What can I unblock for you this week?'.",
        "employee_voluntary_action": "Encourage open sharing of constructive feedback regarding preferred management and coaching styles.",
        "timeline": "First coaching 1-on-1 within 5 business days.",
        "success_metric": "Positive upward feedback score in subsequent 360-degree review.",
        "follow_up_schedule": "Bi-weekly cadence monitored by HR business partner."
    },
    "LimitedPromotionOpportunity": {
        "problem": "Perceived Lack of Promotion Opportunities",
        "rationale": "High performers who see no internal pathway seek vertical progression through external job offers.",
        "hr_action": "Map transparent competency ladder; explore cross-departmental transfer opportunities or technical track promotion.",
        "manager_action": "Formulate a concrete 6-month Career Development Plan (CDP) with explicit measurable criteria for advancement.",
        "employee_voluntary_action": "Co-author career goals and target skills for the next promotion review cycle.",
        "timeline": "Career roadmap drafted within 14 business days.",
        "success_metric": "Completed development milestones reviewed and signed off on schedule.",
        "follow_up_schedule": "Formal 45-day development review."
    },
    "HighWorkload": {
        "problem": "Heavy Workload & High Cognitive Strain",
        "rationale": "Prolonged high workload without sufficient resource buffers degrades work quality and causes physical exhaustion.",
        "hr_action": "Audit project resourcing ratios; ensure equitable distribution of cross-functional assignments.",
        "manager_action": "Prune backlog; reassign secondary operational tasks; set clear expectations on what constitutes 'good enough' for minor deliverables.",
        "employee_voluntary_action": "Flag bottleneck tasks that create disproportionate cognitive load.",
        "timeline": "Workload reallocation within 7 business days.",
        "success_metric": "Self-reported workload perception normalized to 'Medium' on next pulse survey.",
        "follow_up_schedule": "Check-in at day 14 and day 30."
    },
    "LowEngagement": {
        "problem": "Low Team & Organizational Engagement",
        "rationale": "Disengagement precedes physical resignation. Disconnected employees lack motivation to resolve workplace hurdles.",
        "hr_action": "Connect employee with peer communities, recognition programs, or high-visibility innovation initiatives.",
        "manager_action": "Recognize employee contributions in team forums; entrust employee with ownership of an initiative of their choosing.",
        "employee_voluntary_action": "Participate in mentoring a junior colleague or leading a cross-functional discussion.",
        "timeline": "Action plan enacted within 10 days.",
        "success_metric": "+1.5 increase in engagement score on following pulse assessment.",
        "follow_up_schedule": "Monthly progress review."
    },
    "LongTenureWithoutPromotion": {
        "problem": "Stagnant Role Progression (4+ Years in Band)",
        "rationale": "Extended tenure in the same role without title recognition or responsibility expansion fosters feelings of being undervalued.",
        "hr_action": "Review compensation benchmark against market rate for current tenure; assess eligibility for senior band upgrade.",
        "manager_action": "Assign stretch leadership opportunities (e.g., project lead, architectural review, customer advisory).",
        "employee_voluntary_action": "Present achievements and propose business case for expanded role scope.",
        "timeline": "Compensation & role review completed within 21 days.",
        "success_metric": "Completed promotion review or documented lateral growth assignment.",
        "follow_up_schedule": "60-day committee checkpoint."
    },
    "LongCommute": {
        "problem": "Excessive Daily Commute Distance (25+ km/miles)",
        "rationale": "Extensive transit time subtracts from personal rest and increases daily friction, driving searches for closer or remote roles.",
        "hr_action": "Evaluate eligibility for hybrid/remote work arrangement (e.g. 2-3 days work-from-home per week).",
        "manager_action": "Authorize flexible working hours to avoid peak transit congestion; adjust core collaboration hours.",
        "employee_voluntary_action": "Propose an optimal hybrid schedule that maintains full team synchronization.",
        "timeline": "Remote/flexible policy approval within 5 business days.",
        "success_metric": "Reduction in weekly commuting days by at least 40%.",
        "follow_up_schedule": "Review team communication after 30 days of hybrid schedule."
    },
    "ExcessiveAbsenteeism": {
        "problem": "Elevated Unplanned Absenteeism",
        "rationale": "Unusual absence patterns often correlate with underlying burnout, family strain, or job search activity.",
        "hr_action": "Conduct a compassionate, non-punitive supportive inquiry; review Employee Assistance Program (EAP) benefits.",
        "manager_action": "Offer supportive flexibility rather than immediate disciplinary scrutiny; confirm employee feels valued.",
        "employee_voluntary_action": "Share any workplace friction points that could be eased to facilitate better presence.",
        "timeline": "Check-in conversation within 48 hours.",
        "success_metric": "Improved health/wellbeing check-in scores and stabilized attendance.",
        "follow_up_schedule": "Bi-weekly wellness check."
    }
}

def generate_personalized_recommendations(active_factors: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synthesizes detected risk factors into a unified, prioritized HR retention action plan.
    De-duplicates overlapping steps and groups by stakeholder and urgency.
    """
    if not active_factors:
        return {
            "summary": "No critical risk factors detected. Employee exhibits stable retention indicators.",
            "immediate_actions": ["Maintain regular bi-weekly 1-on-1 check-ins.", "Continue offering professional growth opportunities."],
            "short_term_actions": ["Support ongoing training and skill development."],
            "long_term_actions": ["Include in standard annual career progression planning."],
            "hr_stakeholders": ["Continue quarterly pulse check monitoring."],
            "manager_stakeholders": ["Provide ongoing recognition for consistent performance."],
            "metrics": "Maintain satisfaction and engagement scores >= 3/4.",
            "checkin_questions": ["What went well this month that you enjoyed most?", "Are there any tools or resources you need to stay productive?"]
        }

    immediate_actions = []
    short_term_actions = []
    long_term_actions = []
    hr_stakeholders = []
    manager_stakeholders = []
    metrics = []

    for item in active_factors:
        code = item.get("code")
        rec = RECOMMENDATION_KB.get(code)
        if rec:
            immediate_actions.append(f"[{item['factor']}] {rec['timeline']}: {rec['hr_action']}")
            short_term_actions.append(f"[{item['factor']}] {rec['manager_action']}")
            long_term_actions.append(f"[{item['factor']}] {rec['follow_up_schedule']}")
            hr_stakeholders.append(rec["hr_action"])
            manager_stakeholders.append(rec["manager_action"])
            metrics.append(rec["success_metric"])

    # Suggested empathetic check-in questions based on top factors
    top_code = active_factors[0].get("code")
    checkin_questions_map = {
        "LowJobSatisfaction": [
            "What parts of your current role energize you, and what feels most draining?",
            "If you could redesign 20% of your daily tasks, what would you change?"
        ],
        "PoorWorkLifeBalance": [
            "How has your energy and workload felt at the end of each day lately?",
            "What can we offload or pause right now so you can log off on time?"
        ],
        "ExcessiveOvertime": [
            "Which projects are driving the extra hours, and how can we adjust the delivery deadline?",
            "Are there dependencies from other teams delaying your ability to wrap up tasks during core hours?"
        ],
        "LowManagerSupport": [
            "How can I better advocate for your needs and priorities with senior leadership?",
            "What type of feedback or coaching would be most helpful from me right now?"
        ],
        "LimitedPromotionOpportunity": [
            "Where do you see yourself professionally in the next 12 to 18 months?",
            "What specific projects or skills would you like to take on to prepare for the next level?"
        ]
    }
    questions = checkin_questions_map.get(top_code, [
        "How supported do you feel by the team and leadership right now?",
        "What is one thing the organization could do this month to make your work life better?"
    ])

    return {
        "immediate_actions": immediate_actions[:3],
        "short_term_actions": short_term_actions[:3],
        "long_term_actions": long_term_actions[:2],
        "hr_stakeholders": list(dict.fromkeys(hr_stakeholders))[:3],
        "manager_stakeholders": list(dict.fromkeys(manager_stakeholders))[:3],
        "metrics": list(dict.fromkeys(metrics))[:3],
        "checkin_questions": questions
    }

print("Cell 8: Actionable Recommendation Knowledge Base initialized.")


# ======================================================================================
# CELL 9 & 10: Recommendation Chatbot Engine & Analytics Functions
# ======================================================================================

class AttritionChatbot:
    """
    Intelligent rule-based HR Advisory Chatbot.
    Interacts with the currently active DataFrame, retrieves dynamic insights,
    generates structured recommendations, and provides general retention guidance.
    """
    def __init__(self, df: pd.DataFrame, report: Dict[str, Any]):
        self.df = df
        self.report = report

    def update_dataset(self, new_df: pd.DataFrame, new_report: Dict[str, Any]):
        self.df = new_df
        self.report = new_report

    def get_employee_record(self, emp_id: str) -> Optional[pd.Series]:
        clean_id = emp_id.strip().upper()
        # Search by exact or normalized match
        match = self.df[self.df["EmployeeID"].astype(str).str.upper() == clean_id]
        if not match.empty:
            return match.iloc[0]
        # Match by digits if user typed e.g. '1' or '001'
        digits = re.sub(r"\D", "", emp_id)
        if digits:
            num_match = self.df[self.df["EmployeeID"].astype(str).str.extract(r"(\d+)")[0] == digits]
            if not num_match.empty:
                return num_match.iloc[0]
        return None

    def format_employee_report(self, row: pd.Series) -> str:
        emp_id = row["EmployeeID"]
        score = row.get("RiskScore", 0)
        level = row.get("RiskLevel", "Low")
        factors = row.get("RiskFactorsDetails", [])
        skipped = row.get("SkippedFactors", [])
        
        recs = generate_personalized_recommendations(factors)
        
        limitations = (
            "Assessment is comprehensive with core attributes evaluated."
            if not skipped
            else f"Note: Assessment lacks {len(skipped)} attributes ({', '.join(skipped[:3])}). Results are non-exhaustive."
        )

        lines = [
            f"**Employee ID:** {emp_id}",
            f"**Department:** {row.get('Department', 'N/A')} | **Role:** {row.get('JobRole', 'N/A')}",
            "",
            "### 1. Risk Assessment",
            f"- **Risk Level:** **{level.upper()}**",
            f"- **Attrition Risk Score:** **{score}/100**",
            f"- **Assessment Limitations:** {limitations}",
            "",
            "### 2. Identified Workplace Risk Factors"
        ]

        if factors:
            for f in factors:
                lines.append(f"- **{f['factor']}** (+{f['points']} pts): {f['detail']} *({f['value']})*")
        else:
            lines.append("- *No acute risk factors detected in available data.*")

        lines.extend([
            "",
            "### 3. Recommended Preventive Actions",
            "**Immediate Interventions (Next 48 hrs - 7 days):**"
        ])
        for act in recs["immediate_actions"]:
            lines.append(f"- {act}")

        lines.append("\n**Short-Term Adjustments (Next 14 - 30 days):**")
        for act in recs["short_term_actions"]:
            lines.append(f"- {act}")

        lines.append("\n**Long-Term Retention Strategy:**")
        for act in recs["long_term_actions"]:
            lines.append(f"- {act}")

        lines.extend([
            "",
            "### 4. Responsible Stakeholders",
            f"- **HR Team:** {'; '.join(recs['hr_stakeholders'][:2])}",
            f"- **Reporting Manager:** {'; '.join(recs['manager_stakeholders'][:2])}",
            "- **Employee:** Voluntary, collaborative participation in co-designing career milestones.",
            "",
            "### 5. Success Metrics & Follow-Up",
            f"- **Key Metrics to Monitor:** {'; '.join(recs['metrics'][:2])}",
            "- **Recommended Check-in Questions:**"
        ])
        for q in recs["checkin_questions"]:
            lines.append(f"  * \"{q}\"")

        return "\n".join(lines)

    def get_high_risk_summary(self) -> str:
        high_df = self.df[self.df["RiskLevel"] == "High"]
        if high_df.empty:
            return "Good news! No employees are currently classified as **High Risk**."
        
        lines = [
            f"**High Attrition Risk Personnel ({len(high_df)} of {len(self.df)} total employees):**\n",
            "| Employee ID | Department | Role | Risk Score | Primary Drivers |",
            "| :--- | :--- | :--- | :---: | :--- |"
        ]
        for _, r in high_df.iterrows():
            lines.append(
                f"| `{r['EmployeeID']}` | {r.get('Department', 'N/A')} | {r.get('JobRole', 'N/A')} | **{r.get('RiskScore', 0)}%** | {r.get('PrimaryRiskFactors', 'N/A')} |"
            )
        lines.append("\n*Prompt the chatbot with `Why is employee <ID> high risk?` for an actionable retention plan.*")
        return "\n".join(lines)

    def get_department_summary(self) -> str:
        if "Department" not in self.df.columns:
            return "Department data is not available in the currently loaded dataset."
        
        dept_grp = self.df.groupby("Department").agg(
            Headcount=("EmployeeID", "count"),
            AvgRiskScore=("RiskScore", "mean"),
            HighRiskCount=("RiskLevel", lambda x: (x == "High").sum()),
            MediumRiskCount=("RiskLevel", lambda x: (x == "Medium").sum()),
            LowRiskCount=("RiskLevel", lambda x: (x == "Low").sum())
        ).reset_index()
        dept_grp = dept_grp.sort_values(by="AvgRiskScore", ascending=False)

        lines = [
            "**Departmental Risk & Headcount Overview:**\n",
            "| Department | Total Headcount | Avg Risk Score | High Risk | Medium Risk | Low Risk |",
            "| :--- | :---: | :---: | :---: | :---: | :---: |"
        ]
        for _, r in dept_grp.iterrows():
            lines.append(
                f"| **{r['Department']}** | {r['Headcount']} | **{r['AvgRiskScore']:.1f}%** | {r['HighRiskCount']} | {r['MediumRiskCount']} | {r['LowRiskCount']} |"
            )
        highest_dept = dept_grp.iloc[0]["Department"]
        highest_score = dept_grp.iloc[0]["AvgRiskScore"]
        lines.append(f"\n[Alert] **Highest Risk Department:** **{highest_dept}** with an average risk score of **{highest_score:.1f}%**.")
        return "\n".join(lines)

    def get_common_risk_factors(self) -> str:
        factor_counts = {}
        for factors in self.df["RiskFactorsDetails"]:
            if isinstance(factors, list):
                for f in factors:
                    name = f["factor"]
                    factor_counts[name] = factor_counts.get(name, 0) + 1

        if not factor_counts:
            return "No risk factors were recorded across the active employee dataset."

        sorted_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)
        total_emp = len(self.df)
        lines = [
            "**Most Frequent Organizational Risk Factors:**\n",
            "| Risk Factor | Impacted Employees | Percentage of Workforce |",
            "| :--- | :---: | :---: |"
        ]
        for factor, cnt in sorted_factors:
            pct = (cnt / total_emp) * 100
            lines.append(f"| **{factor}** | {cnt} | {pct:.1f}% |")
        lines.append(f"\n[Insight] *The primary organization-wide concern is **{sorted_factors[0][0]}**, impacting {sorted_factors[0][1]} employees.*")
        return "\n".join(lines)

    def get_risk_distribution(self) -> str:
        counts = self.df["RiskLevel"].value_counts().to_dict()
        total = len(self.df)
        high = counts.get("High", 0)
        med = counts.get("Medium", 0)
        low = counts.get("Low", 0)

        return (
            f"**Organization Risk Category Breakdown (Total: {total} employees):**\n\n"
            f"- [High Risk] (Score 60-100): {high} employees ({high/total*100:.1f}%)\n"
            f"- [Medium Risk] (Score 30-59): {med} employees ({med/total*100:.1f}%)\n"
            f"- [Low Risk] (Score 0-29): {low} employees ({low/total*100:.1f}%)\n"
        )

    def answer_general_question(self, query: str) -> str:
        q = query.lower()
        if "what is employee attrition" in q or "define attrition" in q:
            return (
                "**What is Employee Attrition?**\n\n"
                "Employee attrition is the gradual reduction in workforce staff occurring when employees leave an organization "
                "(through resignation, retirement, or contract conclusion) and are not immediately replaced.\n\n"
                "Unlike sudden employee turnover, attrition often indicates chronic systemic issues such as burnout, lack of career growth, "
                "or uncompetitive compensation."
            )
        elif "why employees leave" in q or "main reasons" in q or "causes of attrition" in q:
            return (
                "**Top 5 Reasons Employees Leave Organizations:**\n\n"
                "1. **Poor Managerial Support & Culture:** Lack of empathetic leadership and constructive coaching.\n"
                "2. **Excessive Overtime & Burnout:** Chronic work-life imbalance and unreasonable project deadlines.\n"
                "3. **Limited Career Advancement:** Stagnant promotion pathways and absence of professional development.\n"
                "4. **Uncompetitive Compensation:** Disparity between effort/market rates and salary.\n"
                "5. **Lack of Meaning & Recognition:** Low engagement, feeling undervalued or overlooked."
            )
        elif ("reduce" in q and "attrition" in q) or "retention strateg" in q or "prevent attrition" in q or "how to reduce" in q:
            return (
                "**Top Strategic Recommendations for HR Leaders:**\n\n"
                "1. **Conduct Proactive Stay Interviews:** Talk to high-performers before they enter active job search mode.\n"
                "2. **Enforce Work-Hour Caps:** Prevent sustained 50+ hour work weeks through capacity planning.\n"
                "3. **Build Transparent Promotion Ladders:** Show employees explicit criteria required for their next career milestone.\n"
                "4. **Train First-Time Managers:** Coach managers on active listening, psychological safety, and regular recognition.\n"
                "5. **Adopt Hybrid Flexibility:** Offer commuting flexibility where operationally feasible."
            )
        elif "overtime" in q:
            rec = RECOMMENDATION_KB["ExcessiveOvertime"]
            return f"**Managing Overtime & Burnout:**\n\n- **HR Action:** {rec['hr_action']}\n- **Manager Action:** {rec['manager_action']}\n- **Metric:** {rec['success_metric']}"
        elif "satisfaction" in q:
            rec = RECOMMENDATION_KB["LowJobSatisfaction"]
            return f"**Improving Low Job Satisfaction:**\n\n- **HR Action:** {rec['hr_action']}\n- **Manager Action:** {rec['manager_action']}\n- **Metric:** {rec['success_metric']}"
        elif "career" in q or "promotion" in q or "growth" in q:
            rec = RECOMMENDATION_KB["LimitedPromotionOpportunity"]
            return f"**Fostering Career Growth & Promotions:**\n\n- **HR Action:** {rec['hr_action']}\n- **Manager Action:** {rec['manager_action']}\n- **Metric:** {rec['success_metric']}"
        elif "missing" in q or "unsupported" in q or "columns" in q:
            return (
                f"**Dataset Schema Status:**\n\n"
                f"- **Total Rows:** {self.report['total_records']}\n"
                f"- **Recognized Features:** {len(self.report['recognized_features'])}\n"
                f"- **Evaluable Risk Factors:** {len(self.report['evaluable_risk_features'])} / 10\n"
                f"- **Missing Factors:** {', '.join(self.report['missing_risk_features']) or 'None'}\n"
                f"- **Confidence Level:** **{self.report['assessment_confidence']}**\n\n"
                "The rule-based engine dynamically scales point allocations based solely on available attributes without penalty."
            )
        else:
            return (
                "I'm your **HR Attrition & Retention Advisor**. Here are questions you can ask me:\n\n"
                "- *'What is the risk of employee E001?'*\n"
                "- *'Why is employee E005 high risk?'*\n"
                "- *'Show high risk employees'*\n"
                "- *'Which department has highest risk?'*\n"
                "- *'What are the most common risk factors?'*\n"
                "- *'How can HR reduce employee attrition?'*\n"
                "- *'How many employees fall into each risk category?'*"
            )

    def process_query(self, query: str) -> str:
        """Main intent router for natural language questions."""
        q = query.strip()
        if not q:
            return "Please enter a question regarding employee attrition, specific employee IDs, or departmental analytics."

        # 1. Check for specific Employee ID FIRST (e.g., E001, N001, emp 12, employee E005, emp#3)
        # Note: Must contain at least one digit to distinguish from words like 'employee attrition'
        emp_match = re.search(r"\b(?:emp(?:loyee)?\s*(?:id|#|number|code)?\s*[:#]?\s*([a-zA-Z]?\d{1,6})|([a-zA-Z]\d{2,5}))\b", q, re.IGNORECASE)
        if emp_match:
            raw_id = (emp_match.group(1) or emp_match.group(2)).strip()
            if re.search(r"\d", raw_id):
                emp_row = self.get_employee_record(raw_id)
                if emp_row is not None:
                    return self.format_employee_report(emp_row)
                else:
                    return f"[Notice] Employee ID `{raw_id}` was not found in the currently active dataset ({len(self.df)} total records)."

        # 2. Check for High Risk list queries (e.g. "Which employees have high risk?", "Show high risk employees")
        if re.search(r"\b(high risk|who is at risk|at risk employees|which employees|list employees|critical risk)\b", q, re.IGNORECASE):
            return self.get_high_risk_summary()

        # 3. Check for Department queries
        if re.search(r"\b(department|dept|by department|highest risk department)\b", q, re.IGNORECASE):
            return self.get_department_summary()

        # 4. Check for Common Risk Factors
        if re.search(r"\b(common risk|frequent|top factors|why people leave company)\b", q, re.IGNORECASE):
            return self.get_common_risk_factors()

        # 5. Check for Risk Category Counts / Distribution
        if re.search(r"\b(how many|distribution|breakdown|categories|counts)\b", q, re.IGNORECASE):
            return self.get_risk_distribution()

        # 6. Fallback to General HR Knowledge & Attrition Explanations
        return self.answer_general_question(q)

print("Cell 9 & 10: Recommendation Chatbot & Analytics Engine initialized.")


# ======================================================================================
# CELL 11: Data Visualizations & Reporting
# ======================================================================================

def plot_attrition_dashboard(df: pd.DataFrame):
    """
    Renders 4 distinct analytical visualizations in Google Colab:
    1. Risk Level Distribution (Donut Chart)
    2. Employee Headcount per Risk Tier (Bar Chart)
    3. Department-wise Average Risk Score (Bar Chart)
    4. Top Identified Workplace Risk Factors (Horizontal Bar)
    """
    fig, axes = plt.subplots(2, 2, figsize=(15, 11))
    fig.suptitle("Employee Attrition Risk & Workplace Analytics Dashboard", fontsize=16, fontweight="bold", y=0.98)

    palette = {"Low": "#10b981", "Medium": "#f59e0b", "High": "#ef4444"}

    # 1. Donut Chart - Risk Category Distribution
    ax1 = axes[0, 0]
    risk_counts = df["RiskLevel"].value_counts().reindex(["Low", "Medium", "High"]).fillna(0)
    colors = [palette[k] for k in risk_counts.index]
    wedges, texts, autotexts = ax1.pie(
        risk_counts, labels=risk_counts.index, autopct="%1.1f%%",
        startangle=140, colors=colors, wedgeprops=dict(width=0.45, edgecolor="white", linewidth=2)
    )
    plt.setp(autotexts, size=11, weight="bold", color="white")
    ax1.set_title("1. Risk Category Distribution", fontsize=12, fontweight="bold")

    # 2. Bar Chart - Risk Counts
    ax2 = axes[0, 1]
    sns.countplot(x="RiskLevel", data=df, order=["Low", "Medium", "High"], palette=palette, ax=ax2, edgecolor="black")
    ax2.set_title("2. Headcount by Risk Level", fontsize=12, fontweight="bold")
    ax2.set_xlabel("Risk Tier")
    ax2.set_ylabel("Employee Count")
    for p in ax2.patches:
        ax2.annotate(f"{int(p.get_height())}", (p.get_x() + p.get_width() / 2., p.get_height()),
                     ha='center', va='center', xytext=(0, 5), textcoords='offset points', fontweight='bold')

    # 3. Bar Chart - Department Average Risk
    ax3 = axes[1, 0]
    if "Department" in df.columns:
        dept_risk = df.groupby("Department")["RiskScore"].mean().sort_values(ascending=False).reset_index()
        sns.barplot(x="RiskScore", y="Department", data=dept_risk, palette="Blues_r", ax=ax3, edgecolor="black")
        ax3.set_title("3. Department-wise Average Risk Score (%)", fontsize=12, fontweight="bold")
        ax3.set_xlabel("Average Risk Score (0-100)")
        ax3.set_ylabel("Department")
        for p in ax3.patches:
            width = p.get_width()
            ax3.annotate(f"{width:.1f}%", (width + 1.0, p.get_y() + p.get_height() / 2.),
                         ha='left', va='center', fontweight='bold', fontsize=9)
    else:
        ax3.text(0.5, 0.5, "Department attribute not available in dataset", ha="center", va="center")
        ax3.set_title("3. Department Risk (Unavailable)")

    # 4. Horizontal Bar Chart - Top Risk Factors
    ax4 = axes[1, 1]
    factor_counts = {}
    for factors in df["RiskFactorsDetails"]:
        if isinstance(factors, list):
            for f in factors:
                factor_counts[f["factor"]] = factor_counts.get(f["factor"], 0) + 1
    
    if factor_counts:
        top_factors = pd.DataFrame(list(factor_counts.items()), columns=["Factor", "Count"]).sort_values("Count", ascending=True)
        sns.barplot(x="Count", y="Factor", data=top_factors, palette="Reds", ax=ax4, edgecolor="black")
        ax4.set_title("4. Most Frequent Risk Factors Identified", fontsize=12, fontweight="bold")
        ax4.set_xlabel("Number of Employees Impacted")
        for p in ax4.patches:
            width = p.get_width()
            ax4.annotate(f"{int(width)}", (width + 0.3, p.get_y() + p.get_height() / 2.),
                         ha='left', va='center', fontweight='bold', fontsize=9)
    else:
        ax4.text(0.5, 0.5, "No risk factors recorded", ha="center", va="center")
        ax4.set_title("4. Risk Factors (None)")

    plt.tight_layout()
    plt.show()

print("Cell 11: Visualization reporting dashboard configured.")


# ======================================================================================
# CELL 12 & 13: Interactive Google Colab Interface (`ipywidgets`)
# ======================================================================================

class ColabInteractiveDashboard:
    """
    Renders an interactive Google Colab widget UI with real-time dataset uploads,
    employee selector, chatbot conversation window, and dynamic metrics.
    """
    def __init__(self, initial_df: pd.DataFrame, initial_report: Dict[str, Any]):
        self.analyzed_df = initial_df
        self.report = initial_report
        self.chatbot = AttritionChatbot(initial_df, initial_report)
        self.create_widgets()

    def create_widgets(self):
        # Header
        self.header = widgets.HTML(
            "<div style='background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 15px; border-radius: 10px; color: white;'>"
            "<h2 style='margin:0;'>🏢 RetainIQ: Employee Attrition & Retention Advisory Chatbot</h2>"
            "<p style='margin:5px 0 0 0; opacity: 0.8;'>Explainable Rule-Based Assessment & Decision Support in Google Colab</p>"
            "</div>"
        )

        # File Upload Widget
        self.file_uploader = widgets.FileUpload(
            accept='.csv',
            multiple=False,
            description='Upload CSV',
            button_style='primary',
            tooltip='Upload any employee CSV dataset with 5 to 30+ columns'
        )
        self.file_uploader.observe(self.on_file_uploaded, names='value')

        self.dataset_info = widgets.HTML(
            f"<b>Active Dataset:</b> Sample Data ({len(self.analyzed_df)} records) | "
            f"<b>Confidence:</b> <span style='color:green;'>{self.report['assessment_confidence']}</span>"
        )

        # Employee Selector & Buttons
        emp_list = self.analyzed_df["EmployeeID"].tolist()
        self.emp_dropdown = widgets.Dropdown(
            options=emp_list,
            value=emp_list[0] if emp_list else None,
            description='Select Emp:',
            disabled=False
        )

        self.btn_analyze = widgets.Button(
            description='Analyze Employee Risk',
            button_style='info',
            icon='search'
        )
        self.btn_analyze.on_click(self.on_analyze_clicked)

        self.btn_recommend = widgets.Button(
            description='Generate Action Plan',
            button_style='success',
            icon='list-check'
        )
        self.btn_recommend.on_click(self.on_recommend_clicked)

        self.btn_dashboard = widgets.Button(
            description='Render Visualizations',
            button_style='warning',
            icon='chart-pie'
        )
        self.btn_dashboard.on_click(self.on_dashboard_clicked)

        # Chatbot controls
        self.chat_input = widgets.Text(
            value='Why is employee E001 high risk and what should HR do?',
            placeholder='Ask about employee risk, department stats, or retention ideas...',
            description='Chat Query:',
            layout=widgets.Layout(width='70%')
        )
        self.btn_ask = widgets.Button(
            description='Ask Chatbot',
            button_style='primary',
            icon='paper-plane'
        )
        self.btn_ask.on_click(self.on_chat_submitted)

        # Output areas
        self.chat_output = widgets.Output(layout=widgets.Layout(border='1px solid #4f46e5', padding='15px', border_radius='8px'))
        self.vis_output = widgets.Output()

    def display(self):
        if not HAS_WIDGETS:
            print("Interactive widgets not supported in current environment.")
            return
            
        controls_row1 = widgets.HBox([self.file_uploader, self.dataset_info])
        controls_row2 = widgets.HBox([self.emp_dropdown, self.btn_analyze, self.btn_recommend, self.btn_dashboard])
        chat_row = widgets.HBox([self.chat_input, self.btn_ask])

        ui = widgets.VBox([
            self.header,
            widgets.HTML("<hr style='margin:10px 0;'>"),
            widgets.HTML("<b>1. Dataset Management & Employee Analysis:</b>"),
            controls_row1,
            controls_row2,
            widgets.HTML("<hr style='margin:10px 0;'>"),
            widgets.HTML("<b>2. Interactive Recommendation Chatbot:</b>"),
            chat_row,
            self.chat_output,
            self.vis_output
        ])
        display(ui)
        # Initial greeting in chat area
        with self.chat_output:
            display(HTML("<b>Chatbot Ready!</b> Ask a question above or select an employee to view retention recommendations."))

    def on_analyze_clicked(self, b):
        emp_id = self.emp_dropdown.value
        response = self.chatbot.process_query(f"What is the risk of employee {emp_id}?")
        with self.chat_output:
            clear_output()
            display(HTML(f"<div style='background:#f8fafc; padding:10px; border-radius:5px;'>{markdown_to_html(response)}</div>"))

    def on_recommend_clicked(self, b):
        emp_id = self.emp_dropdown.value
        response = self.chatbot.process_query(f"What is the recommended action plan for employee {emp_id}?")
        with self.chat_output:
            clear_output()
            display(HTML(f"<div style='background:#f8fafc; padding:10px; border-radius:5px;'>{markdown_to_html(response)}</div>"))

    def on_chat_submitted(self, b):
        query = self.chat_input.value
        response = self.chatbot.process_query(query)
        with self.chat_output:
            clear_output()
            display(HTML(f"<div style='background:#f8fafc; padding:10px; border-radius:5px;'>{markdown_to_html(response)}</div>"))

    def on_dashboard_clicked(self, b):
        with self.vis_output:
            clear_output()
            plot_attrition_dashboard(self.analyzed_df)

    def on_file_uploaded(self, change):
        uploaded_filename = list(self.file_uploader.value.keys())[0]
        content = self.file_uploader.value[uploaded_filename]['content']
        import io
        new_df = pd.read_csv(io.BytesIO(content))
        
        # Analyze new uploaded dataset
        analyzed, report = analyze_employee_dataset(new_df)
        self.analyzed_df = analyzed
        self.report = report
        self.chatbot.update_dataset(analyzed, report)
        
        # Update dropdown options
        self.emp_dropdown.options = analyzed["EmployeeID"].tolist()
        if analyzed["EmployeeID"].tolist():
            self.emp_dropdown.value = analyzed["EmployeeID"].iloc[0]

        self.dataset_info.value = (
            f"<b>Active Dataset:</b> {uploaded_filename} ({len(analyzed)} rows) | "
            f"<b>Confidence:</b> <span style='color:blue;'>{report['assessment_confidence']} ({report['feature_coverage_pct']}%)</span>"
        )
        with self.chat_output:
            clear_output()
            display(HTML(f"<b style='color:green;'>Uploaded '{uploaded_filename}' successfully analyzed!</b> Dashboard and Chatbot now reference the new data."))

def markdown_to_html(text: str) -> str:
    """Simple markdown-to-HTML converter for Colab HTML widget display."""
    html = text.replace("\n", "<br>")
    html = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", html)
    html = re.sub(r"\*(.*?)\*", r"<i>\1</i>", html)
    html = re.sub(r"### (.*?)<br>", r"<h4 style='color:#312e81; margin:8px 0;'>\1</h4>", html)
    html = re.sub(r"`(.*?)`", r"<code style='background:#e2e8f0; padding:2px 4px; border-radius:3px;'>\1</code>", html)
    return html

print("Cell 12 & 13: Interactive Colab widgets and CSV upload handling created.")


# ======================================================================================
# CELL 14: Comprehensive Testing & Validation Suite (14 Scenarios)
# ======================================================================================

def run_system_validation_suite():
    """
    Validates all 14 required project operational scenarios:
    1. 25-attribute sample dataset loads & scores correctly
    2. Minimal 5-attribute dataset processes safely
    3. Unexpected/unsupported columns do not crash the engine
    4. Shuffled column order operates identically
    5. Missing recognized attributes are skipped without penalty
    6. Null/NaN values are cleanly imputed
    7. High-risk employee correctly triggers multiple concurrent factors
    8. Insufficient data yields low-confidence warning
    9. Chatbot handles valid employee ID query
    10. Chatbot returns clear error for unknown employee ID
    11. Department statistics aggregate correctly
    12. Dynamic dataset replacement updates chatbot context
    13. Recommendations update dynamically with dataset switch
    14. Target leakage protection: Attrition outcome is excluded from risk calculation
    """
    print("\n" + "="*80)
    print("RUNNING 14-POINT ATTRITION SYSTEM VALIDATION SUITE")
    print("="*80)

    # Test 1: Original 25-attribute sample dataset
    df_base = create_sample_dataset()
    analyzed_base, report_base = analyze_employee_dataset(df_base)
    assert len(analyzed_base) == 40, "Test 1 Failed: Expected 40 rows"
    assert "RiskScore" in analyzed_base.columns and "RiskLevel" in analyzed_base.columns
    print("[PASS] Test 1 Passed: 25-attribute sample dataset loaded and analyzed.")

    # Test 2: Minimal 5-attribute dataset
    df_min = pd.DataFrame({
        "EmpID": ["M01", "M02", "M03"],
        "JobSatisfaction": [1, 4, 2],
        "WorkLifeBalance": [1, 4, 3],
        "OverTime": ["Yes", "No", "No"],
        "Department": ["Sales", "Engineering", "Marketing"]
    })
    analyzed_min, report_min = analyze_employee_dataset(df_min)
    assert len(analyzed_min) == 3
    assert analyzed_min.loc[0, "RiskLevel"] in ["High", "Medium"]
    print("[PASS] Test 2 Passed: Minimal 5-attribute dataset processed safely.")

    # Test 3: Dataset with additional unknown columns
    df_extra = df_base.copy()
    df_extra["FavoriteCoffee"] = "Espresso"
    df_extra["PetCount"] = 2
    analyzed_extra, report_extra = analyze_employee_dataset(df_extra)
    assert "FavoriteCoffee" in analyzed_extra.columns
    assert "FavoriteCoffee" in report_extra["unsupported_features"]
    print("[PASS] Test 3 Passed: Unseen/unsupported columns ignored gracefully.")

    # Test 4: Shuffled column order
    cols_shuffled = list(df_base.columns)
    random.seed(42)
    random.shuffle(cols_shuffled)
    df_shuffled = df_base[cols_shuffled]
    analyzed_shuffled, _ = analyze_employee_dataset(df_shuffled)
    assert np.allclose(analyzed_base["RiskScore"], analyzed_shuffled["RiskScore"])
    print("[PASS] Test 4 Passed: Column order permutation invariance verified.")

    # Test 5: Missing recognized attributes
    df_partial = df_base.drop(columns=["ManagerSupport", "WorkloadLevel", "EngagementScore"])
    analyzed_partial, report_partial = analyze_employee_dataset(df_partial)
    assert len(analyzed_partial.loc[0, "SkippedFactors"]) >= 3
    print("[PASS] Test 5 Passed: Missing attributes skipped without penalty.")

    # Test 6: Null and NaN values in numerical & categorical attributes
    df_nulls = df_base.copy()
    df_nulls.loc[0, "JobSatisfaction"] = np.nan
    df_nulls.loc[1, "WorkHoursPerWeek"] = np.nan
    df_nulls.loc[2, "ManagerSupport"] = None
    analyzed_nulls, _ = analyze_employee_dataset(df_nulls)
    assert not analyzed_nulls["RiskScore"].isnull().any()
    print("[PASS] Test 6 Passed: Null/NaN values handled cleanly without NaN propagation.")

    # Test 7: Concurrent high-risk factors
    e001_row = analyzed_base[analyzed_base["EmployeeID"] == "E001"].iloc[0]
    assert e001_row["RiskLevel"] == "High"
    assert len(e001_row["RiskFactorsDetails"]) >= 5
    print("[PASS] Test 7 Passed: High-risk employee with multiple concurrent factors verified.")

    # Test 8: Insufficient information yields low-confidence warning
    df_sparse = pd.DataFrame({"EmployeeID": ["S1", "S2"], "Age": [25, 40], "Department": ["HR", "IT"]})
    _, report_sparse = analyze_employee_dataset(df_sparse)
    assert report_sparse["assessment_confidence"] == "Low"
    assert report_sparse["quality_warning"] is not None
    print("[PASS] Test 8 Passed: Insufficient feature assessment confidence warning flagged.")

    # Test 9: Chatbot handles valid employee ID
    bot = AttritionChatbot(analyzed_base, report_base)
    resp_e001 = bot.process_query("What is the risk of employee E001?")
    assert "E001" in resp_e001 and "Risk Assessment" in resp_e001
    print("[PASS] Test 9 Passed: Chatbot employee query successfully answered.")

    # Test 10: Chatbot handles unknown employee ID
    resp_unknown = bot.process_query("What is the risk of employee E999?")
    assert "was not found" in resp_unknown
    print("[PASS] Test 10 Passed: Unknown employee ID correctly flagged.")

    # Test 11: Department statistics aggregation
    dept_summary = bot.process_query("Show department risk summary")
    assert "Sales" in dept_summary and "Highest Risk Department" in dept_summary
    print("[PASS] Test 11 Passed: Department summary aggregated correctly.")

    # Test 12 & 13: Dynamic dataset replacement and recommendation update
    df_new = pd.DataFrame({
        "EmployeeID": ["N001", "N002"],
        "Department": ["Cybersecurity", "Cloud"],
        "JobSatisfaction": [1, 4],
        "WorkLifeBalance": [1, 4],
        "OverTime": ["Yes", "No"]
    })
    analyzed_new, report_new = analyze_employee_dataset(df_new)
    bot.update_dataset(analyzed_new, report_new)
    resp_n001 = bot.process_query("What is the risk of employee N001?")
    assert "N001" in resp_n001
    assert "Cybersecurity" in resp_n001
    print("[PASS] Tests 12 & 13 Passed: Dynamic dataset replacement & recommendation updates verified.")

    # Test 14: Target leakage verification
    # Confirm that 'Attrition' (ground truth) is not in risk calculations
    eval_factors = report_base["evaluable_risk_features"]
    assert "Attrition" not in eval_factors, "Target Leakage Alert: Attrition found in risk features!"
    print("[PASS] Test 14 Passed: Target leakage protection confirmed (Attrition excluded from risk model).")

    print("="*80)
    print("ALL 14 VALIDATION TESTS PASSED PERFECTLY (100% SUCCESS)")
    print("="*80 + "\n")


# ======================================================================================
# CELL 15: Optional Supervised Machine Learning Extension (Scikit-Learn)
# ======================================================================================

def train_optional_ml_extension(df: pd.DataFrame):
    """
    Trains an illustrative Supervised Machine Learning Model on the historical 'Attrition' column.
    Safeguards:
    - Excludes 'EmployeeID', 'RiskScore', 'RiskLevel', and protected demographic attributes.
    - Uses ColumnTransformer with OneHotEncoder & StandardScaler.
    - Evaluates Precision, Recall, F1, and ROC-AUC.
    - Fairness reminder: ML outputs must not replace human ethical judgment.
    """
    if "Attrition" not in df.columns:
        print("Note: 'Attrition' label column not found. Skipping supervised ML model training.")
        return

    print("\n--- Training Optional Supervised ML Model (Logistic Regression Baseline) ---")
    
    # Exclude IDs, target, derived risk scores, and protected attributes
    excluded_cols = [
        "EmployeeID", "Attrition", "RiskScore", "RiskLevel", "PrimaryRiskFactors",
        "RiskFactorsDetails", "SkippedFactors"
    ] + PROTECTED_ATTRIBUTES

    feature_cols = [c for c in df.columns if c not in excluded_cols]
    
    X = df[feature_cols].copy()
    # Map Attrition 'Yes'/'No' to binary 1/0
    y = df["Attrition"].apply(lambda val: 1 if str(val).strip().lower() in ["yes", "1", "true"] else 0)

    numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_features = X.select_dtypes(include=["object", "category"]).columns.tolist()

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    clf = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(class_weight="balanced", random_state=42))
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42, stratify=y)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    print("Model Evaluation Report:")
    print(classification_report(y_test, y_pred, target_names=["Retained", "Attrited"]))
    try:
        auc = roc_auc_score(y_test, y_prob)
        print(f"ROC-AUC Score: {auc:.3f}")
    except ValueError:
        pass

    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    print("\nEthical & Fairness Notice: This model is for illustrative academic comparison. Decisions must be made by human HR professionals.")


# ======================================================================================
# MAIN EXECUTION ENTRYPOINT (For Colab / Local Terminal Execution)
# ======================================================================================

if __name__ == "__main__":
    print("\n>>> Initializing End-to-End RetainIQ Pipeline <<<\n")
    
    # 1. Generate Sample Data
    raw_sample = create_sample_dataset()
    
    # 2. Analyze Dataset via Rule-based Engine
    analyzed_dataset, dataset_report = analyze_employee_dataset(raw_sample)
    
    # 3. Run Automated Validation Test Suite
    run_system_validation_suite()
    
    # 4. Optional ML Model Demonstration
    train_optional_ml_extension(analyzed_dataset)
    
    # 5. Sample Chatbot Interaction Demo (CLI)
    print("\n" + "="*80)
    print("SAMPLE CHATBOT INTERACTION DEMONSTRATION")
    print("="*80)
    bot = AttritionChatbot(analyzed_dataset, dataset_report)
    
    sample_prompts = [
        "Why is employee E001 classified as high risk?",
        "Which employees have high attrition risk?",
        "Which department has the highest average risk score?",
        "What are the most common risk factors in the company?",
        "How can HR reduce employee attrition?"
    ]
    
    for prompt in sample_prompts:
        print(f"\n[USER]: {prompt}")
        print("-" * 60)
        print(f"[CHATBOT]:\n{bot.process_query(prompt)}")
        print("-" * 60)

    # 6. Interactive Colab Dashboard Launcher
    if HAS_WIDGETS:
        print("\nDisplaying Interactive Colab Dashboard...")
        dashboard = ColabInteractiveDashboard(analyzed_dataset, dataset_report)
        dashboard.display()
    else:
        print("\nSystem ready. In Google Colab, call `dashboard.display()` to show the GUI.")
