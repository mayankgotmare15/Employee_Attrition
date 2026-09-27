"""
Script to fetch the standard IBM HR Analytics Employee Attrition dataset.
Source: Official public mirror from GitHub raw repository.
"""
import os
import urllib.request
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
DATA_FILE = os.path.join(DATA_DIR, "WA_Fn-UseC_-HR-Employee-Attrition.csv")

# Public mirror of the standard IBM HR dataset
DATA_URL = "https://raw.githubusercontent.com/IBM/employee-attrition-aif360/master/data/emp_attrition.csv"
FALLBACK_URL = "https://raw.githubusercontent.com/treselle-systems/customer_churn_analysis/master/WA_Fn-UseC_-HR-Employee-Attrition.csv"

def download_data():
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(DATA_FILE) and os.path.getsize(DATA_FILE) > 10000:
        print(f"Dataset already exists at: {DATA_FILE}")
        df = pd.read_csv(DATA_FILE)
        print(f"Shape: {df.shape}")
        return DATA_FILE

    print(f"Downloading IBM HR Attrition dataset...")
    for url in [FALLBACK_URL, DATA_URL]:
        try:
            print(f"Trying URL: {url}")
            urllib.request.urlretrieve(url, DATA_FILE)
            df = pd.read_csv(DATA_FILE)
            if df.shape[0] >= 1000 and "Attrition" in df.columns:
                print(f"Successfully downloaded! Dataset shape: {df.shape}")
                print(f"Target distribution:\n{df['Attrition'].value_counts(normalize=True)}")
                return DATA_FILE
        except Exception as e:
            print(f"Failed to download from {url}: {e}")

    raise RuntimeError("Could not download the IBM HR dataset from mirrors.")

if __name__ == "__main__":
    download_data()
