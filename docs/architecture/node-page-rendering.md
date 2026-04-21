# Node to Page Rendering System

## Purpose

Convert generated geo-niche nodes into real, routable pages in the application.

## Rendering Layers

1. data source
2. node resolver
3. page model
4. dynamic route
5. monetization placement layer

## Core Rule

A node should render from data and config, not from hardcoded county or niche strings.

## URL Model

Recommended network path:

/state/{state}/county/{county}/city/{city}/niche/{niche}

Examples:
- /state/pa/county/erie/city/erie/niche/plumbing
- /state/tx/county/dallas/city/dallas/niche/hvac

## Page Model

Each rendered page should include:
- title
- summary
- trust section
- local nuance section
- CTA section
- monetization placements determined by rules engine

## Placement Rule

- directory node pages use partner-based monetization
- authority pages use affiliate monetization
- post-lead views may use hybrid placement
