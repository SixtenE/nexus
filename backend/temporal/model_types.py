
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from datetime import datetime

@dataclass
class BaseData:
    has_ovk: bool
    radon_bq_m3: Optional[float]
    energy_class: Optional[str]
    energy_kwh_m2: Optional[float]

@dataclass
class MarketData:
    recent_sales_avg: Optional[float]
    area_price_per_m2: Optional[float]
    transport_score: Optional[float]  # 0-1
    noise_db: Optional[float]

@dataclass
class CostData:
    monthly_fee_sek: Optional[float]
    operating_costs_sek_m: Optional[float]
    parking_available: Optional[bool]

@dataclass
class ValuationResult:
    est_value_low: float
    est_value_high: float
    point_estimate: float

@dataclass
class RiskResult:
    risk_level: str  # e.g., 'LOW', 'MEDIUM', 'HIGH'
    factors: Dict[str, Any]

@dataclass
class SummaryResult:
    text: str

@dataclass
class ReportResult:
    pdf_path: Optional[str]
    json_blob: Dict[str, Any]

@dataclass
class WorkflowInput:
    property_id: str
    address: Optional[str] = None
    area_m2: Optional[float] = None
    year_built: Optional[int] = None
    brf_id: Optional[str] = None
    municipality: Optional[str] = None
    optional_flags: Optional[Dict[str, Any]] = None

@dataclass
class WorkflowState:
    property_id: str
    progress: str
    last_result: Optional[Dict[str, Any]]
    last_run_at: Optional[datetime]
