# Territory Ranking, Provider ROI, and Churn Detection

## Purpose

Turn raw marketplace activity into decisions about where to expand, where providers are getting value, and where churn risk is rising.

## Core Outputs

- top territories by lead volume
- provider lead volume and estimated ROI
- churn risk indicators by provider or node

## Core Rule

Every active subscription should be evaluated against recent lead flow and delivery quality.

## Initial Heuristics

- territory ranking = lead volume over recent period
- provider ROI = estimated value from lead volume versus subscription price
- churn risk = active subscription with low or zero recent lead volume and/or delivery failures

## Future Scope

- booking and close rate based ROI
- time-weighted territory scoring
- pricing recommendations
