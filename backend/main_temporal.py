
from __future__ import annotations
import uvicorn
from fastapi import FastAPI
from api.temporal_routes import router as temporal_router

app = FastAPI(title="RealEstate + Temporal API")
app.include_router(temporal_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8088)
