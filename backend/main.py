from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict

app = FastAPI(title="Real Estate Valuation API", version="0.1.0")

class ValuationInput(BaseModel):
    # Keep it minimal; no historical data used.
    area_m2: float = Field(..., gt=0)
    rooms: int = Field(..., ge=0)
    monthly_fee_sek: float = Field(..., ge=0)
    location_score: float = Field(..., ge=0, le=1)  # 0-1
    building_energy_class: Optional[str] = None     # e.g., "A".."G"
    ovk_ok: Optional[bool] = None
    radon_ok: Optional[bool] = None
    parking: Optional[bool] = None
    distance_to_center_km: Optional[float] = None

class ValuationOutput(BaseModel):
    estimated_value_sek: float
    ai_value_index: float
    risk_score: float

def energy_penalty(energy: Optional[str]) -> float:
    if not energy:
        return 0.0
    ladder = {"A": 0.0, "B": 0.01, "C": 0.02, "D": 0.03, "E": 0.05, "F": 0.08, "G": 0.12}
    return ladder.get(energy.upper(), 0.03)

@app.post("/api/valuation", response_model=ValuationOutput)
def estimate(payload: ValuationInput):
    # Very simple, deterministic model with no history:
    # base price per m2 derived from location; fee reduces value; minor penalties from energy/flags.
    base_p_per_m2 = 70000.0 * (0.6 + 0.4 * payload.location_score)  # 42k..70k
    fee_penalty = min(payload.monthly_fee_sek, 10000.0) * 100.0      # crude capitalization
    e_pen = energy_penalty(payload.building_energy_class)

    feature_bonus = 0.0
    if payload.parking:
        feature_bonus += 50000.0
    if payload.ovk_ok:
        feature_bonus += 10000.0
    if payload.radon_ok:
        feature_bonus += 10000.0
    if payload.distance_to_center_km is not None:
        feature_bonus += max(0.0, 10.0 - payload.distance_to_center_km) * 5000.0

    gross = payload.area_m2 * base_p_per_m2 + payload.rooms * 100000.0 + feature_bonus
    net = gross * (1.0 - e_pen) - fee_penalty

    # Index: 0..100 simple normalization over plausible range
    ai_index = max(0.0, min(100.0, (net / 10_000_000.0) * 100.0))
    # Risk: higher monthly fee and poor energy class => higher risk (0..100)
    risk = max(0.0, min(100.0, (payload.monthly_fee_sek / 10000.0) * 60.0 + e_pen * 200.0))

    return ValuationOutput(
        estimated_value_sek=float(round(net, 2)),
        ai_value_index=float(round(ai_index, 2)),
        risk_score=float(round(risk, 2)),
    )

# Run with: uvicorn backend.main:app --reload
