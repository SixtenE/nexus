
from __future__ import annotations
from dataclasses import asdict
from typing import Dict, Any, Optional
from datetime import datetime
from temporalio import workflow
from temporalio.common import RetryPolicy
from .model_types import WorkflowInput, WorkflowState
from . import activities as act

# Search Attribute keys expected to exist in your Temporal namespace
SA_PROPERTY_ID = "PropertyId"
SA_MUNICIPALITY = "Municipality"
SA_RISK_LEVEL = "RiskLevel"
SA_LAST_RUN_AT = "LastRunAt"
SA_HAS_OVK = "HasOVK"

@workflow.defn
class PropertyValuationWorkflow:
    def __init__(self) -> None:
        self.state = WorkflowState(property_id="", progress="init", last_result=None, last_run_at=None)
        self._last_payload: Optional[Dict[str, Any]] = None

    @workflow.run
    async def run(self, wf_input: WorkflowInput) -> Dict[str, Any]:
        self.state.property_id = wf_input.property_id
        self.state.progress = "started"

        # Fetch data
        base = await workflow.execute_activity(
            act.FetchBaseDataActivity,
            asdict(wf_input),
            schedule_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        market = await workflow.execute_activity(
            act.FetchMarketDataActivity,
            asdict(wf_input),
            schedule_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        cost = await workflow.execute_activity(
            act.FetchCostDataActivity,
            asdict(wf_input),
            schedule_to_close_timeout=timedelta(seconds=15),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        self.state.progress = "features-ready"

        # Prepare features for models
        features = {
            "area_m2": wf_input.area_m2,
            "monthly_fee_sek": cost.monthly_fee_sek,
            "operating_costs_sek_m": cost.operating_costs_sek_m,
            "parking_available": cost.parking_available,
            "area_price_per_m2": market.area_price_per_m2,
            "energy_kwh_m2": base.energy_kwh_m2,
            "energy_class": base.energy_class,
            "radon_bq_m3": base.radon_bq_m3,
            "has_ovk": base.has_ovk,
            "transport_score": market.transport_score,
            "noise_db": market.noise_db,
        }

        # Models
        valuation = await workflow.execute_activity(
            act.AI_ValuationModelActivity,
            features,
            schedule_to_close_timeout=timedelta(seconds=20),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )
        risk = await workflow.execute_activity(
            act.AI_RiskModelActivity,
            features,
            schedule_to_close_timeout=timedelta(seconds=20),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )
        summary = await workflow.execute_activity(
            act.AI_SummaryActivity,
            {"valuation": asdict(valuation), "risk": asdict(risk)},
            schedule_to_close_timeout=timedelta(seconds=10),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )
        report = await workflow.execute_activity(
            act.GenerateReportActivity,
            {
                "property_id": wf_input.property_id,
                "valuation": asdict(valuation),
                "risk": asdict(risk),
                "summary": asdict(summary),
            },
            schedule_to_close_timeout=timedelta(seconds=30),
            retry_policy=RetryPolicy(maximum_attempts=2),
        )

        # Update search attributes
        await workflow.upsert_search_attributes({
            SA_PROPERTY_ID: [wf_input.property_id],
            SA_MUNICIPALITY: [wf_input.municipality or ""],
            SA_RISK_LEVEL: [risk.risk_level],
            SA_LAST_RUN_AT: workflow.now(),
            SA_HAS_OVK: base.has_ovk,
        })

        self.state.progress = "done"
        self.state.last_run_at = workflow.now()
        self.state.last_result = {
            "valuation": asdict(valuation),
            "risk": asdict(risk),
            "summary": asdict(summary),
            "report": asdict(report),
        }
        self._last_payload = self.state.last_result
        return self.state.last_result

    # ---------- Signals / Updates / Queries ----------

    @workflow.signal
    def PushExternalEvidence(self, payload: Dict[str, Any]) -> None:
        # For demo: just store; a real impl would trigger refetch or flag features
        self._last_payload = {"evidence": payload}

    @workflow.update
    async def RevalueNow(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # Rerun valuation & risk quickly using payload overrides
        overrides = payload or {}
        features = {
            "area_m2": overrides.get("area_m2"),
            "monthly_fee_sek": overrides.get("monthly_fee_sek"),
            "area_price_per_m2": overrides.get("area_price_per_m2"),
            "energy_kwh_m2": overrides.get("energy_kwh_m2"),
            "energy_class": overrides.get("energy_class"),
            "radon_bq_m3": overrides.get("radon_bq_m3"),
            "has_ovk": overrides.get("has_ovk", True),
            "transport_score": overrides.get("transport_score", 0.6),
            "noise_db": overrides.get("noise_db", 55.0),
        }
        valuation = await workflow.execute_activity(act.AI_ValuationModelActivity, features, schedule_to_close_timeout=timedelta(seconds=20))
        risk = await workflow.execute_activity(act.AI_RiskModelActivity, {**features, "monthly_fee_sek": features.get("monthly_fee_sek")}, schedule_to_close_timeout=timedelta(seconds=20))
        summary = await workflow.execute_activity(act.AI_SummaryActivity, {"valuation": asdict(valuation), "risk": asdict(risk)}, schedule_to_close_timeout=timedelta(seconds=10))
        result = {
            "valuation": asdict(valuation),
            "risk": asdict(risk),
            "summary": asdict(summary),
        }
        self.state.last_result = result
        return result

    @workflow.query
    def GetProgress(self) -> str:
        return self.state.progress

    @workflow.query
    def GetLastResult(self) -> Optional[Dict[str, Any]]:
        return self.state.last_result

# Temporal requires timedelta import within workflow definitions
from datetime import timedelta
