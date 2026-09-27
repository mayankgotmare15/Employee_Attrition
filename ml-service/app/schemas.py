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
    Age: int = Field(35, description="Employee age in years")
    Gender: str = Field("Male", description="Employee gender")
    MaritalStatus: str = Field("Married", description="Marital status")
    DistanceFromHome: int = Field(5, description="Distance from home to work in km/miles")
    
    # Job Role & Department
    Department: str = Field("Research & Development", description="Department")
    JobRole: str = Field("Research Scientist", description="Job Role")
    JobLevel: int = Field(2, description="Job Level (1-5)")
    BusinessTravel: str = Field("Travel_Rarely", description="Travel frequency")
    
    # Work Experience & History
    TotalWorkingYears: int = Field(8, description="Total career experience")
    YearsAtCompany: int = Field(4, description="Years at current company")
    YearsInCurrentRole: int = Field(2, description="Years in current role")
    YearsSinceLastPromotion: int = Field(1, description="Years since last promotion")
    YearsWithCurrManager: int = Field(2, description="Years with current manager")
    NumCompaniesWorked: int = Field(2, description="Number of prior companies")
    
    # Compensation & Financials
    MonthlyIncome: int = Field(5000, description="Monthly salary in USD")
    DailyRate: int = Field(800, description="Daily rate")
    HourlyRate: int = Field(65, description="Hourly rate")
    MonthlyRate: int = Field(14000, description="Monthly rate")
    PercentSalaryHike: int = Field(14, description="Percent salary hike")
    StockOptionLevel: int = Field(1, description="Stock option level")
    
    # Sentiment & Work-Life Balance (1-4 scale)
    EnvironmentSatisfaction: int = Field(3, description="Environment satisfaction (1-4)")
    JobSatisfaction: int = Field(3, description="Job satisfaction (1-4)")
    JobInvolvement: int = Field(3, description="Job involvement (1-4)")
    RelationshipSatisfaction: int = Field(3, description="Relationship satisfaction (1-4)")
    WorkLifeBalance: int = Field(3, description="Work-life balance (1-4)")
    
    # Education & Performance
    Education: int = Field(3, description="Education level (1-5)")
    EducationField: str = Field("Life Sciences", description="Education field")
    PerformanceRating: int = Field(3, description="Performance rating (1-4)")
    TrainingTimesLastYear: int = Field(2, description="Training sessions attended")
    OverTime: str = Field("No", description="OverTime status ('Yes' or 'No')")

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
