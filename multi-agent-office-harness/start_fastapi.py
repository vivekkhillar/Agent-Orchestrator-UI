"""
Unified Runner Script: Runs both the FastAPI Gateway & Test Suite
"""
import uvicorn
import sys
import os

if __name__ == "__main__":
    port = int(os.getenv("FASTAPI_PORT", 8000))
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    print(f"================================================================")
    print(f"🚀 Starting FastAPI Banking Orchestrator on http://{host}:{port}")
    print(f"📖 Interactive Swagger Docs: http://{host}:{port}/docs")
    print(f"📖 ReDoc Documentation:    http://{host}:{port}/redoc")
    print(f"================================================================")
    uvicorn.run("fastapi_app:app", host=host, port=port, reload=True)
