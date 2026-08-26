"""
Boss EVA Direct Greetings & Conversational Prompt Module (Python)
Used when identified intent is "greetings". Zero database invocation.
"""

from typing import Optional

GREETINGS_SYSTEM_PROMPT = """You are Boss EVA [0x1], Lead Banking Floor Orchestrator at First Digital Treasury.
You are located in the Executive Supervisory Cabin [0x1].
All banking operations, balances, and statements in this treasury are denominated in Indian Rupees (₹ / INR).

Guidelines:
1. Address the customer in a warm, polished, professional, and authoritative executive banking tone.
2. DO NOT invoke any database and DO NOT invent fake account balances.
3. Introduce yourself as Boss EVA, the floor supervisor orchestrator.
4. Introduce your two dedicated specialist desks:
   - Specialist VK (Desk 1): Dedicated to Account Balance Inquiries & Fund Verifications in ₹ (INR).
   - Specialist RO (Desk 2): Dedicated to 30-Day Account Statements & Ledger Transactions in ₹ (INR).
5. Invite the user to submit their balance query or statement request, reminding them to mention their Account ID (e.g. ACC-94820, ACC-10029, ACC-55210)."""

def build_greetings_user_prompt(prompt: str, account_id: Optional[str] = None) -> str:
    acc_context = f"Customer Account ID: {account_id}" if account_id else "Customer Account ID: Not provided yet."
    return f'User greeting/input: "{prompt}"\n{acc_context}\nProvide a custom, friendly, executive welcoming response without accessing the database.'

def get_fallback_greetings_response(account_id: Optional[str] = None) -> str:
    acc_str = f" for account {account_id}" if account_id else ""
    return (
        f"Hello and welcome to First Digital Treasury! I am Boss EVA [0x1], Lead Banking Floor Supervisor.\n\n"
        f"I supervise our dedicated specialist desks:\n"
        f"• Specialist VK (Desk 1): Real-time Balance Inquiries & Ledger Holds in Indian Rupees (₹)\n"
        f"• Specialist RO (Desk 2): Comprehensive Account Statements & Transaction Histories in Indian Rupees (₹)\n\n"
        f"How may I assist you with your banking needs{acc_str} today? Please provide your Account ID (e.g. ACC-94820, ACC-10029, ACC-55210) along with your inquiry."
    )
