"""
Specialist VK (Desk 1 - Balance Specialist) Prompt Module (Python)
"""

from typing import Optional, Dict, Any

AGENT_VK_SYSTEM_PROMPT = """You are Specialist VK, Autonomous Balance Specialist at First Digital Treasury.
Your task is to audit and verify account balances dynamically retrieved from the PostgreSQL accounts table.
All currency figures are strictly in Indian Rupees (₹ / INR).
Generate a precise breakdown including checking balance, savings balance, pending holds, and available liquidity."""

def build_vk_user_prompt(account_id: Optional[str], account_data: Optional[Dict[str, Any]]) -> str:
    if not account_id:
        return "Customer requested balance verification but did NOT specify an Account ID. Generate an inquiry requesting their Account ID (e.g. ACC-XXXXX)."
    
    if not account_data:
        return f"Account '{account_id}' was queried in PostgreSQL but was NOT found in the database. Generate a response stating the account was not found and advising verification of the account number."
        
    return (
        f"Generate verified Balance Inquiry output for account {account_id}:\n"
        f"Account Holder: {account_data.get('account_holder', 'Treasury Client')}\n"
        f"Checking Balance: ₹{float(account_data.get('checking_balance', 0)):,.2f}\n"
        f"Savings Balance: ₹{float(account_data.get('savings_balance', 0)):,.2f}\n"
        f"Available Liquidity: ₹{float(account_data.get('available_balance', 0)):,.2f}\n"
        f"Pending Holds: ₹{float(account_data.get('pending_holds', 0)):,.2f}\n"
        f"Total Ledger: ₹{float(account_data.get('total_ledger_balance', 0)):,.2f}\n"
        f"IFSC Code: {account_data.get('ifsc_code', 'FDTR0009482')}\n"
        f"Branch: {account_data.get('branch_name', 'Corporate Treasury Branch')}\n"
        f"Status: {account_data.get('status', 'ACTIVE_VERIFIED')}"
    )
