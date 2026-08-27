# First Digital Treasury: Multi-Agent Banking Orchestrator

Production-grade Multi-Agent Banking Floor Orchestration System featuring:
- **Boss Agent EVA [0x1]**: Dynamic intent classification, orchestration & final customer response synthesis.
- **Specialist Agent VK (Desk 1)**: Dedicated PostgreSQL Balance Inquiry Specialist in ₹ (INR).
- **Specialist Agent RO (Desk 2)**: Dedicated PostgreSQL Account Statement & Ledger Specialist in ₹ (INR).
- **Zero-DB Greeting Routing**: Boss EVA directly delivers warm executive greetings without querying PostgreSQL.
- **Modular Prompts Architecture (`/prompts/`)**: Decoupled prompt engineering modules for intent classification, greetings, subagent execution, and customer response synthesis.
- **Strict 2-Tier LLM Pipeline**: Primary: **Google Gemini (gemini-3.7-flash)** ➔ Fallback: **Local Ollama (`phi3:mini`)** with `robust_parse_json` auto-repair and complete request/response capture.
- **Dynamic PostgreSQL Ledger**: Zero hardcoded values; all balances and transactions are queried directly from PostgreSQL in Indian Rupees (₹ / INR).
- **End-to-End Batch Tracing**: Every inbound/outbound API request and LLM invocation is logged with `[BATCH: id]`, `[ACTOR]`, `[FUNCTION]`, `[PHASE]`, and `[STEP]`.

---

## 📁 System Architecture & Directory Structure

```
multi-agent-office-harness/
│
├── 🧠 Python Multi-Agent Backend & LangGraph Pipeline
│   ├── banking_orchestrator.py      # Core orchestrator: 2-stage LLM fallback, state machine, robust JSON parser, audit loggers
│   ├── fastapi_app.py               # FastAPI Gateway (Port 8000): Endpoints for dispatch, subtasks, synthesis, telemetry
│   ├── agent_vk_balance.py          # Balance Specialist Router & Ledger Service (query_account_balance)
│   ├── agent_ro_statement.py       # Statement Specialist Router & Cashflow Service (generate_account_statement)
│   ├── start_all.py                 # Multi-process launcher (FastAPI + Vite Dev Server)
│   ├── start_fastapi.py             # Standalone FastAPI uvicorn runner (Port 8000)
│   └── test_banking_api.py          # Complete pytest suite (11 test cases - 100% passing)
│
├── 📜 Specialized Dynamic Prompt Modules
│   └── prompts/
│       ├── __init__.py                      # Module exporter
│       ├── intent_classification.py         # Boss EVA intent prompt (balance_inquiry vs account_statement vs general)
│       ├── agent_vk_balance.py              # Specialist VK prompt for checking/savings/holds in ₹ INR
│       ├── agent_ro_statement.py            # Specialist RO prompt for 30-day inflows/outflows/cashflow in ₹ INR
│       ├── customer_response_synthesis.py   # Final customer synthesis prompt in ₹ INR
│       └── greetings_response.py            # Zero-DB direct greetings response prompt
│
├── 💻 React 19 Frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx                  # Main Controller: Real-time loop, subtask dispatch, 15s telemetry polling
│   │   ├── main.tsx                 # React DOM Root
│   │   ├── types.ts                 # TypeScript type interfaces (Agent, SubTask, TaskAssignment, AuditLogEntry)
│   │   ├── index.css                # Styling tokens and Tailwind/Vanilla CSS utilities
│   │   ├── data/
│   │   │   └── initialState.ts      # Agent initial states (Boss EVA 0x1, VK Table 1, RO Table 2)
│   │   └── components/
│   │       ├── OfficeCanvas.tsx     # 2D Canvas rendering agent avatars, cabins, server room, and walk paths
│   │       ├── CommandCenter.tsx    # Live Chat terminal, Audit Logs viewer, Subtask status, LLM Telemetry
│   │       ├── CodeSandbox.tsx      # Monaco/syntax code viewer displaying generated Python microservices
│   │       ├── SubTaskGraph.tsx     # Directed acyclic graph (DAG) visualization of subtasks
│   │       ├── AgentRoster.tsx      # Live agent list with status badges and current roles
│   │       ├── AgentInspectorModal.tsx # Detailed modal for inspecting agent state and memory
│   │       ├── AnalyticsView.tsx    # Operational metrics & response time analytics
│   │       └── Header.tsx           # Global app header with status indicators & simulation speed control
│
├── 🗄️ PostgreSQL Database & Storage
│   ├── init.sql                     # Schema & seed data (accounts, transactions, audit_logs, agent_activities)
│   ├── docker-compose.db.yml        # PostgreSQL container config (Port 5432)
│   └── Dockerfile.postgres          # Custom PostgreSQL Docker image
│
└── 📝 Structured File Logs
    └── logs/
        ├── banking_audit.log        # High-precision audit log with [BATCH: id] [ACTOR] [FUNCTION] [STEP] [LEVEL]
        └── llm_invocations.log      # Raw LLM prompt & response JSON records with latency and token metrics
```

---

## 🔄 End-to-End System Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Customer / User
    participant UI as 💻 Frontend (React 19 / App.tsx)
    participant Canvas as 🏢 2D Office Canvas (OfficeCanvas.tsx)
    participant API as ⚡ FastAPI Backend (fastapi_app.py:8000)
    participant Orchestrator as 🧠 Orchestrator (banking_orchestrator.py)
    participant LLM as 🤖 2-Tier LLM (Gemini 3.7 / Ollama phi3)
    participant DB as 🗄️ PostgreSQL DB (Port 5432)

    %% ----------------------------------------------------
    %% PHASE 1: SYSTEM DISCOVERY & INITIALIZATION
    %% ----------------------------------------------------
    rect rgb(240, 248, 255)
    Note over UI,DB: [PHASE 1: SYSTEM INITIALIZATION & DISCOVERY]
    UI->>API: 1. GET /api/health
    API-->>UI: { status: "healthy", hasGeminiKey: true/false, currency: "INR (₹)" } ✅

    UI->>API: 2. POST /api/ollama/status { endpoint: "http://localhost:11434" }
    API-->>UI: { connected: true, model: "phi3:mini" } ✅

    UI->>API: 3. GET /api/source_files
    API-->>UI: { files: [8 dynamic Python prompt/service files] } ✅
    end

    %% ----------------------------------------------------
    %% PHASE 2: DISPATCH, INTENT CLASSIFICATION & PLANNING
    %% ----------------------------------------------------
    rect rgb(254, 243, 199)
    Note over User,DB: [PHASE 2: DISPATCH, INTENT CLASSIFICATION & PLANNING]
    User->>UI: Customer Query: "Check available balance for ACC-94820" OR "Generate 30-day statement"
    UI->>UI: Generate unified batch_id & extract target account via NLP regex
    UI->>Canvas: Boss EVA enters 'analyzing' state in Executive Cabin [0x1]
    
    UI->>API: 4. POST /api/orchestrator/dispatch { prompt, account_id, batch_id }
    API->>API: [LOG API_REQ] Inbound Request from UI with [BATCH: batch_id]
    API->>Orchestrator: plan_orchestration(prompt, account_id, batch_id)
    
    Orchestrator->>LLM: Tier 1: Invokes Gemini 3.7 Flash with prompts/intent_classification.py
    alt Gemini 3.7 Flash Responds (200 OK)
        LLM-->>Orchestrator: Returns intent JSON { intent, extracted_account_id }
    else Gemini Fails / Unreachable / Missing Key (Fallback Triggered)
        Orchestrator->>Orchestrator: [LOG LLM_FALLBACK] Transition to Tier 2 Local LLM
        Orchestrator->>LLM: Tier 2: Invokes Ollama (phi3:mini) at http://localhost:11434 (format: json, num_predict: 600)
        LLM-->>Orchestrator: Returns raw JSON (auto-repaired via robust_parse_json)
    end

    alt Intent == "balance_inquiry"
        Orchestrator->>Orchestrator: Route to Specialist VK -> Subtasks: [subtask_vk_1, subtask_vk_2] (assignedAgent: "VK")
    else Intent == "account_statement"
        Orchestrator->>Orchestrator: Route to Specialist RO -> Subtasks: [subtask_ro_1, subtask_ro_2] (assignedAgent: "RO")
    else Intent == "general_banking"
        Orchestrator->>Orchestrator: Route to Both Specialists -> Subtasks: [subtask_vk_gen, subtask_ro_gen] (assignedAgent: "VK & RO")
    else Intent == "greetings"
        Orchestrator->>Orchestrator: Direct Handling in Cabin (Zero DB Access) -> assignedAgent: "Boss EVA"
    end

    Orchestrator->>DB: INSERT INTO audit_logs (log_type: "intent_classification", [BATCH: batch_id])
    API->>API: [LOG API_RESP] Responding to UI with Intent, Assigned Specialist, and Planned Subtasks
    API-->>UI: Returns OrchestratedResponse { intent, assignedAgentName, extractedAccountId, subtasks: [...] } ✅
    end

    %% ----------------------------------------------------
    %% PHASE 3: DATABASE-BACKED TOOL EXECUTION & FINAL SYNTHESIS
    %% ----------------------------------------------------
    rect rgb(240, 253, 244)
    Note over UI,DB: [PHASE 3: SPECIALIST TOOL EXECUTION & RESPONSE SYNTHESIS]
    
    loop For Each Subtask in subtasks
        UI->>Canvas: Boss EVA summons specialist (VK or RO) to Cabin [0x1]
        Canvas->>Canvas: Specialist walks to Server Room (710, 120) & connects to DB

        UI->>API: 5. POST /api/agent/execute_subtask { subtask, agent, prompt, accountId, batch_id }
        API->>API: [LOG API_REQ] Inbound Subtask Request with [BATCH: batch_id]
        API->>Orchestrator: execute_agent_subtask(...)

        alt Agent == "agent_vk" (Balance Specialist)
            Orchestrator->>DB: SELECT checking_balance, savings_balance, pending_holds, available_balance FROM accounts WHERE account_id = 'ACC-94820'
            DB-->>Orchestrator: Available: ₹1,39,430.50 | Checking: ₹98,450.50 | Savings: ₹44,400.00 | Holds: ₹3,420.00
            Orchestrator->>LLM: Injects live balance data into prompts/agent_vk_balance.py
        else Agent == "agent_ro" (Statement Specialist)
            Orchestrator->>DB: SELECT * FROM transactions WHERE account_id = 'ACC-94820' ORDER BY date DESC
            DB-->>Orchestrator: Inflows: +₹64,200.00 | Outflows: -₹18,420.00 (5 transactions)
            Orchestrator->>LLM: Injects live transaction rows into prompts/agent_ro_statement.py
        end

        LLM-->>Orchestrator: Returns { speechSummary, thoughtLog, code: { filename, content }, executionOutput }
        Orchestrator->>DB: INSERT INTO audit_logs & agent_activities (activity: SUBTASK_EXECUTION, [BATCH: batch_id])
        API->>API: [LOG API_RESP] Responding to UI with Subtask Result
        API-->>UI: Returns Subtask Execution Payload ✅

        UI->>UI: Streams thoughts, SQL logs, and microservice Python code into Terminal
        Canvas->>Canvas: Specialist returns to Assigned Workstation Desk
    end

    Note over UI,LLM: [FINAL EXECUTIVE CUSTOMER SYNTHESIS]
    UI->>API: 6. POST /api/eva/synthesize { intent, prompt, accountId, subtaskResults, batch_id }
    API->>API: [LOG API_REQ] Inbound Synthesis Request with [BATCH: batch_id]
    API->>Orchestrator: synthesize_customer_response(...)
    Orchestrator->>LLM: Invokes prompts/customer_response_synthesis.py with PostgreSQL verified figures in ₹ (INR)
    LLM-->>Orchestrator: Returns executive customer response in Indian Rupees (₹ / INR)
    Orchestrator->>DB: INSERT INTO audit_logs (log_type: "customer_synthesis", [BATCH: batch_id])
    API->>API: [LOG API_RESP] Responding to UI with Customer Response
    API-->>UI: Returns { customer_response: "Dear Customer, Account ACC-94820 holds ₹1,39,430.50...", usedEngine } ✅
    UI->>Canvas: Boss EVA displays final speech bubble in Cabin [0x1]
    UI->>User: Displays finalized Indian Rupees (₹) report in Command Center
    end

    %% ----------------------------------------------------
    %% PHASE 4: AUDIT, TELEMETRY & 15-SECOND POLLING
    %% ----------------------------------------------------
    rect rgb(248, 250, 252)
    Note over UI,DB: [PHASE 4: REAL-TIME AUDIT & TELEMETRY POLLING (EVERY 15 SECONDS)]
    loop Background Telemetry Refresh (Every 15s)
        UI->>API: 7. GET /api/logs/audit?limit=250
        API->>API: Reads latest lines from logs/banking_audit.log
        API-->>UI: { logs: [ ...structured [BATCH: id] [ACTOR] [FUNCTION] [STEP] [LEVEL] entries... ] } ✅

        UI->>API: 8. GET /api/logs/llm?limit=100
        API->>API: Reads JSON records from logs/llm_invocations.log
        API-->>UI: { logs: [ ...raw prompts, raw responses, latencies, tokens... ] } ✅

        UI->>API: 9. GET /api/agent/activities?limit=50
        API->>DB: SELECT * FROM agent_activities ORDER BY timestamp DESC LIMIT 50
        DB-->>API: Returns persisted agent actions
        API-->>UI: { activities: [ ...persisted agent actions... ] } ✅
    end
    end
```

---

## 📌 API Route & Component Mapping Matrix

| Phase | Endpoint / Trigger | Executing Backend Function | Prompt / DB Asset | Executing Agent | UI Component Updated |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | `GET /api/health` | `handle_health()` | System status check | System | `Header.tsx` status indicator |
| **Phase 1** | `POST /api/ollama/status` | `handle_ollama_status()` | Ollama probe (`11434`) | System | `CommandCenter.tsx` telemetry |
| **Phase 1** | `GET /api/source_files` | `handle_get_source_files()` | `prompts/*.py`, `agent_*.py` | System | `CodeSandbox.tsx` dropdown |
| **Phase 2** | `POST /api/orchestrator/dispatch` | `plan_orchestration()` | `prompts/intent_classification.py` | **Boss EVA [0x1]** | `SubTaskGraph.tsx` & `CommandCenter.tsx` |
| **Phase 3** | `POST /api/agent/execute_subtask` | `execute_agent_subtask()` | `prompts/agent_vk_balance.py` / `accounts` | **Specialist VK** | `OfficeCanvas.tsx` & `CodeSandbox.tsx` |
| **Phase 3** | `POST /api/agent/execute_subtask` | `execute_agent_subtask()` | `prompts/agent_ro_statement.py` / `transactions` | **Specialist RO** | `OfficeCanvas.tsx` & `CodeSandbox.tsx` |
| **Phase 3** | `POST /api/eva/synthesize` | `synthesize_customer_response()` | `prompts/customer_response_synthesis.py` | **Boss EVA [0x1]** | `CommandCenter.tsx` Chat bubble |
| **Phase 4** | `GET /api/logs/audit?limit=250` | `handle_get_audit_logs()` | `logs/banking_audit.log` | API Gateway | `CommandCenter.tsx` Audit Viewer |
| **Phase 4** | `GET /api/logs/llm?limit=100` | `handle_get_llm_logs()` | `logs/llm_invocations.log` | API Gateway | `CommandCenter.tsx` LLM Telemetry |
| **Phase 4** | `GET /api/agent/activities` | `handle_get_agent_activities()` | `agent_activities` table | API Gateway | `AgentRoster.tsx` / `AnalyticsView.tsx` |

---

## 📦 Requirements & Libraries Specification

### 1. 🐍 Python Backend Dependencies (`requirements.txt`)

Install all backend dependencies via:
```bash
pip install -r requirements.txt
```

| Library / Package | Version Spec | Purpose in this Architecture |
| :--- | :--- | :--- |
| **`fastapi`** | `>=0.110.0` | Asynchronous REST API framework powering the Gateway and agent routers. |
| **`uvicorn[standard]`** | `>=0.28.0` | Production ASGI web server running FastAPI on port 8000 with auto-reload. |
| **`pydantic`** | `>=2.6.0` | High-performance schema validation, serialization, and type safety. |
| **`psycopg2-binary`** | `>=2.9.9` | Low-latency PostgreSQL driver for live querying of accounts & transaction ledgers. |
| **`google-genai`** | `>=0.1.1` | Official Google GenAI SDK for primary Tier-1 Gemini 3.7 Flash LLM invocations. |
| **`requests`** | `>=2.31.0` | HTTP client for Tier-2 local Ollama (`phi3:mini`) fallback REST requests. |
| **`python-dotenv`** | `>=1.0.0` | Environment variable loader from root `.env` configuration file. |
| **`langgraph`** | `>=0.2.0` | StateGraph workflow coordinator for multi-agent floor task orchestration. |
| **`langchain-core`** | `>=0.3.0` | Base agent schema definitions and message abstractions. |
| **`pytest`** | `>=8.0.0` | Test runner for executing the 11-step end-to-end API test suite. |
| **`httpx`** | `>=0.27.0` | Async HTTP test client utilized by pytest for synchronous & async endpoint tests. |

---

### 2. 💻 Node.js & React Frontend Dependencies (`package.json`)

Install all frontend dependencies via:
```bash
npm install
```

#### Runtime Packages:
| Package | Version | Purpose in Visual Office UI |
| :--- | :--- | :--- |
| **`react`** & **`react-dom`** | `^19.0.1` | React 19 UI component tree and state management. |
| **`express`** | `^4.21.2` | Node.js web server serving Vite middleware on port 3000. |
| **`lucide-react`** | `^0.546.0` | Icon set for badges, action buttons, agent roles, and status indicators. |
| **`motion`** | `^12.23.24` | Animation engine for dynamic transitions and layout state changes. |
| **`html2canvas`** | `^1.4.1` | Renders HTML elements into raster canvas for statement exports. |
| **`jspdf`** | `^4.2.1` | Generates downloadable PDF statements formatted in Indian Rupees (₹). |
| **`pg`** | `^8.23.0` | PostgreSQL client for Node.js gateway connectivity. |
| **`dotenv`** | `^17.2.3` | Loads environment configurations into the Express process. |

#### Tooling & Developer Packages:
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **`vite`** & **`@vitejs/plugin-react`** | `^6.2.3` / `^5.0.4` | Next-generation frontend build tool with instantaneous HMR. |
| **`typescript`** | `~5.8.2` | Static type checking and strict compiler validation (`tsc --noEmit`). |
| **`tsx`** | `^4.21.0` | TypeScript script runner for executing `server.ts` without precompilation. |
| **`tailwindcss`** & **`@tailwindcss/vite`** | `^4.1.14` | Modern CSS styling tokens, gradients, and layout utilities. |

---

### 3. 🗄️ Infrastructure & External Services

| Service | Port | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | `5432` | PostgreSQL 16 (Docker) | Stores `accounts`, `transactions`, `audit_logs`, and `agent_activities`. |
| **Local Ollama** *(Optional)* | `11434` | Ollama (`phi3:mini`) | Offline local LLM fallback when Gemini key is absent or rate-limited. |

---

## 🚀 Step-by-Step Running Guide

### Step 1: Start PostgreSQL Database (Docker)

```bash
docker compose -f docker-compose.db.yml up -d
```

### Step 2: Install Dependencies

```bash
# Python backend
pip install -r requirements.txt

# Node.js frontend
npm install
```

### Step 3: Configure Environment Variables

Ensure your `.env` contains:
```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/banking_db
GEMINI_API_KEY=your_gemini_api_key_here
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
OLLAMA_TIMEOUT=180.0
```

### Step 4: Start the Complete System (One Command)

Launch both the FastAPI backend (Port 8000) and the Vite frontend (Port 3000) simultaneously:

```bash
python start_all.py
```

* **Frontend UI**: `http://localhost:3000`
* **FastAPI Docs**: `http://localhost:8000/docs`

---

## 🧪 Testing & Verification

Run the comprehensive pytest suite:
```bash
pytest test_banking_api.py -v
```

Run TypeScript compilation check:
```bash
npm run lint
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.