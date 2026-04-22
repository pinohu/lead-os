# Reliability Layer

## Purpose

Guarantee lead delivery through queueing, retry logic, and event logging.

## Core Components

- delivery job table / queue
- worker
- retry policy
- event log
- dead-letter handling

## Core Rule

Lead delivery should be asynchronous and observable. API success should not depend on all downstream channels succeeding immediately.

## Delivery Lifecycle

1. lead accepted
2. delivery jobs created
3. worker processes jobs
4. success/failure logged
5. failed jobs retried
6. permanently failed jobs marked dead-letter

## Retry Policy

- retry up to 5 times
- exponential backoff
- preserve channel-specific errors
