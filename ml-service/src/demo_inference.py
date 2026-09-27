"""
Demonstration script to verify Phase 1 Inference Pipeline and SHAP Explainability.
"""
import sys
import os
import json

# Ensure path resolution
BASE_DIR = os.path.join(os.path.dirname(__file__), "..")
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from app.predictor import get_predictor
from app.schemas import EmployeeFeatures

def run_demo():
    print("=" * 60)
    print("PHASE 1 INFERENCE & SHAP EXPLAINABILITY DEMO")
    print("=" * 60)
    
    predictor = get_predictor()

    # Employee 1: At-Risk Profile
    high_risk_emp = EmployeeFeatures(
        employee_id=101,
        Age=28,
        Department="Sales",
        JobRole="Sales Representative",
        JobLevel=1,
        MonthlyIncome=2100,
        OverTime="Yes",
        YearsAtCompany=3,
        YearsSinceLastPromotion=3,
        EnvironmentSatisfaction=1,
        JobSatisfaction=1,
        WorkLifeBalance=1,
        TotalWorkingYears=3,
        DistanceFromHome=25,
    )

    # Employee 2: Retained / Low Risk Profile
    low_risk_emp = EmployeeFeatures(
        employee_id=102,
        Age=45,
        Department="Research & Development",
        JobRole="Research Director",
        JobLevel=4,
        MonthlyIncome=15000,
        OverTime="No",
        YearsAtCompany=12,
        YearsSinceLastPromotion=1,
        EnvironmentSatisfaction=4,
        JobSatisfaction=4,
        WorkLifeBalance=3,
        TotalWorkingYears=20,
        StockOptionLevel=2,
    )

    for idx, (label, emp) in enumerate([("HIGH-RISK EMPLOYEE", high_risk_emp), ("LOW-RISK EMPLOYEE", low_risk_emp)], start=1):
        print(f"\n--- Scenario {idx}: {label} (ID: {emp.employee_id}) ---")
        pred = predictor.predict_single(emp)
        
        print(f"  • Attrition Probability : {pred.attrition_probability * 100:.1f}%")
        print(f"  • PRD Risk Tier         : {pred.risk_tier} (Low <40%, Med 40-70%, High >70%)")
        print(f"  • Model Version Used    : {pred.model_version}")
        print(f"  • Recommended Action    : {pred.recommended_action}")
        print("  • Top SHAP Risk Drivers :")
        for f in pred.top_risk_factors:
            print(f"      - {f.feature:<25} | Impact: {f.impact:<15} | Score: {f.importance:+.4f}")

    print("\n" + "=" * 60)
    print("DEMO RUN COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_demo()
