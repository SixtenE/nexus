
from __future__ import annotations
import asyncio
from temporalio.worker import Worker
from .client import get_client
from . import activities as act
from .workflows import PropertyValuationWorkflow

async def main() -> None:
    client = await get_client()
    worker = Worker(
        client,
        task_queue="prop-valuation",
        workflows=[PropertyValuationWorkflow],
        activities=[
            act.FetchBaseDataActivity,
            act.FetchMarketDataActivity,
            act.FetchCostDataActivity,
            act.AI_ValuationModelActivity,
            act.AI_RiskModelActivity,
            act.AI_SummaryActivity,
            act.GenerateReportActivity,
        ],
    )
    print("Worker started on task queue 'prop-valuation'")
    await worker.run()

if __name__ == "__main__":
    asyncio.run(main())
