
from __future__ import annotations
from temporalio import activity
from .model_types import BaseData, MarketData, CostData, ValuationResult, RiskResult, SummaryResult, ReportResult
from typing import Dict, Any, Optional
from pathlib import Path
import json, math, time

# NOTE: No external I/O implemented; stubs emulate computation.
# Add your real API calls here (Hemnet/Booli/SCB/OVK/Radon/EnergyCert).

@activity.defn
async def FetchBaseDataActivity(payload: Dict[str, Any]) -> BaseData:
    # Simulate latency and compute defaults
    time.sleep(0.2)
    return BaseData(
        has_ovk=True,
        radon_bq_m3=60.0,
        energy_class="C",
        energy_kwh_m2=95.0,
    )

@activity.defn
async def FetchMarketDataActivity(payload: Dict[str, Any]) -> MarketData:
    time.sleep(0.2)
    # Stubbed values
    return MarketData(
        recent_sales_avg=3750000.0,
        area_price_per_m2=62000.0,
        transport_score=0.7,
        noise_db=52.0,
    )

@activity.defn
async def FetchCostDataActivity(payload: Dict[str, Any]) -> CostData:
    time.sleep(0.1)
    return CostData(
        monthly_fee_sek=4200.0,
        operating_costs_sek_m=900.0,
        parking_available=True
    )

@activity.defn
async def AI_ValuationModelActivity(inputs: Dict[str, Any]) -> ValuationResult:
    # Simple deterministic model: price = area * area_ppm * multipliers
    area = float(inputs.get("area_m2") or 60.0)
    area_ppm = float(inputs.get("area_price_per_m2") or 60000.0)
    fee = float(inputs.get("monthly_fee_sek") or 4000.0)
    energy_kwh_m2 = float(inputs.get("energy_kwh_m2") or 110.0)
    transport = float(inputs.get("transport_score") or 0.6)
    noise = float(inputs.get("noise_db") or 55.0)

    # Heuristic multipliers
    m_fee = 1.0 - min(max((fee - 3500.0) / 5000.0, 0.0), 0.2)  # up to -20%
    m_energy = 1.0 - min(max((energy_kwh_m2 - 100.0) / 300.0, 0.0), 0.1)  # up to -10%
    m_transport = 1.0 + min(max((transport - 0.5) * 0.2, -0.05), 0.1)     # +/- 10%
    m_noise = 1.0 - min(max((noise - 50.0) / 30.0, 0.0), 0.08)            # up to -8%

    point = area * area_ppm * m_fee * m_energy * m_transport * m_noise
    low = point * 0.95
    high = point * 1.05
    return ValuationResult(est_value_low=low, est_value_high=high, point_estimate=point)

@activity.defn
async def AI_RiskModelActivity(features: Dict[str, Any]) -> RiskResult:
    # Score risk from 0-100 using simple weights
    risk_score = 0.0
    factors = {}
    fee = float(features.get("monthly_fee_sek") or 4000.0)
    energy_kwh_m2 = float(features.get("energy_kwh_m2") or 110.0)
    energy_class = str(features.get("energy_class") or "D")
    radon = float(features.get("radon_bq_m3") or 80.0)
    has_ovk = bool(features.get("has_ovk") if features.get("has_ovk") is not None else True)
    noise = float(features.get("noise_db") or 55.0)

    if fee > 4500: risk_score += 15; factors["fee"] = "high"
    if energy_kwh_m2 > 120: risk_score += 15; factors["energy_kwh_m2"] = "high"
    if energy_class in ("E","F","G"): risk_score += 15; factors["energy_class"] = energy_class
    if radon > 100: risk_score += 20; factors["radon"] = "elevated"
    if not has_ovk: risk_score += 10; factors["ovk"] = "missing"
    if noise > 60: risk_score += 10; factors["noise"] = "high"

    level = "LOW" if risk_score < 20 else "MEDIUM" if risk_score < 40 else "HIGH"
    return RiskResult(risk_level=level, factors=factors)

@activity.defn
async def AI_SummaryActivity(payload: Dict[str, Any]) -> SummaryResult:
    point = payload.get("valuation", {}).get("point_estimate")
    level = payload.get("risk", {}).get("risk_level")
    text = f"The property is valued around {int(point):,} SEK with risk level {level}.".replace(",", " ")
    return SummaryResult(text=text)

@activity.defn
async def GenerateReportActivity(payload: Dict[str, Any]) -> ReportResult:
    # Persist a JSON report (PDF not implemented here)
    out_dir = Path("var/reports")
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "property_id": payload.get("property_id"),
        "valuation": payload.get("valuation"),
        "risk": payload.get("risk"),
        "summary": payload.get("summary"),
    }
    json_path = out_dir / f"{payload.get('property_id')}_report.json"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False))
    return ReportResult(pdf_path=None, json_blob=report)
