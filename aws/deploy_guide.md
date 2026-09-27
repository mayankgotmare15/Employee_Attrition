# RetainIQ MLOps: AWS Cloud Deployment Blueprint & Production Runbook

This guide details the complete cloud architecture, infrastructure provisioning, and step-by-step rollout procedures for the **Employee Attrition Prediction & HR Analytics System with MLOps** as specified in **PRD Section 8 (Deployment)** and **Section 9 (Maintenance & MLOps)**.

---

## 1. Cloud Architecture Topology (PRD Section 8.2)

```mermaid
flowchart TD
    subgraph Clients["Clients"]
        Browser["React 18 Web Dashboard (HTTPS)"]
        Mobile["React Native / Expo Mobile App"]
    end

    subgraph AWS_Cloud["AWS Cloud Infrastructure (us-east-1)"]
        R53["Amazon Route 53 / ACM SSL"]
        ALB["Application Load Balancer (ALB / Nginx Edge)"]

        subgraph ECS_Cluster["Amazon ECS Fargate Cluster (VPC Private Subnets)"]
            FrontendSvc["retainiq-frontend (Nginx Static SPA)"]
            BackendSvc["retainiq-backend (Node.js Express Gateway :5000)"]
            MLSvc["retainiq-ml-service (FastAPI + MLOps Retrain Engine :8000)"]
        end

        subgraph Persistence["Managed Persistence & Storage"]
            RDS["Amazon RDS PostgreSQL 15 (Multi-AZ)"]
            S3["Amazon S3 Bucket (Model Artifacts & Dataset Archive)"]
        end

        subgraph Monitoring["Observability & Automated MLOps"]
            CW["Amazon CloudWatch (Metrics & Logs)"]
            SNS["Amazon SNS (Drift & High-Risk Alerts)"]
            SageMaker["Amazon SageMaker Model Registry (Optional Hybrid)"]
        end
    end

    Browser --> R53
    Mobile --> R53
    R53 --> ALB
    ALB -->|/| FrontendSvc
    ALB -->|/api/*| BackendSvc
    ALB -->|/ml/*| MLSvc

    BackendSvc --> RDS
    BackendSvc --> MLSvc
    MLSvc --> S3
    MLSvc --> CW
    CW -->|Z-Score > 2.0| SNS
    SNS -->|Trigger Retrain| MLSvc
```

---

## 2. Infrastructure Prerequisites

1. **AWS Account & IAM Permissions:**
   * `AmazonECS_FullAccess`
   * `AmazonRDSFullAccess`
   * `AmazonS3FullAccess`
   * `CloudWatchFullAccess`
   * `AmazonEC2ContainerRegistryFullAccess`
2. **Local Tools:**
   * AWS CLI (`aws configure`)
   * Docker Desktop with Buildx
   * Node.js 20+ & Python 3.10+

---

## 3. Step-by-Step Provisioning Runbook

### Step 3.1: Create Amazon S3 Bucket for ML Model Artifacts
```bash
aws s3api create-bucket \
    --bucket retainiq-mlops-artifacts-prod \
    --region us-east-1
```
* Enable default AES-256 server-side encryption:
```bash
aws s3api put-bucket-encryption \
    --bucket retainiq-mlops-artifacts-prod \
    --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
```

---

### Step 3.2: Provision Amazon RDS PostgreSQL 15 Instance
Create an encrypted PostgreSQL database instance inside your VPC private subnets:
```bash
aws rds create-db-instance \
    --db-instance-identifier retainiq-postgres-prod \
    --db-instance-class db.t4g.micro \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password "YourSecureMasterPassword2026!" \
    --allocated-storage 20 \
    --max-allocated-storage 100 \
    --storage-type gp3 \
    --storage-encrypted \
    --backup-retention-period 7 \
    --vpc-security-group-ids "sg-0123456789abcdef0" \
    --db-name attrition_db \
    --no-publicly-accessible
```

Connection string format for backend:
```env
DATABASE_URL="postgresql://postgres:YourSecureMasterPassword2026!@retainiq-postgres-prod.xxxxxxxx.us-east-1.rds.amazonaws.com:5432/attrition_db?schema=public&sslmode=require"
```

---

### Step 3.3: Amazon ECR Repositories & Image Build
Create 3 Amazon ECR repositories:
```bash
aws ecr create-repository --repository-name retainiq-ml-service --region us-east-1
aws ecr create-repository --repository-name retainiq-backend --region us-east-1
aws ecr create-repository --repository-name retainiq-frontend --region us-east-1
```

Authenticate Docker to Amazon ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

Build, tag, and push container images:
```bash
# 1. ML Microservice
docker build -t retainiq-ml-service ./ml-service
docker tag retainiq-ml-service:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-ml-service:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-ml-service:latest

# 2. Node.js Backend Gateway
docker build -t retainiq-backend ./backend
docker tag retainiq-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-backend:latest

# 3. React Frontend Dashboard
docker build -t retainiq-frontend ./frontend
docker tag retainiq-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/retainiq-frontend:latest
```

---

### Step 3.4: Deploy to Amazon ECS Fargate
1. Register the task definition from [`aws/ecs-task-definition.json`](file:///c:/Projects/Employee_Attrition/aws/ecs-task-definition.json):
```bash
aws ecs register-task-definition --cli-input-json file://aws/ecs-task-definition.json
```
2. Create an ECS Fargate cluster:
```bash
aws ecs create-cluster --cluster-name retainiq-cluster
```
3. Create the ECS Fargate service behind the Application Load Balancer:
```bash
aws ecs create-service \
    --cluster retainiq-cluster \
    --service-name retainiq-service \
    --task-definition retainiq-task-def \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-abc,subnet-xyz],securityGroups=[sg-app],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=nginx,containerPort=80
```

---

## 4. Amazon CloudWatch Monitoring & MLOps Drift Alarms (PRD Section 8.3 & 9)

Import the metric filters and alarms configured in [`aws/cloudwatch_monitoring.json`](file:///c:/Projects/Employee_Attrition/aws/cloudwatch_monitoring.json):

1. **ML Prediction Drift Alarm ($Z > 2.0$):**
   * Metric: `RetainIQ/MLOps -> PredictionDriftZScore`
   * Threshold: $> 2.0$ for 1 consecutive evaluation period of 5 minutes.
   * Action: Triggers Amazon SNS topic `arn:aws:sns:us-east-1:...:retainiq-drift-alerts` and fires automated retraining pipeline hook.
2. **API Latency Alarm:**
   * Metric: `TargetResponseTime` on ALB.
   * Threshold: $> 500\text{ms}$ average over 5 minutes.
3. **5xx Error Rate Alarm:**
   * Metric: `HTTPCode_Target_5XX_Count`.
   * Threshold: $> 5$ errors in 5 minutes.

---

## 5. Amazon SageMaker Alternative Endpoint (PRD Section 8.1)

If migrating from self-hosted FastAPI to Amazon SageMaker Managed Real-Time Endpoint:

1. Package the serialized champion model (`champion_model.joblib`) and preprocessor (`preprocessor.joblib`) into `model.tar.gz`.
2. Upload to S3:
```bash
aws s3 cp model.tar.gz s3://retainiq-mlops-artifacts-prod/models/model.tar.gz
```
3. Use the AWS Boto3 SDK in the Node.js backend (`@aws-sdk/client-sagemaker-runtime`) to invoke the SageMaker endpoint:
```javascript
const { SageMakerRuntimeClient, InvokeEndpointCommand } = require('@aws-sdk/client-sagemaker-runtime');
const client = new SageMakerRuntimeClient({ region: 'us-east-1' });

async function invokeSageMaker(features) {
  const command = new InvokeEndpointCommand({
    EndpointName: 'retainiq-attrition-champion',
    ContentType: 'application/json',
    Body: JSON.stringify(features),
  });
  const response = await client.send(command);
  return JSON.parse(new TextDecoder('utf-8').decode(response.Body));
}
```

---

## 6. Staging-to-Production Promotion Checklist

- [ ] All 4 full-stack test suites pass with zero regressions (`node test_all.js`).
- [ ] Database schema synced in RDS (`npx prisma migrate deploy`).
- [ ] Seed accounts verified (`admin@company.com`, `hrmanager@company.com`).
- [ ] SSL certificate active on ALB (HTTPS port 443 with HSTS header).
- [ ] CloudWatch Alarm for $Z > 2.0$ drift verified in test mode.
- [ ] Rollback plan: previous task definition revision saved in ECS for 1-click rollback.
