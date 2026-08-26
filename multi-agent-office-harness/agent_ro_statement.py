"""
Agent RO: Dedicated Account Statement Module (FastAPI + PostgreSQL)
Author: RO (Account Statement Specialist)
Endpoint: POST /api/v1/agent/ro/statement
Currency: INR (₹ - Indian Rupees)
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import logging

router = APIRouter(prefix="/api/v1/agent/ro", tags=["Account Statement"])
logger = logging.getLogger("AgentRO")

from banking_orchestrator import get_transactions_data, get_account_data, format_inr

class StatementRequest(BaseModel):
    account_id: Optional[str] = Field(default=None, description="Target bank account number")
    accountId: Optional[str] = Field(default=None, description="CamelCase alias for account_id")
    days_period: int = Field(default=30, description="Duration of statement in days")
    format_type: str = Field(default="json_and_table", description="Output format: json, ascii, pdf")

class TransactionItem(BaseModel):
    id: str
    date: str
    description: str
    category: str
    amount: float
    type: str
    balance_after: float

class StatementResponse(BaseModel):
    statement_id: str
    account_id: str
    period: str
    currency: str = "INR"
    currency_symbol: str = "₹"
    opening_balance: float
    opening_balance_inr: str
    closing_balance: float
    closing_balance_inr: str
    total_credits: float
    total_credits_inr: str
    total_debits: float
    total_debits_inr: str
    net_change: float
    net_change_inr: str
    transaction_count: int
    transactions: List[TransactionItem]
    ascii_table: str
    generated_by: str = "Agent RO (PostgreSQL Statement Specialist)"

@router.post("/statement", response_model=StatementResponse)
async def generate_account_statement(req: StatementRequest):
    """
    RO's dedicated statement generation endpoint querying PostgreSQL transactions dynamically.
    No hardcoded values: all credits, debits, dates, balances, and descriptions are read directly from PostgreSQL.
    """
    target_id = req.account_id or req.accountId
    if not target_id:
        raise HTTPException(
            status_code=400,
            detail="Account ID is required for statement generation."
        )

    logger.info(f"RO Generating live PostgreSQL statement for account: {target_id} (Past {req.days_period} days)")
    
    transactions_raw = get_transactions_data(target_id, req.days_period)
    account = get_account_data(target_id)
    
    closing_bal = float(account.get("available_balance", 0.0)) if account else 0.0

    total_credits = 0.0
    total_debits = 0.0
    items: List[TransactionItem] = []

    for t in transactions_raw:
        amt = float(t.get("amount", 0.0))
        t_type = t.get("type", "DEBIT").upper()
        if t_type == "CREDIT" or amt > 0:
            total_credits += abs(amt)
        else:
            total_debits += abs(amt)

        items.append(TransactionItem(
            id=str(t.get("transaction_id") or t.get("id", "TXN")),
            date=str(t.get("date", "")),
            description=str(t.get("description", "")),
            category=str(t.get("category", "")),
            amount=amt,
            type=t_type,
            balance_after=float(t.get("balance_after", 0.0))
        ))

    net_change = total_credits - total_debits
    opening_bal = closing_bal - net_change
    currency_sym = "₹"

    # Format structured ASCII Statement Table
    table_lines = [
        "-------------------------------------------------------------------------------------------------------------",
        f"OFFICIAL ACCOUNT STATEMENT | ACCOUNT: {target_id} | PAST {req.days_period} DAYS",
        "-------------------------------------------------------------------------------------------------------------",
        f"DATE         TXN ID      TYPE     CATEGORY                  AMOUNT (INR)         BALANCE AFTER",
        "-------------------------------------------------------------------------------------------------------------"
    ]

    for item in items:
        sign = "+" if item.type == "CREDIT" else "-"
        amt_str = f"{sign}{format_inr(abs(item.amount))}"
        bal_str = format_inr(item.balance_after)
        table_lines.append(
            f"{item.date.ljust(12)} {item.id.ljust(11)} {item.type.ljust(8)} {item.category[:22].ljust(24)} {amt_str.rjust(18)} {bal_str.rjust(20)}"
        )

    if not items:
        table_lines.append("No transaction records found in PostgreSQL ledger for this period.")

    table_lines.append("-------------------------------------------------------------------------------------------------------------")
    table_lines.append(
        f"TOTAL CREDITS (INFLOW):  +{format_inr(total_credits)}   | TOTAL DEBITS (OUTFLOW): -{format_inr(total_debits)}"
    )
    table_lines.append(
        f"NET CASHFLOW RECONCILED: {f'+' if net_change >= 0 else '-'}{format_inr(abs(net_change))}   | CLOSING LEDGER BALANCE: {format_inr(closing_bal)}"
    )
    table_lines.append("-------------------------------------------------------------------------------------------------------------")

    ascii_rendered = "\n".join(table_lines)

    now_utc = datetime.now(timezone.utc)
    return StatementResponse(
        statement_id=f"STM-{now_utc.strftime('%Y%m%d')}-094",
        account_id=target_id,
        period=f"Last {req.days_period} Days ({now_utc.strftime('%B %Y')})",
        currency="INR",
        currency_symbol=currency_sym,
        opening_balance=round(opening_bal, 2),
        opening_balance_inr=format_inr(opening_bal),
        closing_balance=round(closing_bal, 2),
        closing_balance_inr=format_inr(closing_bal),
        total_credits=round(total_credits, 2),
        total_credits_inr=format_inr(total_credits),
        total_debits=round(total_debits, 2),
        total_debits_inr=format_inr(total_debits),
        net_change=round(net_change, 2),
        net_change_inr=f"{'+' if net_change >= 0 else '-'}{format_inr(abs(net_change))}",
        transaction_count=len(items),
        transactions=items,
        ascii_table=ascii_rendered,
        generated_by="Agent RO (PostgreSQL Statement Specialist)"
    )
