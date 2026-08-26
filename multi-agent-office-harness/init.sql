-- ====================================================================
-- First Digital Treasury - PostgreSQL Docker Initialization Script
-- Database: banking_db
-- Currency: INR (₹ - Indian Rupees)
-- ====================================================================

-- 1. Create Schema and Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if rebuilding
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS intent_classifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- 3. ACCOUNTS TABLE
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(32) UNIQUE NOT NULL,
    account_holder VARCHAR(128) NOT NULL,
    account_type VARCHAR(64) NOT NULL DEFAULT 'PRIMARY_TREASURY',
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
    checking_balance NUMERIC(15, 2) NOT NULL DEFAULT 98450.50,
    savings_balance NUMERIC(15, 2) NOT NULL DEFAULT 44400.00,
    available_balance NUMERIC(15, 2) GENERATED ALWAYS AS (checking_balance + savings_balance - pending_holds) STORED,
    total_ledger_balance NUMERIC(15, 2) GENERATED ALWAYS AS (checking_balance + savings_balance) STORED,
    pending_holds NUMERIC(15, 2) NOT NULL DEFAULT 3420.00,
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 500000.00,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE_VERIFIED',
    ifsc_code VARCHAR(16) NOT NULL DEFAULT 'FDTR0009482',
    branch_name VARCHAR(64) NOT NULL DEFAULT 'Mumbai Corporate Treasury Branch',
    last_reconciled TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(32) UNIQUE NOT NULL,
    account_id VARCHAR(32) NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    type VARCHAR(16) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    amount NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
    reference_no VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. INTENT CLASSIFICATIONS TABLE (Records all LLM-classified queries)
CREATE TABLE intent_classifications (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    classified_intent VARCHAR(64) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.98,
    llm_reasoning TEXT,
    assigned_agent VARCHAR(64) NOT NULL,
    llm_model VARCHAR(64) NOT NULL DEFAULT 'gemini-3.7-flash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AUDIT LOGS TABLE (Comprehensive execution and movement logger)
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    agent_id VARCHAR(32) NOT NULL,
    agent_name VARCHAR(64) NOT NULL,
    agent_role VARCHAR(32) NOT NULL,
    log_type VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. SEED INITIAL ACCOUNTS DATA (INR Currency ₹)
INSERT INTO accounts (
    account_id, 
    account_holder, 
    account_type, 
    currency, 
    currency_symbol, 
    checking_balance, 
    savings_balance, 
    pending_holds, 
    credit_limit, 
    status,
    ifsc_code,
    branch_name
) VALUES 
(
    'ACC-94820', 
    'First Digital Treasury & Operating Corp', 
    'CORPORATE_TREASURY', 
    'INR', 
    '₹', 
    98450.50, 
    44400.00, 
    3420.00, 
    500000.00, 
    'ACTIVE_VERIFIED',
    'FDTR0009482',
    'Mumbai Corporate Treasury Branch'
),
(
    'ACC-10029', 
    'Global Multi-Currency Operating Account', 
    'GLOBAL_COMMERCIAL', 
    'INR', 
    '₹', 
    245000.00, 
    180000.00, 
    12500.00, 
    1000000.00, 
    'ACTIVE_VERIFIED',
    'FDTR0001002',
    'Bengaluru FinTech Center'
),
(
    'ACC-55210', 
    'Vivek Khillar - Premium Personal Reserve', 
    'PRIVATE_WEALTH', 
    'INR', 
    '₹', 
    542300.00, 
    850000.00, 
    5000.00, 
    2000000.00, 
    'ACTIVE_VERIFIED',
    'FDTR0005521',
    'New Delhi Executive Lounge'
);

-- 8. SEED INITIAL TRANSACTIONS (INR Currency ₹)
INSERT INTO transactions (
    transaction_id, 
    account_id, 
    date, 
    description, 
    category, 
    type, 
    amount, 
    balance_after, 
    currency, 
    currency_symbol, 
    reference_no
) VALUES 
('TXN_1091', 'ACC-94820', CURRENT_DATE - INTERVAL '1 day', 'RAZORPAY MERCHANT SETTLEMENT INFLOW', 'Revenue / Merchant', 'CREDIT', 42500.00, 139430.50, 'INR', '₹', 'UPI-REF-908123841'),
('TXN_1090', 'ACC-94820', CURRENT_DATE - INTERVAL '3 days', 'CLOUD SERVER INFRASTRUCTURE & AWS SERVICES', 'Cloud Infrastructure', 'DEBIT', -4820.00, 96930.50, 'INR', '₹', 'NEFT-AWS-0091823'),
('TXN_1089', 'ACC-94820', CURRENT_DATE - INTERVAL '5 days', 'MONTHLY PAYROLL DIRECT DEPOSIT - TECH STAFF', 'Payroll & Staff', 'DEBIT', -12400.00, 101750.50, 'INR', '₹', 'IMPS-PAY-4410294'),
('TXN_1088', 'ACC-94820', CURRENT_DATE - INTERVAL '9 days', 'ENTERPRISE CLIENT CONTRACT ADVANCE (WIRE)', 'Revenue / Contracts', 'CREDIT', 21700.00, 114150.50, 'INR', '₹', 'RTGS-CLIENT-88192'),
('TXN_1087', 'ACC-94820', CURRENT_DATE - INTERVAL '14 days', 'DEVELOPER TOOLS & AI API SUBSCRIPTION', 'Software Subscriptions', 'DEBIT', -1200.00, 92450.50, 'INR', '₹', 'CARD-SUB-1120938');

-- 9. CREATE INDEXES FOR FAST RETRIEVAL
CREATE INDEX idx_accounts_account_id ON accounts(account_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_intent_classifications_timestamp ON intent_classifications(created_at DESC);

-- Output status
SELECT 'PostgreSQL Banking Database successfully initialized with INR (₹) schema.' AS status;
