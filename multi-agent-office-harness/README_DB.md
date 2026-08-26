# 🏛️ Multi-Agent Banking Orchestrator: Database, Backend & Frontend Infrastructure Guide

Comprehensive documentation for running the PostgreSQL database, Python FastAPI microservices, and Node.js/Express Vite frontend hosting environment, complete with package-by-package breakdowns and the end-to-end system workflow.

---

## 📑 Table of Contents
1. [PostgreSQL Database Service Setup](#1-postgresql-database-service-setup)
2. [Python Virtual Environment & Package Breakdown](#2-python-virtual-environment--package-breakdown)
3. [Node.js & Express / Vite Package Breakdown](#3-nodejs--express--vite-package-breakdown)
4. [Complete End-to-End System Workflow (Mermaid)](#4-complete-end-to-end-system-workflow)
5. [Unified Startup & Hosting Commands](#5-unified-startup--hosting-commands)

---

## 1. PostgreSQL Database Service Setup

The database runs in a Docker container pre-seeded with Indian Rupee (`₹` / INR) bank accounts, 30-day transaction ledgers, intent classifications, and audit logs.

### Option A: Using Docker Compose (Recommended)
```bash
docker compose -f docker-compose.db.yml up -d
```

### Option B: Using Docker CLI Directly
```bash
# 1. Build the PostgreSQL image with init.sql pre-loaded
docker build -t banking-postgres -f Dockerfile.postgres .

# 2. Run the container on port 5432
docker run -d --name banking_postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgrespassword banking-postgres
```

### Database Credentials & Connection Details
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/banking_db"
```
* **Host:** `localhost` (or `postgres` inside Docker networks)
* **Port:** `5432`
* **Username:** `postgres`
* **Password:** `postgrespassword`
* **Database Name:** `banking_db`
* **Schema Initialization:** [`init.sql`](init.sql) runs automatically on container initialization, creating the `accounts`, `transactions`, `intent_classifications`, `audit_logs`, and `agent_activities` tables.

---

## 2. Python Virtual Environment & Package Breakdown

The backend service runs on **Python 3.10+ (tested on Python 3.12/3.14)** and executes the LangGraph state machine, 2-Tier LLM pipeline, and agent routers.

### Installation
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\Activate.ps1   # Windows PowerShell
# or: source venv/bin/activate  # macOS / Linux

# Install all dependencies
pip install -r requirements.txt
```

### Package-by-Package Breakdown

| Package | Version | Purpose & Technical Role |
| :--- | :--- | :--- |
| **`fastapi`** | `>=0.110.0` | **Core API Framework:** High-performance async ASGI web framework providing OpenAPI documentation (`/docs`), Pydantic validation, and REST routes (`/api/orchestrator/dispatch`, `/api/agent/execute_subtask`, `/api/eva/synthesize`). |
| **`uvicorn[standard]`** | `>=0.28.0` | **ASGI Web Server:** High-speed server implementation running FastAPI on `http://127.0.0.1:8000` with auto-reload, WebSocket, and HTTP/1.1 event loop support. |
| **`pydantic`** | `>=2.6.0` | **Data Validation & Schemas:** Enforces strict request/response data contracts, input type safety, and automatic JSON serialization/deserialization for orchestrator payloads. |
| **`psycopg2-binary`** | `>=2.9.9` | **PostgreSQL Client Adapter:** Standalone binary driver for executing parameter-safe SQL queries, managing database connections, and retrieving live account balances and ledgers. |
| **`requests`** | `>=2.31.0` | **HTTP Client for LLMs:** Synchronous HTTP library for communicating with local Ollama (`http://localhost:11434/api/generate`) during fallback inference and health verification. |
| **`google-genai`** | `>=0.1.1` | **Primary LLM SDK:** Official Google GenAI SDK for Gemini 3.7 Flash intent classification, structured prompt engineering, and response synthesis. |
| **`python-dotenv`** | `>=1.0.0` | **Environment Management:** Reads configuration parameters (`GEMINI_API_KEY`, `DATABASE_URL`, `OLLAMA_TIMEOUT`) from `.env` directly into Python `os.environ`. |
| **`langgraph`** | `>=0.2.0` | **Multi-Agent State Machine:** Cyclic graph framework managing agent transitions: `Supervisor Marcus Chen / EVA (Cabin 0x1)` $\rightarrow$ `Specialist VK (Balance)` $\rightarrow$ `Specialist RO (Statement)` $\rightarrow$ `Response Synthesizer`. |
| **`langchain-core`** | `>=0.3.0` | **Agent Node Base Layer:** Underlying messaging schemas, system prompts, and node execution abstractions utilized by LangGraph. |
| **`pytest`** | *Optional (Dev)* | **Automated Testing Suite:** Executes unit and integration tests (`test_banking_api.py`) verifying account regex parsing, zero DB access for greetings, and INR ledger calculations. |

---

## 3. Node.js & Express / Vite Package Breakdown

The frontend is built with **React 19, TypeScript 5.8, TailwindCSS 4, and Vite 6**, hosted via an **Express Gateway** on `http://localhost:3000`.

### Installation
```bash
# Install Node dependencies
npm install
```

### Package-by-Package Breakdown

#### Runtime Dependencies (`dependencies`)
| Package | Version | Purpose & Technical Role |
| :--- | :--- | :--- |
| **`react`** | `^19.0.1` | **UI Core Library:** Powers the reactive user interface, 2D floor canvas state, live agent coordinates, subtask graph, and terminal telemetry views. |
| **`react-dom`** | `^19.0.1` | **DOM Renderer:** Mounts the React component hierarchy to the web browser DOM. |
| **`vite`** | `^6.2.3` | **Frontend Bundler & Dev Server:** Next-generation frontend build tool providing sub-millisecond Hot Module Replacement (HMR) and optimized ES module bundling. |
| **`express`** | `^4.21.2` | **Hosting Web Server (`server.ts`):** Lightweight HTTP server that hosts the web app on `http://localhost:3000` and reverse-proxies API calls to the FastAPI backend. |
| **`@google/genai`** | `^2.4.0` | **Client-Side Google GenAI SDK:** Provides direct model access and token verification capabilities. |
| **`tailwindcss`** | `^4.1.14` | **CSS Framework:** Utility-first CSS framework styling the retro terminal, dark green banking aesthetics, and responsive layout. |
| **`@tailwindcss/vite`** | `^4.1.14` | **Tailwind Vite Plugin:** Native Vite integration for TailwindCSS v4 with fast on-demand CSS compilation. |
| **`lucide-react`** | `^0.546.0` | **Iconography:** Scalable SVG icons for floor agents, server rooms, terminal tabs, telemetry badges, and playback controls. |
| **`motion`** | `^12.23.24` | **Animation Engine:** Declarative micro-animations, modal fades, and smooth transition pipelines for workspace components. |
| **`jspdf`** | `^4.2.1` | **PDF Generation:** Programmatically generates the formal `Architecture_Specification.pdf` document. |
| **`pg`** | `^8.23.0` | **Node PostgreSQL Client:** Native Node.js driver for direct database telemetry querying. |
| **`dotenv`** | `^17.2.3` | **Node Env Loader:** Reads `.env` configuration keys into Node.js `process.env`. |

#### Development & Build Dependencies (`devDependencies`)
| Package | Version | Purpose & Technical Role |
| :--- | :--- | :--- |
| **`typescript`** | `~5.8.2` | **Static Type Checker:** Enforces compile-time type safety across all React components, agent models, and API interfaces (`npm run lint`). |
| **`tsx`** | `^4.21.0` | **TypeScript Node Runner:** Executes `server.ts` directly with zero build step required during development (`npm run dev`). |
| **`esbuild`** | `^0.25.0` | **Production JS Bundler:** Extremely fast JavaScript/TypeScript compiler used in the `npm run build` production script. |
| **`@types/express`** | `^4.17.21` | **Type Definitions:** TypeScript type declarations for Express request, response, and middleware handlers. |
| **`@types/node`** | `^22.14.0` | **Node Types:** Type declarations for Node.js runtime globals, file system (`fs`), and process APIs. |
| **`@types/pg`** | `^8.23.1` | **Postgres Types:** Type definitions for PostgreSQL pool clients and query results. |

---

## 4. Complete End-to-End System Workflow

The diagram below illustrates the exact request lifecycle from the customer prompt on the browser UI, through the FastAPI gateway and 2-Tier LLM intent classifier, to the specialist sub-agents, live PostgreSQL database queries, and response synthesis:

```mermaid
flowchart TD
    %% Styling Classes
    classDef client fill:#131d16,stroke:#22c55e,stroke-width:2px,color:#fff;
    classDef express fill:#1e293b,stroke:#0ea5e9,stroke-width:2px,color:#fff;
    classDef fastapi fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff;
    classDef llm fill:#2e1065,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef agent fill:#1c1917,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef db fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;

    %% 1. Client Browser Layer
    subgraph UI_LAYER["🖥️ React 19 + Vite Frontend (http://localhost:3000)"]
        UserPrompt["👤 Customer Query Input<br/>(e.g., 'Check balance for ACC-94820 in ₹')"]
        AppDispatcher["handleDispatchTask(prompt)<br/>[src/App.tsx]"]
        Office2DCanvas["🏢 2D Floor Canvas<br/>Live Real-Time Agent Movement Simulation"]
        CustomerResponseBox["💬 Verified Customer Response (INR ₹)<br/>Rendered in Terminal View"]
    end
    class UserPrompt,AppDispatcher,Office2DCanvas,CustomerResponseBox client;

    %% 2. Express Server Layer
    subgraph NODE_LAYER["🌐 Express Gateway (server.ts : 3000)"]
        ExpressProxy["Reverse Proxy Middleware & Static Asset Hosting"]
    end
    class ExpressProxy express;

    %% 3. Python FastAPI Gateway
    subgraph FASTAPI_LAYER["⚡ Python FastAPI Microservices (fastapi_app.py : 8000)"]
        DispatchEndpoint["POST /api/orchestrator/dispatch"]
        ExecuteSubtaskEndpoint["POST /api/agent/execute_subtask"]
        SynthesizeEndpoint["POST /api/eva/synthesize"]
    end
    class DispatchEndpoint,ExecuteSubtaskEndpoint,SynthesizeEndpoint fastapi;

    %% 4. Boss EVA & 2-Tier LLM Classification
    subgraph ORCHESTRATOR_LAYER["👑 LangGraph State Machine (banking_orchestrator.py)"]
        DynamicAccountExtractor["extract_account_id_from_text()<br/>Extracts ACC-XXXXX Pattern"]
        
        subgraph LLM_TIER["🤖 2-Tier Fallback LLM Hierarchy"]
            GeminiLLM["Tier 1: Google Gemini 3.7 Flash<br/>(Primary Cloud Engine)"]
            OllamaLLM["Tier 2: Ollama Local phi3:mini<br/>(120s Extended Read Timeout)"]
        end
        
        IntentClassifier{"Dynamic Intent Classification"}
    end
    class DynamicAccountExtractor,IntentClassifier agent;
    class GeminiLLM,OllamaLLM llm;

    %% 5. Specialist Agents
    subgraph AGENT_LAYER["👥 Specialist Floor Workers"]
        BossEVADirect["👑 Boss EVA (Cabin 0x1)<br/>Zero DB Access for Greetings"]
        SpecialistVK["👨‍💼 Specialist VK (Desk 1)<br/>Balance Inquiry & Ledger Reconciler"]
        SpecialistRO["👩‍💼 Specialist RO (Desk 2)<br/>Account Statement & Cashflow Auditor"]
    end
    class BossEVADirect,SpecialistVK,SpecialistRO agent;

    %% 6. PostgreSQL Database Layer
    subgraph DB_LAYER["🗄️ PostgreSQL Database (Port 5432 / banking_db)"]
        AccountsTable[("📊 accounts Table<br/>checking_balance, savings_balance,<br/>pending_holds, currency (INR ₹)")]
        TransactionsTable[("📜 transactions Table<br/>credits, debits, timestamp, category")]
        AuditLogsTable[("🛡️ audit_logs & agent_activities<br/>Persistent Step Validation Record")]
    end
    class AccountsTable,TransactionsTable,AuditLogsTable db;

    %% Pipeline Flow Connections
    UserPrompt --> AppDispatcher
    AppDispatcher --> ExpressProxy
    ExpressProxy --> DispatchEndpoint

    DispatchEndpoint --> DynamicAccountExtractor
    DynamicAccountExtractor --> GeminiLLM
    GeminiLLM -->|If Key Absent or Fails| OllamaLLM
    GeminiLLM -->|LLM JSON Plan| IntentClassifier
    OllamaLLM -->|LLM JSON Plan| IntentClassifier

    %% Intent Routing
    IntentClassifier -->|intent: greetings / other| BossEVADirect
    IntentClassifier -->|intent: balance_inquiry| SpecialistVK
    IntentClassifier -->|intent: account_statement| SpecialistRO

    %% Greetings Execution (Zero DB Access)
    BossEVADirect -->|Direct Cabin Response| SynthesizeEndpoint

    %% Specialist VK Execution
    SpecialistVK -->|Subtask: Query Account Ledger| ExecuteSubtaskEndpoint
    ExecuteSubtaskEndpoint --> AccountsTable
    AccountsTable -->|Live Balances in ₹| SpecialistVK
    SpecialistVK -->|Generated Python AST & Thoughts| Office2DCanvas
    SpecialistVK --> SynthesizeEndpoint

    %% Specialist RO Execution
    SpecialistRO -->|Subtask: Query 30-Day Transactions| ExecuteSubtaskEndpoint
    ExecuteSubtaskEndpoint --> TransactionsTable
    TransactionsTable -->|Live Inflows/Outflows in ₹| SpecialistRO
    SpecialistRO -->|Generated Python AST & Thoughts| Office2DCanvas
    SpecialistRO --> SynthesizeEndpoint

    %% Synthesis & Delivery
    SynthesizeEndpoint -->|Synthesize Final Verified Summary| GeminiLLM
    SynthesizeEndpoint -->|Write Audit Trail| AuditLogsTable
    SynthesizeEndpoint --> CustomerResponseBox
    CustomerResponseBox --> Office2DCanvas
```

---

## 5. Unified Startup & Hosting Commands

### 🚀 All-in-One Startup (Recommended)
Starts both the FastAPI Backend and Vite/Express UI concurrently:
```bash
python start_all.py
```

### 🛠️ Individual Process Launch
If running services in separate terminal windows:

```bash
# Terminal 1: Start PostgreSQL (Docker)
docker compose -f docker-compose.db.yml up -d

# Terminal 2: Start Python FastAPI Backend (Port 8000)
python start_fastapi.py

# Terminal 3: Start Node.js Vite/Express UI (Port 3000)
npm run dev
```

### 🧪 Automated Verification Test Suite
To verify the entire banking pipeline, account regex extraction, zero-DB greetings rule, and INR currency formatting:
```bash
pytest test_banking_api.py
```
