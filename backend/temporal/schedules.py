
from __future__ import annotations
from datetime import timedelta
from typing import Optional, Dict, Any
from temporalio.client import Client, Schedule, ScheduleActionStartWorkflow, ScheduleSpec

from .workflows import PropertyValuationWorkflow

async def ensure_weekly_schedule(
    client: Client,
    schedule_id: str,
    workflow_id: str,
    wf_args: list[Any],
    memo: Optional[Dict[str, Any]] = None,
) -> None:
    spec = ScheduleSpec(intervals=[timedelta(weeks=1)])
    action = ScheduleActionStartWorkflow(
        workflow=PropertyValuationWorkflow.run,
        id=workflow_id,
        args=wf_args,
        task_queue="prop-valuation",
    )
    sched = Schedule(spec=spec, action=action, memo=memo or {})
    try:
        await client.create_schedule(schedule_id, sched, trigger_immediately=False, overlap="Skip")
    except Exception:
        # Exists; update spec
        handle = client.get_schedule_handle(schedule_id)
        await handle.update(sched)
