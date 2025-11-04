
# Real Estate Temporal Patch

This patch adds:
- Temporal workflow `PropertyValuationWorkflow` with activities:
  FetchBaseDataActivity, FetchMarketDataActivity, FetchCostDataActivity,
  AI_ValuationModelActivity, AI_RiskModelActivity, AI_SummaryActivity, GenerateReportActivity
- FastAPI router with endpoints under `/api/temporal`
- A Temporal worker consuming the `prop-valuation` task queue
- A React page `TemporalState.tsx` to browse workflows and trigger actions
- Weekly schedule helper

## Run (local)

1) Install deps:
   ```bash
   uv pip install -r requirements_temporal.txt
   ```
   or
   ```bash
   pip install -r requirements_temporal.txt
   ```

2) Set env:
   ```bash
   export TEMPORAL_TARGET=localhost:7233
   export TEMPORAL_NAMESPACE=default
   ```

3) Start Temporal worker:
   ```bash
   python -m temporal.worker
   ```

4) Start API (standalone minimal app if you don't want to touch your existing app):
   ```bash
   python main_temporal.py
   # API at http://localhost:8088
   ```

   **Integrating into your existing FastAPI app**:
   ```python
   from api.temporal_routes import router as temporal_router
   app.include_router(temporal_router)
   ```

5) Frontend route:
   Add a route to render `TemporalState` page (see app/temporal/README_TEMPORAL.md).

## Search Attributes

Ensure these Search Attributes exist in your Temporal namespace:
- `PropertyId` (Keyword)
- `Municipality` (Keyword)
- `RiskLevel` (Keyword)
- `LastRunAt` (Datetime)
- `HasOVK` (Bool)

## Notes

- No defensive programming; demo activities do not call external APIs.
- No historical data; the activities compute deterministic values from input.
- Report JSON is stored under `var/reports/<property_id>_report.json`.
