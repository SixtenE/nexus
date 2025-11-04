
from __future__ import annotations
import os
from temporalio.client import Client

TEMPORAL_TARGET = os.getenv("TEMPORAL_TARGET", "localhost:7233")
TEMPORAL_NAMESPACE = os.getenv("TEMPORAL_NAMESPACE", "default")

async def get_client() -> Client:
    return await Client.connect(TEMPORAL_TARGET, namespace=TEMPORAL_NAMESPACE)
