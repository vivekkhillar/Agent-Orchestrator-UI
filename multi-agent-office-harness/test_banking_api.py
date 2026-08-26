"""
Pytest Test Suite for FastAPI Banking Multi-Agent System
Tests Dynamic Account Identification, Intent Routing, Live DB Queries, and LLM Synthesis
"""

import pytest
from fastapi.testclient import TestClient
from fastapi_app import app
from agent_vk_balance import query_account_balance, BalanceRequest
from agent_ro_statement import generate_account_statement, StatementRequest
from banking_orchestrator import (
    plan_orchestration,
    run_banking_pipeline,
    get_account_data,
    get_transactions_data,
    synthesize_customer_response,
    extract_account_id_from_text
)

client = TestClient(app)

def test_fastapi_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "EVA [0x1]" in data["boss_agent"]
    assert data["currency"] == "INR (₹)"


def test_dynamic_account_extraction():
    assert extract_account_id_from_text("What is my balance for ACC-94820?") == "ACC-94820"
    assert extract_account_id_from_text("Statement for account id ACC-55210 please") == "ACC-55210"
    assert extract_account_id_from_text("Check balance for ACC 10029") == "ACC-10029"
    assert extract_account_id_from_text("Hello Boss EVA, good morning") is None


def test_eva_intent_classification():
    # Test Balance Intent with dynamic account extraction
    plan1 = plan_orchestration("What is my current available balance for ACC-94820?")
    assert plan1["intent"] == "balance_inquiry"
    assert plan1["assignedAgentName"] == "VK"
    assert plan1["extractedAccountId"] == "ACC-94820"
    assert plan1["intentConfidence"] >= 0.90
    assert len(plan1["subtasks"]) >= 1

    # Test Statement Intent with another account
    plan2 = plan_orchestration("Please send me last 30 days bank statement for ACC-55210")
    assert plan2["intent"] == "account_statement"
    assert plan2["assignedAgentName"] == "RO"
    assert plan2["extractedAccountId"] == "ACC-55210"
    assert len(plan2["subtasks"]) >= 1

    # Test Greeting Intent (Zero subtasks, zero DB calls)
    plan3 = plan_orchestration("hello, good morning EVA!")
    assert plan3["intent"] == "greetings"
    assert len(plan3["subtasks"]) == 0


def test_fastapi_orchestrator_dispatch():
    response = client.post("/api/orchestrator/dispatch", json={"prompt": "Check my balance for ACC-94820"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["intent"] == "balance_inquiry"
    assert data["assignedAgentName"] == "VK"
    assert data["extractedAccountId"] == "ACC-94820"
    assert len(data["subtasks"]) >= 1


@pytest.mark.asyncio
async def test_vk_balance_inquiry_dynamic():
    # Account 1: ACC-94820
    res1 = await query_account_balance(BalanceRequest(account_id="ACC-94820"))
    assert res1.account_id == "ACC-94820"
    assert res1.currency == "INR"
    assert res1.currency_symbol == "₹"
    assert res1.available_balance == 139430.50

    # Account 2: ACC-55210 (Different balances dynamically retrieved from DB)
    res2 = await query_account_balance(BalanceRequest(account_id="ACC-55210"))
    assert res2.account_id == "ACC-55210"
    assert res2.available_balance == 1387300.00
    assert res2.checking_balance == 542300.00


@pytest.mark.asyncio
async def test_ro_statement_generation_dynamic():
    req = StatementRequest(account_id="ACC-94820", days_period=30)
    res = await generate_account_statement(req)
    
    assert res.account_id == "ACC-94820"
    assert res.transaction_count >= 5
    assert res.total_credits == 64200.00
    assert res.total_debits == 18420.00
    assert res.net_change == 45780.00
    assert "OFFICIAL ACCOUNT STATEMENT" in res.ascii_table


def test_greetings_zero_db():
    synth = synthesize_customer_response(intent="greetings", prompt="Hello Boss EVA!")
    assert synth["success"] is True
    assert synth["database_accessed"] is False
    assert "EVA" in synth["customer_response"]


def test_fastapi_agent_activities():
    response = client.get("/api/agent/activities?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["activities"], list)


def test_fastapi_source_files():
    response = client.get("/api/source_files")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["files"]) >= 5
    filenames = [f["filename"] for f in data["files"]]
    assert "prompts/intent_classification.py" in filenames
    assert "banking_orchestrator.py" in filenames
    assert "agent_vk_balance.py" in filenames
    assert "agent_ro_statement.py" in filenames


def test_batch_id_logging_and_propagation():
    test_batch = "batch_test_unit_999888"
    response = client.post(
        "/api/orchestrator/dispatch",
        json={"prompt": "check available funds for ACC-94820", "batch_id": test_batch}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["batch_id"] == test_batch
    assert data["batchId"] == test_batch
    
    # Check that audit log recorded the batch ID
    synth_resp = client.post(
        "/api/eva/synthesize",
        json={"intent": "balance_inquiry", "prompt": "check balance", "accountId": "ACC-94820", "batch_id": test_batch}
    )
    assert synth_resp.status_code == 200
    synth_data = synth_resp.json()
    assert synth_data["batch_id"] == test_batch

