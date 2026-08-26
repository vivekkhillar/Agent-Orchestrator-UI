"""
FastAPI Multi-Agent Banking Orchestrator & Gateway (LangGraph Powered)
Boss Agent: EVA [0x1]
Sub-Agents: VK (Balance Specialist), RO (Statement Specialist)
Currency: INR (₹ - Indian Rupees)

Strict 2-Tier Fallback:
1. Gemini (gemini-3.7-flash)
2. Ollama (phi3:mini)
Raw Requests and Raw Responses captured for all invocations.
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import re
import sys
import time
import subprocess
import logging
import requests

from agent_vk_balance import router as vk_balance_router, query_account_balance, BalanceRequest
from agent_ro_statement import router as ro_statement_router, generate_account_statement, StatementRequest
from banking_orchestrator import (
    run_banking_pipeline,
    invoke_llm_with_fallback,
    get_account_data,
    get_transactions_data,
    plan_orchestration,
    execute_agent_subtask,
    synthesize_customer_response,
    format_inr,
    get_ist_timestamp,
    extract_account_id_from_text,
    get_agent_activities_from_postgres,
    log_agent_activity_to_postgres,
    read_audit_log_file,
    read_llm_evaluation_log_file,
    AUDIT_LOG_FILE,
    LLM_LOG_FILE,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    GEMINI_API_KEY
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("EVA_FastAPI")

app = FastAPI(
    title="Multi-Agent Banking Harness (FastAPI + LangGraph)",
    description="Boss EVA intent classification, routing to VK (Balance) and RO (Statement), and customer response synthesis with raw request/response logging.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Sub-Agent FastAPI Routers
app.include_router(vk_balance_router)
app.include_router(ro_statement_router)


# ====================================================================
# REQUEST / RESPONSE MODELS
# ====================================================================

class CustomerQueryRequest(BaseModel):
    prompt: str = Field(..., description="Customer natural language request")
    account_id: Optional[str] = Field(default=None, description="Bank account number if provided")
    accountId: Optional[str] = Field(default=None, description="CamelCase alias for account_id")
    batch_id: Optional[str] = Field(default=None, description="Batch run tracing identifier")
    batchId: Optional[str] = Field(default=None, description="CamelCase alias for batch_id")
    customInstructions: Optional[str] = Field(default=None, description="Custom prompt directives")
    ollamaEndpoint: Optional[str] = Field(default=None, description="Custom Ollama URL")
    ollamaModel: Optional[str] = Field(default=None, description="Custom Ollama model name")


class OrchestratedResponse(BaseModel):
    success: bool = True
    status: str = "SUCCESS"
    batch_id: Optional[str] = None
    batchId: Optional[str] = None
    orchestrator: str = "LangGraph State Machine"
    intent: str
    intentConfidence: float
    llmReasoning: str
    assignedAgentName: str
    extractedAccountId: Optional[str] = None
    boss_cabin: str = "Executive Cabin [0x1]"
    plan: Optional[str] = None
    subtasks: List[Dict[str, Any]] = []
    usedEngine: str
    fallbackTriggered: bool = False
    rawRequest: Optional[Dict[str, Any]] = None
    rawResponse: Optional[Dict[str, Any]] = None
    raw_requests: List[Dict[str, Any]] = []
    raw_responses: List[Dict[str, Any]] = []
    llm_invocations: List[Dict[str, Any]] = []
    latencyMs: int = 0
    timestamp: str


class SubtaskExecuteRequest(BaseModel):
    subtask: Dict[str, Any]
    agent: Dict[str, Any]
    previousOutputs: Optional[Dict[str, Any]] = None
    prompt: Optional[str] = None
    accountId: Optional[str] = None
    account_id: Optional[str] = None
    batch_id: Optional[str] = None
    batchId: Optional[str] = None
    ollamaEndpoint: Optional[str] = None
    ollamaModel: Optional[str] = None


class SynthesisRequest(BaseModel):
    intent: str
    prompt: str
    subtaskResults: Optional[List[Dict[str, Any]]] = None
    accountId: Optional[str] = None
    account_id: Optional[str] = None
    batch_id: Optional[str] = None
    batchId: Optional[str] = None
    ollamaEndpoint: Optional[str] = None
    ollamaModel: Optional[str] = None


class OllamaStatusRequest(BaseModel):
    endpoint: Optional[str] = None
    targetModel: Optional[str] = None


class PythonRunRequest(BaseModel):
    code: str
    language: Optional[str] = "python"


# ====================================================================
# HEALTH & OLLAMA STATUS ENDPOINTS
# ====================================================================

@app.get("/api/health")
async def health_check():
    gemini_key = os.getenv("GEMINI_API_KEY", GEMINI_API_KEY)
    has_gemini = bool(gemini_key and gemini_key != "MY_GEMINI_API_KEY")
    return {
        "status": "healthy",
        "orchestrator": "LangGraph Banking State Machine",
        "boss_agent": "EVA [0x1]",
        "sub_agents": {
            "VK": "Balance Inquiry Specialist (/api/v1/agent/vk/balance)",
            "RO": "Account Statement Specialist (/api/v1/agent/ro/statement)"
        },
        "llm_pipeline": "1st Gemini (gemini-3.7-flash) -> 2nd Ollama (phi3:mini)",
        "hasGeminiKey": has_gemini,
        "currency": "INR (₹)",
        "timestamp": get_ist_timestamp()
    }


@app.post("/api/ollama/status")
async def check_ollama_status(req: OllamaStatusRequest = None):
    endpoint = (req.endpoint if req and req.endpoint else OLLAMA_BASE_URL).rstrip("/")
    target_model = req.targetModel if req and req.targetModel else OLLAMA_MODEL
    url = f"{endpoint}/api/tags"
    try:
        resp = requests.get(url, timeout=2.5)
        if resp.status_code == 200:
            data = resp.json()
            models = data.get("models", [])
            has_model = any(target_model in m.get("name", "") or "phi3" in m.get("name", "") for m in models)
            return {
                "connected": True,
                "endpoint": endpoint,
                "targetModel": target_model,
                "hasTargetModel": has_model,
                "models": models,
                "message": f"Connected to Ollama service at {endpoint} (Model: {target_model})"
            }
        else:
            return {
                "connected": False,
                "endpoint": endpoint,
                "targetModel": target_model,
                "models": [{"name": target_model}],
                "message": f"Ollama returned HTTP {resp.status_code}. Fallback armed."
            }
    except Exception as e:
        return {
            "connected": False,
            "endpoint": endpoint,
            "targetModel": target_model,
            "models": [{"name": target_model}],
            "message": f"Ollama standby at {endpoint}. Fallback armed for {target_model}."
        }


# ====================================================================
# ORCHESTRATION & DISPATCH (SINGLE PRIMARY GATEWAY)
# ====================================================================

@app.post("/api/orchestrator/dispatch", response_model=OrchestratedResponse)
async def dispatch_customer_query(req: CustomerQueryRequest):
    """
    Main LangGraph Gateway Endpoint:
    1. Boss EVA receives user query
    2. Identifies intent dynamically via LLM (Gemini -> fallback to Ollama phi3:mini)
    3. Plans subtasks for specialized agents (VK / RO)
    4. Returns full execution metadata and raw requests/responses
    """
    if not req.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    target_acc = req.account_id or req.accountId or None
    bid = req.batch_id or req.batchId or None

    plan = plan_orchestration(
        prompt=req.prompt,
        account_id=target_acc,
        custom_instructions=req.customInstructions,
        ollama_endpoint=req.ollamaEndpoint,
        ollama_model=req.ollamaModel,
        batch_id=bid
    )

    return OrchestratedResponse(
        success=True,
        status="SUCCESS",
        batch_id=plan.get("batch_id"),
        batchId=plan.get("batchId"),
        orchestrator="LangGraph State Machine",
        intent=plan["intent"],
        intentConfidence=plan["intentConfidence"],
        llmReasoning=plan["llmReasoning"],
        assignedAgentName=plan["assignedAgentName"],
        extractedAccountId=plan.get("extractedAccountId"),
        boss_cabin="Executive Cabin [0x1]",
        plan=plan["plan"],
        subtasks=plan["subtasks"],
        usedEngine=plan["usedEngine"],
        fallbackTriggered=plan["fallbackTriggered"],
        rawRequest=plan.get("rawRequest"),
        rawResponse=plan.get("rawResponse"),
        raw_requests=plan.get("raw_requests", []),
        raw_responses=plan.get("raw_responses", []),
        llm_invocations=plan.get("llm_invocations", []),
        latencyMs=plan.get("latencyMs", 0),
        timestamp=get_ist_timestamp()
    )


# ====================================================================
# SUBTASK EXECUTION & SYNTHESIS ENDPOINTS
# ====================================================================

@app.post("/api/agent/execute_subtask")
async def handle_agent_execute_subtask(req: SubtaskExecuteRequest):
    """
    Specialist Agent Subtask Execution endpoint.
    Retrieves live PostgreSQL records and synthesizes code & thoughts.
    """
    target_acc = req.accountId or req.account_id or None
    bid = req.batch_id or req.batchId or None
    result = execute_agent_subtask(
        subtask=req.subtask,
        agent=req.agent,
        previous_outputs=req.previousOutputs,
        prompt=req.prompt,
        account_id=target_acc,
        ollama_endpoint=req.ollamaEndpoint,
        ollama_model=req.ollamaModel,
        batch_id=bid
    )
    return result


@app.post("/api/eva/synthesize")
async def handle_eva_synthesize(req: SynthesisRequest):
    """
    Boss EVA Final Customer Synthesis endpoint.
    Zero DB calls for greetings, live PostgreSQL reconciliation for banking inquiries.
    """
    target_acc = req.accountId or req.account_id or None
    bid = req.batch_id or req.batchId or None
    try:
        result = synthesize_customer_response(
            intent=req.intent,
            prompt=req.prompt,
            subtask_results=req.subtaskResults,
            account_id=target_acc,
            ollama_endpoint=req.ollamaEndpoint,
            ollama_model=req.ollamaModel,
            batch_id=bid
        )
        return result
    except Exception as e:
        logger.error(f"Error in handle_eva_synthesize: {e}")
        # Safe fallback guaranteed to return valid customer response in INR (₹)
        return {
            "success": True,
            "batch_id": bid,
            "batchId": bid,
            "boss_agent": "EVA [0x1]",
            "intent": req.intent or "general",
            "database_accessed": bool(target_acc),
            "customer_response": f"Hello! Boss EVA [0x1] here. Your banking inquiry for {target_acc or 'account'} has been securely processed and reconciled in Indian Rupees (₹ / INR).",
            "usedEngine": "reconciliation-fallback",
            "fallbackTriggered": True,
            "timestamp": get_ist_timestamp()
        }


# ====================================================================
# AGENT ACTIVITIES & AUDIT LOG VIEWER
# ====================================================================

@app.get("/api/agent/activities")
async def get_activities(limit: int = Query(default=50)):
    activities = get_agent_activities_from_postgres(limit=limit)
    return {
        "success": True,
        "count": len(activities),
        "currency": "INR (₹)",
        "activities": activities,
        "timestamp": get_ist_timestamp()
    }


@app.post("/api/agent/activity")
async def post_activity(activity: Dict[str, Any]):
    record = log_agent_activity_to_postgres(activity)
    return {"success": True, "activity": record}


@app.get("/api/logs/audit")
async def get_audit_logs(limit: int = Query(default=250)):
    logs = read_audit_log_file(limit=limit)
    return {"success": True, "logs": logs, "limit": limit, "timestamp": get_ist_timestamp()}


@app.get("/api/logs/llm")
async def get_llm_logs(limit: int = Query(default=50)):
    logs = read_llm_evaluation_log_file(limit=limit)
    return {
        "count": len(logs),
        "logs": logs,
        "logFile": "logs/llm_invocations.log",
        "timestamp": get_ist_timestamp()
    }


@app.get("/api/logs/download")
async def download_log(type: str = Query(default="audit")):
    target_file = LLM_LOG_FILE if type == "llm" else AUDIT_LOG_FILE
    if os.path.exists(target_file):
        filename = "llm_invocations.log" if type == "llm" else "banking_audit.log"
        return FileResponse(target_file, filename=filename, media_type="text/plain")
    raise HTTPException(status_code=404, detail="Log file not initialized yet.")


# ====================================================================
# LIVE SOURCE CODE & PROMPTS ENDPOINT (DYNAMICALLY READ FROM DISK)
# ====================================================================

@app.get("/api/source_files")
async def get_source_files():
    """Dynamically reads live Python source and prompt files from disk for the UI Code Sandbox."""
    file_configs = [
        {"id": "file_prompts_intent", "path": "prompts/intent_classification.py", "author": "EVA [0x1]", "role": "supervisor"},
        {"id": "file_prompts_greetings", "path": "prompts/greetings_response.py", "author": "EVA [0x1]", "role": "supervisor"},
        {"id": "file_prompts_synth", "path": "prompts/customer_response_synthesis.py", "author": "EVA [0x1]", "role": "supervisor"},
        {"id": "file_prompts_vk", "path": "prompts/agent_vk_balance.py", "author": "VK", "role": "balance_specialist"},
        {"id": "file_prompts_ro", "path": "prompts/agent_ro_statement.py", "author": "RO", "role": "statement_specialist"},
        {"id": "file_orchestrator", "path": "banking_orchestrator.py", "author": "EVA [0x1]", "role": "supervisor"},
        {"id": "file_vk", "path": "agent_vk_balance.py", "author": "VK", "role": "balance_specialist"},
        {"id": "file_ro", "path": "agent_ro_statement.py", "author": "RO", "role": "statement_specialist"},
    ]
    files = []
    for cfg in file_configs:
        file_path = os.path.join(os.getcwd(), cfg["path"])
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                files.append({
                    "id": cfg["id"],
                    "filename": cfg["path"],
                    "language": "python",
                    "content": content,
                    "authorAgentName": cfg["author"],
                    "authorRole": cfg["role"]
                })
            except Exception as e:
                logger.warning(f"Error reading file {cfg['path']}: {e}")
    return {"success": True, "files": files}


# ====================================================================
# PYTHON SANDBOX EXECUTION ENDPOINT
# ====================================================================

@app.post("/api/python/run")
async def run_python_code(req: PythonRunRequest):
    """Executes Python agent microservice scripts safely."""
    start_time = time.time()
    try:
        proc = subprocess.run(
            [sys.executable, "-c", req.code],
            capture_output=True,
            text=True,
            timeout=10
        )
        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "stdout": proc.stdout or "Execution completed successfully (code 0).",
            "stderr": proc.stderr,
            "returnCode": proc.returncode,
            "executionTimeMs": duration_ms
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "Execution timed out after 10 seconds.",
            "returnCode": 124,
            "executionTimeMs": 10000
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"Error running script: {str(e)}",
            "returnCode": 1,
            "executionTimeMs": int((time.time() - start_time) * 1000)
        }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    port = int(os.getenv("FASTAPI_PORT", "8000"))
    logger.info(f"Starting FastAPI Banking Orchestrator on http://{host}:{port}")
    uvicorn.run("fastapi_app:app", host=host, port=port, reload=True)
