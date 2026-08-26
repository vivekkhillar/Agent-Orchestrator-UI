import os
import sys
import json
import unittest.mock as mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from banking_orchestrator import (
    invoke_llm_with_fallback,
    plan_orchestration,
    execute_agent_subtask,
    synthesize_customer_response,
    get_account_data,
    get_transactions_data
)

def run_gemini_verification():
    print("\n--- [1] Checking Local Database Connection ---")
    acc = get_account_data("ACC-94820")
    txns = get_transactions_data("ACC-94820")
    print(f"Local PostgreSQL account query: {acc.get('account_id')} -> {acc.get('available_balance')} INR")
    print(f"Local PostgreSQL transactions query: {len(txns)} transactions retrieved")
    assert acc is not None
    assert acc["account_id"] == "ACC-94820"

    print("\n--- [2] Simulating GEMINI_API_KEY Present ---")
    mock_plan_payload = {
        "intent": "balance_inquiry",
        "intent_confidence": 0.99,
        "intent_reasoning": "Inquiring about available funds",
        "assigned_agent": "VK",
        "extracted_account_id": "ACC-94820",
        "subtasks": [
            {
                "id": "subtask_1",
                "title": "Verify balance",
                "assignedAgentId": "agent_vk",
                "category": "python",
                "targetFile": "agent_vk_balance.py"
            }
        ]
    }

    mock_resp = mock.MagicMock()
    mock_resp.text = json.dumps(mock_plan_payload)

    with mock.patch("google.genai.Client") as mock_client_cls, \
         mock.patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKeyValid123"}):
        
        mock_instance = mock_client_cls.return_value
        mock_instance.models.generate_content.return_value = mock_resp

        # 1. Plan Orchestration
        plan = plan_orchestration("Check available balance for ACC-94820")
        print(f"Plan -> usedEngine: {plan['usedEngine']} | FallbackTriggered: {plan['fallbackTriggered']}")
        assert plan["usedEngine"] == "gemini-3.7-flash"
        assert plan["fallbackTriggered"] is False
        assert plan["intent"] == "balance_inquiry"

        # 2. Subtask Execution with Local DB & Gemini
        mock_subtask_payload = {
            "speechSummary": "Specialist VK verified available funds in PostgreSQL: ₹1,39,430.50 INR.",
            "thoughtLog": ["Querying PostgreSQL accounts table for ACC-94820", "Reconciled ledger"],
            "code": {
                "filename": "agent_vk_balance.py",
                "language": "python",
                "content": "# Python FastAPI router"
            },
            "executionOutput": "[DATABASE] SELECT * FROM accounts WHERE account_id = 'ACC-94820' -> 200 OK"
        }
        mock_subtask_resp = mock.MagicMock()
        mock_subtask_resp.text = json.dumps(mock_subtask_payload)
        mock_instance.models.generate_content.return_value = mock_subtask_resp

        subtask = plan["subtasks"][0]
        agent = {"id": "agent_vk", "name": "VK", "role": "Balance Specialist"}
        subtask_res = execute_agent_subtask(subtask, agent, prompt="Check balance for ACC-94820", account_id="ACC-94820")
        print(f"Subtask -> usedEngine: {subtask_res['usedEngine']} | FallbackTriggered: {subtask_res['fallbackTriggered']}")
        assert subtask_res["usedEngine"] == "gemini-3.7-flash"
        assert subtask_res["fallbackTriggered"] is False

        # 3. Response Synthesis with Local DB & Gemini
        mock_synth_resp = mock.MagicMock()
        mock_synth_resp.text = "Hello! Boss EVA here. Specialist VK has verified your available balance for ACC-94820 as ₹1,39,430.50 INR in the PostgreSQL treasury."
        mock_instance.models.generate_content.return_value = mock_synth_resp

        synth = synthesize_customer_response(
            intent="balance_inquiry",
            prompt="Check balance for ACC-94820",
            account_id="ACC-94820",
            subtask_results=[subtask_res]
        )
        print(f"Synthesis -> usedEngine: {synth['usedEngine']} | FallbackTriggered: {synth['fallbackTriggered']}")
        print("Customer Response Preview:", synth['customer_response'][:80].encode('ascii', 'ignore').decode())
        assert synth["usedEngine"] == "gemini-3.7-flash"
        assert synth["fallbackTriggered"] is False
        assert "₹" in synth["customer_response"]

    print("\n[SUCCESS] ALL GEMINI + LOCAL POSTGRESQL WORKFLOW TESTS PASSED!")

if __name__ == "__main__":
    run_gemini_verification()
