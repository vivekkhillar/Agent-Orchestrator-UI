"""
Customer Response Synthesis Prompt Module (Python)
Used by Boss EVA after specialist agents query PostgreSQL database.
"""

import json
from typing import Dict, Any, Optional, List

CUSTOMER_SYNTHESIS_SYSTEM_PROMPT = """You are Boss EVA [0x1], Lead Banking Orchestrator at First Digital Treasury.
Your task is to synthesize the verified data retrieved from the PostgreSQL database by your specialist agents (VK for Balance, RO for Statement) into a clear, elegant, and executive response for the customer.

Core Mandates:
1. ALWAYS format every single currency amount strictly in Indian Rupees (₹ / INR). NEVER use dollar signs.
2. If an account was not found in the database, clearly explain that account identifier was not located in the treasury records, and ask the user to verify their Account ID.
3. Clearly distinguish between Available Liquidity, Checking Balance, Savings Balance, and Pending Holds for Balance Inquiries.
4. Clearly summarize Total Inflows (Credits), Total Outflows (Debits), Net Cashflow, and Transaction Count for Account Statements.
5. Maintain a highly reassuring, precise, and authoritative executive banking tone.
6. Emphasize that all numbers are verified against the core PostgreSQL ledger."""

def build_synthesis_user_prompt(
    user_query: str,
    intent: str,
    account_id: Optional[str] = None,
    specialist_output: Optional[Dict[str, Any]] = None,
    account_data: Optional[Dict[str, Any]] = None,
    transactions_data: Optional[List[Dict[str, Any]]] = None
) -> str:
    parts = [
        f'Customer Original Query: "{user_query}"',
        f'Identified Intent: {intent}',
        f'Target Account ID: {account_id or "Not Provided"}\n'
    ]

    if account_data and account_data.get("account_id"):
        parts.append(
            f"[Live PostgreSQL Account Ledger]:\n"
            f"- Account ID: {account_data.get('account_id')}\n"
            f"- Account Holder: {account_data.get('account_holder', 'Verified Account Holder')}\n"
            f"- Available Balance: ₹{float(account_data.get('available_balance', 0)):,.2f} INR\n"
            f"- Checking Balance: ₹{float(account_data.get('checking_balance', 0)):,.2f} INR\n"
            f"- Savings Balance: ₹{float(account_data.get('savings_balance', 0)):,.2f} INR\n"
            f"- Pending Holds: ₹{float(account_data.get('pending_holds', 0)):,.2f} INR\n"
            f"- Total Ledger: ₹{float(account_data.get('total_ledger_balance', 0)):,.2f} INR\n"
            f"- IFSC Code: {account_data.get('ifsc_code', 'FDTR0009482')}\n"
            f"- Branch: {account_data.get('branch_name', 'Corporate Treasury')}\n"
            f"- Status: {account_data.get('status', 'ACTIVE_VERIFIED')}"
        )
    elif account_id:
        parts.append(f"[PostgreSQL Status]: Account '{account_id}' was queried but NOT FOUND in the database.")
    else:
        parts.append("[PostgreSQL Status]: No Account ID was provided in the customer prompt.")

    if transactions_data is not None:
        credits = sum(float(t["amount"]) for t in transactions_data if t.get("type") == "CREDIT" or float(t["amount"]) > 0)
        debits = sum(abs(float(t["amount"])) for t in transactions_data if t.get("type") == "DEBIT" or float(t["amount"]) < 0)
        net = credits - debits
        parts.append(
            f"\n[Live PostgreSQL Transactions Ledger]:\n"
            f"- Total Inflows (Credits): +₹{credits:,.2f} INR\n"
            f"- Total Outflows (Debits): -₹{debits:,.2f} INR\n"
            f"- Net Cashflow: {'+' if net >= 0 else '-'}₹{abs(net):,.2f} INR\n"
            f"- Total Transactions Retrieved: {len(transactions_data)}"
        )

    if specialist_output:
        sub_results = specialist_output.get("subtaskResults") or []
        if isinstance(sub_results, list) and sub_results:
            summaries = []
            for idx, st in enumerate(sub_results):
                if isinstance(st, dict):
                    speech = st.get("speechSummary") or st.get("executionOutput") or ""
                    if speech:
                        summaries.append(f"- Specialist Finding {idx+1}: {speech.strip()}")
            if summaries:
                parts.append(f"\n[Specialist Sub-Agent Verified Findings]:\n" + "\n".join(summaries))

    parts.append("\nPlease synthesize a concise, authoritative executive banking response in Indian Rupees (₹ / INR). Keep the response under 150 words.")
    return "\n".join(parts)
