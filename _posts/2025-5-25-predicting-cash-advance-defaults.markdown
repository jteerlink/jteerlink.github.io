---
layout: post
title:  Predicting Cash Advance Defaults
date:   2025-05-25
image:  cash.jpg
tags:   Machine Learning
---
This project develops a predictive model to identify customers at high risk of defaulting on cash advances. The solution integrates exploratory data analysis, thoughtful feature engineering, robust feature selection, and a tuned machine learning model to support informed credit decisioning.

---

## 1. Exploratory Data Analysis (EDA)

Initial analysis focused on uncovering relationships between customer financial behavior and default risk:

- **Key indicators of risk** include error rates in transactions, overdraft totals, and high-frequency negative balances.
- **Temporal insights**: While limited by data aggregation, introducing features over recent time frames (e.g., 30/60/90 days) was identified as a potential enhancement.
- **Anomalies**: Observations such as high-income customers requesting small advances raised flags for possible fraud.
- **Hypotheses tested**: Repeat customers were assumed to be lower risk but showed nearly identical default rates to new users.
- **Important features identified**:
  - Current balance
  - Overdraft frequency
  - Monthly spend and income volatility
  - Discretionary spend and paycheck regularity

Outliers were retained in the dataset due to the robustness of tree-based models like XGBoost, reducing extrapolation risk.

---

## 2. Feature Engineering

Feature design emphasized financial stability, liquidity, and customer behavior:

- Ratios:
  - Advance-to-income
  - Advance-to-balance
- Volatility metrics:
  - Income stability
  - Balance fluctuation
- Behavioral metrics:
  - Low balance frequency
  - Net 60-day cash flow
  - Overdrafts per 30 days
- Categorical:
  - First-time borrower
  - Hour of advance request

Only a subset of engineered features were included due to limitations in unaggregated data availability.

---

## 3. Feature Selection

Two techniques were applied:

- **Recursive Feature Elimination (RFE)** with Random Forests
- **XGBoost feature importances**

Findings confirmed that engineered categorical variables (e.g., paycheck models) had low predictive value. Final feature set retained only those with non-zero XGBoost importance weights.

---

## 4. Model Training and Hyperparameter Tuning

- **Algorithm**: XGBoost (chosen for robustness to scaling and imbalanced data)
- **Tuning tool**: Optuna for automated hyperparameter search
- **Evaluation metrics**: AUC and Gini index

**Results**:
- Tuned AUC: **0.7201** (↑ 0.04 from baseline)
- Tuned Gini: **0.4401** (↑ 0.07 from baseline)

Performance was considered strong given limited data, with meaningful stratification of risk across deciles.

---

## 5. Model Validation and Insights

- **Lift charts and decile analysis** confirmed effective separation of high-risk groups.
- **Opportunity for improvement** exists in mid-risk deciles through deeper feature discovery.

**Enhancement suggestions**:
- Ingest raw transaction-level data
- Add time-sensitive variables
- Explore class weighting despite 22% positive class rate

---

## 6. Deployment Considerations

- **Model export**: Saved as JSON for backward compatibility and deployment flexibility.
- **Integration plan**: Deploy as an API endpoint integrated with customer-facing platforms or decision engines.
- **Scoring strategy**: Current version uses raw predicted probabilities; production-grade systems would involve calibrated scores or logit transformations with predefined risk tiers and policy cutoffs.

---

## Next Steps

To evolve this proof-of-concept into a production-ready solution:

- Ingest **raw transactional data** for advanced feature engineering
- Implement a **calibrated scoring system**
- Automate **data pipeline and model retraining**
- Collaborate with **credit strategy teams** for risk policy refinement

---

This project provides a solid foundation for credit default modeling in fintech environments and demonstrates practical, scalable approaches for real-world lending applications.


***