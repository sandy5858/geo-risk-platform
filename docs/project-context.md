# HexRisk

## Overview

HexRisk is a geospatial risk analytics platform for India.

The platform ingests historical and forecast weather data from Open-Meteo,
maps weather observations to H3 hex cells, computes risk scores for each
cell, and visualizes the results in an interactive UI.

HexRisk is designed as a distributed, event-driven system built with
TypeScript and Kubernetes-friendly services connected by Kafka.

---

## System Architecture

The platform is split into independent services connected through Kafka
topics, reducing coupling between ingestion, storage, and analysis.

High-level flow:

1. Daily Scheduler generates weather-fetch tasks once per day
2. Weather workers consume tasks and call Open-Meteo
3. Weather workers publish structured weather events to Kafka
4. Weather storage persists weather events to Postgres/PostGIS
5. Risk engine consumes the same weather stream and computes risk scores
6. Risk storage persists computed risk scores
7. geo-api exposes aggregated data to the frontend

This design supports:
- independent service scaling
- replayability and backpressure handling
- fault tolerance when downstream systems are unavailable
- easy future expansion with additional Kafka consumers

---

## Kubernetes Deployment Pattern

- `CronJob` for daily task generation at `0 1 * * *`
- `Deployment` for stateless worker services
- Kafka as durable middleware and partitioned work queue
- Postgres/PostGIS as the authoritative data store
- ConfigMaps and Secrets for configuration and credentials
- Services for internal communication

Example architecture:

Scheduler CronJob
    ↓
weather-fetch-tasks topic
    ↓
Weather Worker replicas
    ↓
weather-data topic
   ↙         ↘
Weather Storage   Risk Engine
    ↓                 ↓
Postgres           risk-events topic
                        ↓
                    Risk Storage

---

## Backend Services

### geo-api

API service for the React UI.

Endpoints:
- `GET /cells` — list H3 cells with risk and weather summaries
- `GET /cells/{h3}` — detail for a single H3 cell
- `GET /risk` — recent risk aggregates
- `GET /forecast` — forecast or model output

### weather-ingestion / scheduler

- Runs once daily as a Kubernetes CronJob
- Generates Kafka messages describing cells and dates to fetch
- Example task payload:
```json
{
  "h3": "845b5d1ffffffff",
  "lat": 12.97,
  "lon": 77.59,
  "date": "2026-06-18"
}
```
- Produces `weather-fetch-tasks`

### weather-worker

- Consumes `weather-fetch-tasks`
- Calls Open-Meteo or another weather API
- Transforms API response into normalized weather events
- Produces to `weather-data`

### weather-storage

- Consumes `weather-data`
- Writes weather observations to Postgres/PostGIS
- Decouples ingestion from persistence

### risk-engine

- Consumes `weather-data`
- Computes risk metrics for each issued weather observation
- Produces risk summaries to `risk-events`

### risk-storage

- Consumes `risk-events`
- Persists risk scores to Postgres

---

## Kafka Topics

- `weather-fetch-tasks`
  - scheduler → workers
  - contains H3 cell + date fetch requests
- `weather-data`
  - workers → storage and risk engine
  - contains processed weather observations
- `risk-events`
  - risk engine → risk storage
  - contains computed risk scores

---

## Data Model

### `weather_daily`

Stores raw weather observations per H3 cell and day.

Columns:
- `h3_index`
- `date`
- `temperature`
- `humidity`
- `pressure`
- `precipitation`
- `wind_speed`
- optionally: `dew_point`, `cloud_cover`, `visibility`

### `risk_daily`

Stores risk scores derived from weather data.

Columns:
- `h3_index`
- `date`
- `flood_risk`
- `heat_risk`
- `storm_risk`
- optionally: `composite_risk`, `alert_level`

---

## Risk Processing

The risk engine computes scores from weather metrics and may use
formulas such as:

- `flood_risk = 0.5 * precipitation + 0.2 * humidity + 0.2 * wind_speed + 0.1 * pressure_drop`
- `heat_risk = f(temperature, humidity)`
- `storm_risk = f(wind_speed, precipitation, pressure)`

These formulas are examples; the system is built to support iterative
refinement and extension.

---

## Frontend

A React + TypeScript UI built with Vite.

Stack:
- React
- TypeScript
- Vite
- Mapbox GL
- h3-js
- Zustand

Core features:
- India map visualization
- H3 cell heatmap overlay
- daily risk and weather drill-down
- historical trends and time series
- responsive dashboard experience

---

## Development Guidelines

- Use TypeScript throughout the system
- Prefer domain-driven folder structure
- Keep components and services small and focused
- Use functional React components
- Use Zustand for state management in the UI
- Use Mapbox GL for map rendering
- Use h3-js for H3 geospatial indexing
- Organize code by feature, not by technical layer
- Avoid files larger than 500 lines
- Produce clean, production-quality code

---

## Future Expansion

This event-driven architecture makes it easy to add new consumers:
- ML feature generation from `weather-data`
- anomaly detection service
- analytics/dashboard service
- offline replay and backfill jobs
- additional risk models

Because Kafka decouples production from consumption, new capabilities
can be added without changing the ingestion pipeline.
