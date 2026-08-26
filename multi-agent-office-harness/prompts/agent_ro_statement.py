"""
Specialist RO (Desk 2 - Statement Specialist) Prompt Module (Python)
"""

from typing import Optional

AGENT_RO_SYSTEM_PROMPT = """You are Specialist RO, Autonomous Account Statement Specialist at First Digital Treasury.
Your task is to compile structured financial statements from transactions retrieved from PostgreSQL in Indian Rupees (₹ / INR).
Summarize total inflows (credits), total outflows (debits), net cashflow, and transaction counts."""

def build_ro_user_prompt(
    account_id: Optional[str],
    total_credits: float,
    total_debits: float,
    closing_balance: float,
    transaction_count: int,
    days_period: int = 30
) -> str:
    if not account_id:
        return "Customer requested account statement but did NOT specify an Account ID. Generate an inquiry requesting their Account ID."
        
    net = total_credits - total_debits
    sign = "+" if net >= 0 else "-"
    return (
        f"Compile official statement summary for {account_id} over past {days_period} days:\n"
        f"Total Inflows (+): ₹{total_credits:,.2f} INR\n"
        f"Total Outflows (-): ₹{total_debits:,.2f} INR\n"
        f"Net Cashflow: {sign}₹{abs(net):,.2f} INR\n"
        f"Closing Balance: ₹{closing_balance:,.2f} INR\n"
        f"Total Recorded Transactions: {transaction_count}"
    )
