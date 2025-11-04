"""
Temporal Worker - kör aktiviteter och workflows
"""
import asyncio
import logging
from temporalio.client import Client
from temporalio.worker import Worker

from workflow import (
    FastighetsvarderingWorkflow,
    hamta_basdata,
    hamta_marknadsdata,
    extrahera_energideklaration,
    extrahera_ovk_protokoll,
    berakna_property_health_index,
    ai_vardering_xgboost,
    ai_riskmodell,
    generera_rapport
)

# Konfigurera logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """
    Starta Temporal worker
    """
    # Anslut till Temporal server
    # OBS: Starta Temporal server först med: temporal server start-dev
    client = await Client.connect("localhost:7233")
    
    logger.info("🚀 Startar Fastighetsvärdering Worker...")
    
    # Skapa worker med våra workflows och aktiviteter
    worker = Worker(
        client,
        task_queue="fastighetsvardering-task-queue",
        workflows=[FastighetsvarderingWorkflow],
        activities=[
            hamta_basdata,
            hamta_marknadsdata,
            extrahera_energideklaration,
            extrahera_ovk_protokoll,
            berakna_property_health_index,
            ai_vardering_xgboost,
            ai_riskmodell,
            generera_rapport
        ],
    )
    
    logger.info("✓ Worker konfigurerad")
    logger.info("✓ Lyssnar på task queue: fastighetsvardering-task-queue")
    logger.info("✓ Redo att ta emot värderingsförfrågningar...")
    
    # Kör worker
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
