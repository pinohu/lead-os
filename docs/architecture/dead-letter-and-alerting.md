# Dead-Letter Queue and Alerting

## Purpose

Provide a final holding area for delivery jobs that permanently fail and alert operators when reliability is at risk.

## Core Rule

A delivery job that exceeds retry limits should move to a dead-letter record and trigger an alert.

## Components

- delivery_jobs
- delivery_events
- dead_letter_jobs
- alert dispatcher

## Dead-Letter Conditions

- attempts exceed retry limit
- invalid payload
- repeated upstream failures

## Alert Conditions

- any dead-letter job
- unusually high error rate
- repeated CRM delivery failures
- repeated SMS/email webhook failures
