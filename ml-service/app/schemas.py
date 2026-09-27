"""
Pydantic Schemas for FastAPI ML Prediction Microservice.
Defines input employee attributes, prediction output format, and risk tier categorization.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field

RiskTier = Literal["Low", "Medium", "High"]

class RiskFactor(BaseModel):
    feature: str = Field(..., description="Feature name that impacted the prediction")
    importance: float = Field(..., description="SHAP feature contribution score")
    impact: str = Field(..., description="Whether this factor increases or decreases attrition risk")

class EmployeeFeatures(BaseModel):
    employee_id: Optional[int] = Field(None, description="Optional Employee ID for reference")
    
    # Demographics & Core
    Age: int = Field(35, ge=18, le=75, description="Employee age in years")
    Gender: Literal["Male", "Female"] = Field("Male")
    MaritalStatus: Literal["Single", "Married", "Divorced"] = Field("Married")
    DistanceFromHome: int = Field(5, ge=0, le=100, description="Distance from home to work in km/miles")
    
    # Job Role & Department
    Department: Literal["Sales", "Research & Development", "Human Resources"] = Field("Research & Development")
    JobRole: Literal[
        "Sales Executive",
        "Research Scientist",
        "Laboratory Technician",
        "Manufacturing Director",
        "Healthcare Representative",
        "Manager",
        "Sales Representative",
        "Research Director",
        "Human Resources",
    ] = Field("Research Scientist")
    JobLevel: int = Field(2, ge=1, le=5)
    BusinessTravel: Literal["Non-Travel", "Travel_Rarely", "Travel_Frequently"] = Field("Travel_Rarely")
    
    # Work Experience & History
    TotalWorkingYears: int = Field(8, ge=0, le=50)
    YearsAtCompany: int = Field(4, ge=0, le=45)
    YearsInCurrentRole: int = Field(2, ge=0, le=45)
    YearsSinceLastPromotion: int = Field(1, ge=0, le=45)
    YearsWithCurrManager: int = Field(2, ge=0, le=45)
    NumCompaniesWorked: int = Field(2, ge=0, le=20)
    
    # Compensation & Financials
    MonthlyIncome: int = Field(5000, ge=1000, le=50000, description="Monthly salary in USD")
    DailyRate: int = Field(800, ge=100, le=2000)
    HourlyRate: int = Field(65, ge=20, le=150)
    MonthlyRate: int = Field(14000, ge=1000, le=35000)
    PercentSalaryHike: int = Field(14, ge=0, le=50)
    StockOptionLevel: int = Field(1, ge=0, le=3)
    
    # Sentiment & Work-Life Balance (1-4 scale)
    EnvironmentSatisfaction: int = Field(3, ge=1, le=4)
    JobSatisfaction: int = Field(3, ge=1, le=4)
    JobInvolvement: int = Field(3, ge=1, le=4)
    RelationshipSatisfaction: int = Field(3, ge=1, le=4)
    WorkLifeBalance: int = Field(3, ge=1, le=4)
    
    # Education & Performance
    Education: int = Field(3, ge=1, le=5)
    EducationField: Literal[
        "Life Sciences",
        "Medical",
        "Marketing",
        "Technical Degree",
        "Human Resources",
        "Other",
    ] = Field("Life Sciences")
    PerformanceRating: int = Field(3, ge=1, le=4)
    TrainingTimesLastYear: int = Field(2, ge=0, le=10)
    OverTime: Literal["Yes", "No"] = Field("No")

class PredictionResponse(BaseModel):
    employee_id: Optional[int] = None
    attrition_probability: float = Field(..., ge=0.0, le=1.0, description="Attrition probability [0.0 - 1.0]")
    risk_tier: RiskTier = Field(..., description="Low (<0.4), Medium (0.4-0.7), High (>0.7)")
    recommended_action: str = Field(..., description="Actionable retention recommendation for HR")
    top_risk_factors: List[RiskFactor] = Field(default_factory=list, description="Top SHAP explainability drivers")
    model_version: str = Field(..., description="Version of the model that generated prediction")

class BatchPredictionRequest(BaseModel):
    employees: List[EmployeeFeatures]

class BatchPredictionResponse(BaseModel):
    total_processed: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    predictions: List[PredictionResponse]
