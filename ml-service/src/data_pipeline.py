"""
Data Pipeline Module for Employee Attrition System.
Handles data loading, cleaning, feature engineering, and preprocessing transformations.
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "WA_Fn-UseC_-HR-Employee-Attrition.csv")
PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "processed")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

DROP_COLUMNS = ["EmployeeCount", "Over18", "StandardHours", "EmployeeNumber"]

CATEGORICAL_FEATURES = [
    "BusinessTravel",
    "Department",
    "EducationField",
    "Gender",
    "JobRole",
    "MaritalStatus",
    "OverTime",
]

NUMERICAL_FEATURES = [
    "Age",
    "DailyRate",
    "DistanceFromHome",
    "Education",
    "EnvironmentSatisfaction",
    "HourlyRate",
    "JobInvolvement",
    "JobLevel",
    "JobSatisfaction",
    "MonthlyIncome",
    "MonthlyRate",
    "NumCompaniesWorked",
    "PercentSalaryHike",
    "PerformanceRating",
    "RelationshipSatisfaction",
    "StockOptionLevel",
    "TotalWorkingYears",
    "TrainingTimesLastYear",
    "WorkLifeBalance",
    "YearsAtCompany",
    "YearsInCurrentRole",
    "YearsSinceLastPromotion",
    "YearsWithCurrManager",
    # Engineered features
    "TotalSatisfaction",
    "TenurePerRole",
    "IncomePerAge",
    "PromotionLag",
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific HR engineered features."""
    df = df.copy()
    
    # Combined satisfaction score
    df["TotalSatisfaction"] = (
        df.get("EnvironmentSatisfaction", 0)
        + df.get("JobSatisfaction", 0)
        + df.get("RelationshipSatisfaction", 0)
    )
    
    # Role tenure ratio
    df["TenurePerRole"] = df["YearsAtCompany"] / (df["YearsInCurrentRole"] + 1)
    
    # Earning velocity relative to age
    df["IncomePerAge"] = df["MonthlyIncome"] / (df["Age"] + 1)
    
    # Time spent at company relative to last promotion
    df["PromotionLag"] = df["YearsAtCompany"] - df["YearsSinceLastPromotion"]
    
    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Drop constant/uninformative columns."""
    cols_to_drop = [c for c in DROP_COLUMNS if c in df.columns]
    return df.drop(columns=cols_to_drop)

def build_preprocessor() -> ColumnTransformer:
    """Build scikit-learn ColumnTransformer for scaling & one-hot encoding."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="drop",
    )

def prepare_and_split_data(raw_data_path: str = RAW_DATA_PATH):
    """Load raw data, perform feature engineering, split and fit preprocessor."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    os.makedirs(MODEL_DIR, exist_ok=True)

    print(f"Reading raw data from {raw_data_path}...")
    df = pd.read_csv(raw_data_path)
    
    # Clean and engineer
    df = clean_data(df)
    df = engineer_features(df)
    
    # Encode target
    if "Attrition" not in df.columns:
        raise ValueError("Target column 'Attrition' not found in dataset")
        
    y = df["Attrition"].apply(lambda x: 1 if str(x).strip().lower() in ["yes", "1", "true"] else 0)
    X = df.drop(columns=["Attrition"])
    
    # Stratified Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Fit preprocessor on training data only
    preprocessor = build_preprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)
    
    # Extract transformed feature names
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    feature_names = NUMERICAL_FEATURES + cat_feature_names
    
    # Save transformed arrays & datasets
    train_df = pd.DataFrame(X_train_trans, columns=feature_names)
    train_df["Attrition"] = y_train.values
    test_df = pd.DataFrame(X_test_trans, columns=feature_names)
    test_df["Attrition"] = y_test.values
    
    train_df.to_csv(os.path.join(PROCESSED_DIR, "train.csv"), index=False)
    test_df.to_csv(os.path.join(PROCESSED_DIR, "test.csv"), index=False)
    
    # Save preprocessor artifact
    preprocessor_path = os.path.join(MODEL_DIR, "preprocessor.joblib")
    joblib.dump(preprocessor, preprocessor_path)
    
    # Save feature names list
    joblib.dump(feature_names, os.path.join(MODEL_DIR, "feature_names.joblib"))
    
    print(f"Data pipeline complete:")
    print(f"  Training samples: {X_train.shape[0]} ({y_train.sum()} positive)")
    print(f"  Testing samples: {X_test.shape[0]} ({y_test.sum()} positive)")
    print(f"  Total features after transformation: {len(feature_names)}")
    print(f"  Preprocessor saved to: {preprocessor_path}")
    
    return X_train, X_test, y_train, y_test, preprocessor, feature_names

if __name__ == "__main__":
    prepare_and_split_data()
