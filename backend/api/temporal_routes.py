
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from temporal.client import get_client
from temporal.workflows import PropertyValuationWorkflow
from temporal.model_types import WorkflowInput

router = APIRouter(prefix="/api/temporal", tags=["temporal"])

class StartPayload(BaseModel):
    property_id: str
    address: Optional[str] = None
    area_m2: Optional[float] = None
    year_built: Optional[int] = None
    brf_id: Optional[str] = None
    municipality: Optional[str] = None
    optional_flags: Optional[Dict[str, Any]] = None

@router.post("/start")
async def start_workflow(p: StartPayload):
    client = await get_client()
    handle = await client.start_workflow(
        PropertyValuationWorkflow.run,
        WorkflowInput(**p.model_dump()),
        id=f"prop-{p.property_id}",
        task_queue="prop-valuation",
        search_attributes={
            "PropertyId": [p.property_id],
            "Municipality": [p.municipality or ""],
        },
    )
    return {"workflow_id": handle.id, "run_id": handle.first_execution_run_id}

class RevaluePayload(BaseModel):
    workflow_id: str
    overrides: Optional[Dict[str, Any]] = None

@router.post("/revalue-now")
async def revalue_now(p: RevaluePayload):
    client = await get_client()
    handle = client.get_workflow_handle(p.workflow_id)
    result = await handle.execute_update(PropertyValuationWorkflow.RevalueNow, args=[p.overrides or {}])
    return {"workflow_id": p.workflow_id, "result": result}

class EvidencePayload(BaseModel):
    workflow_id: str
    evidence: Dict[str, Any]

@router.post("/push-evidence")
async def push_evidence(p: EvidencePayload):
    client = await get_client()
    handle = client.get_workflow_handle(p.workflow_id)
    await handle.signal(PropertyValuationWorkflow.PushExternalEvidence, p.evidence)
    return {"ok": True}

@router.get("/progress")
async def get_progress(workflow_id: str):
    client = await get_client()
    handle = client.get_workflow_handle(workflow_id)
    prog = await handle.query(PropertyValuationWorkflow.GetProgress)
    return {"workflow_id": workflow_id, "progress": prog}

@router.get("/last-result")
async def get_last_result(workflow_id: str):
    client = await get_client()
    handle = client.get_workflow_handle(workflow_id)
    res = await handle.query(PropertyValuationWorkflow.GetLastResult)
    return {"workflow_id": workflow_id, "last_result": res}

class SearchFilter(BaseModel):
    property_id: Optional[str] = None
    municipality: Optional[str] = None
    risk_level: Optional[str] = None

@router.post("/workflows")
async def list_workflows(f: SearchFilter):
    client = await get_client()
    query = "WorkflowType='PropertyValuationWorkflow'"
    if f.property_id:
        query += f" and PropertyId='{f.property_id}'"
    if f.municipality:
        query += f" and Municipality='{f.municipality}'"
    if f.risk_level:
        query += f" and RiskLevel='{f.risk_level}'"
    # Order by time desc
    query += " order by StartTime desc"
    res = await client.list_workflows(query=query, page_size=50)
    items = []
    async for w in res:
        items.append({
            "workflow_id": w.id,
            "run_id": w.run_id,
            "start_time": w.start_time.isoformat() if w.start_time else None,
            "status": str(w.status),
            "type": w.type,
            "task_queue": w.task_queue,
            "search_attributes": w.search_attributes,
        })
    return {"items": items}

class SchedulePayload(BaseModel):
    property_id: str
    municipality: Optional[str] = None
    address: Optional[str] = None
    area_m2: Optional[float] = None
    year_built: Optional[int] = None
    brf_id: Optional[str] = None

@router.post("/schedules/ensure-weekly")
async def ensure_weekly(p: SchedulePayload):
    client = await get_client()
    from backend.temporal.schedules import ensure_weekly_schedule
    wf_id = f"prop-{p.property_id}"
    sched_id = f"sched-{p.property_id}"
    wf_input = [dict(
        property_id=p.property_id,
        address=p.address,
        area_m2=p.area_m2,
        year_built=p.year_built,
        brf_id=p.brf_id,
        municipality=p.municipality,
    )]
    await ensure_weekly_schedule(client, schedule_id=sched_id, workflow_id=wf_id, wf_args=wf_input, memo={"property_id": p.property_id})
    return {"ok": True, "schedule_id": sched_id, "workflow_id": wf_id}
