# First Digital Treasury: Multi-Agent Banking Orchestrator

Production-grade Multi-Agent Banking Floor Orchestration System featuring:
- **Boss Agent EVA [0x1]**: Dynamic intent classification, orchestration & final customer response synthesis.
- **Specialist Agent VK (Desk 1)**: Dedicated PostgreSQL Balance Inquiry Specialist in ₹ (INR).
- **Specialist Agent RO (Desk 2)**: Dedicated PostgreSQL Account Statement & Ledger Specialist in ₹ (INR).
- **Zero-DB Greeting Routing**: Boss EVA directly delivers warm executive greetings without querying PostgreSQL.
- **Modular Prompts Architecture (`/prompts/`)**: Decoupled prompt engineering modules for intent classification, greetings, subagent execution, and customer response synthesis.
- **Strict 2-Tier LLM Pipeline**: Primary: **Gemini (gemini-2.5-flash / gemini-3.7-flash)** ➔ Fallback: **Ollama (`phi3:mini`)** with full Raw Request & Raw Response capture.
- **Dynamic PostgreSQL Ledger**: Zero hardcoded values; all balances and transactions are queried directly from the database in Indian Rupees (₹ / INR).

---

## 📁 System Architecture & Directory Structure

```
├── prompts/                               # Centralized, Decoupled Prompt Modules
│   ├── __init__.py                        # Python package exports
│   ├── index.ts                           # TypeScript barrel exports
│   ├── intent_classification.py / .ts     # Boss EVA intent routing prompt
│   ├── greetings_response.py / .ts        # Boss EVA zero-DB greeting prompt
│   ├── customer_response_synthesis.py / .ts# Final customer response synthesis prompt
│   ├── agent_vk_balance.py / .ts          # Specialist VK Balance prompt
│   └── agent_ro_statement.py / .ts        # Specialist RO Statement prompt
├── banking_orchestrator.py                # LangGraph StateGraph Banking Engine
├── fastapi_app.py                         # FastAPI REST Endpoints & Routers
├── agent_vk_balance.py                    # VK Balance Service (PostgreSQL)
├── agent_ro_statement.py                  # RO Statement Service (PostgreSQL)
├── db_manager.ts                          # TypeScript PostgreSQL Client & Seeder
├── init.sql                               # PostgreSQL Schema & Seed Data (INR ₹)
├── docker-compose.yml                     # Docker Compose for PostgreSQL 16
├── Dockerfile.postgres                    # Custom PostgreSQL Docker image
├── server.ts                              # Express Gateway & Vite Middleware
├── src/                                   # React Visual Office & Command Center UI
└── .env.example                           # Environment configuration template
```

---

## 🚀 Step-by-Step Running Guide

### Step 1: Start the PostgreSQL Database (Docker)

You can launch PostgreSQL using either Docker Compose or direct Docker run.

#### Option A: Using Docker Compose (Recommended)
```bash
# Start PostgreSQL in background
docker compose up -d postgres

# Check container health and status
docker compose ps
```

#### Option B: Using Direct Docker Run
```bash
docker run -d \
  --name banking_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgrespassword \
  -e POSTGRES_DB=banking_db \
  -p 5432:5432 \
  -v $(pwd)/init.sql:/docker-entrypoint-initdb.d/init.sql \
  postgres:16-alpine
```

---

### Step 2: Configure Environment Variables

Create `.env` based on `.env.example`:

```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
# PostgreSQL Connection URL (Matches Docker Service)
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/banking_db

# Gemini API Key (Primary LLM Engine)
GEMINI_API_KEY=your_gemini_api_key_here

# Local Ollama Fallback Engine (Runs phi3:mini)
OLLAMA_ENDPOINT=http://localhost:11434/api/generate
OLLAMA_MODEL=phi3:mini
```

---

### Step 3: (Optional) Start Local Ollama Fallback

For local offline resilience if Gemini reaches rate limits or is disconnected:

```bash
# Install and run Ollama, then pull the phi3:mini model:
ollama run phi3:mini
```

---

### Step 4: Run the Python FastAPI & LangGraph Orchestrator

Install Python dependencies and start the FastAPI service:

```bash
# Install dependencies
pip install fastapi uvicorn pydantic psycopg2-binary google-genai langgraph requests

# Run FastAPI backend on port 8000
python fastapi_app.py
# or: uvicorn fastapi_app:app --host 0.0.0.0 --port 8000 --reload
```

FastAPI Interactive Docs will be accessible at: `http://localhost:8000/docs`

---

### Step 5: Run the Unified Web Application & Visual Office Gateway

Install Node.js dependencies and start the dev server:

```bash
# Install dependencies
npm install

# Start Express + Vite visual simulation on port 3000
npm run dev
```

Open your browser at: `http://localhost:3000`

---

## 🔍 How the Prompts & Routing Work

1. **User enters query**: e.g., *"Hi, good morning!"* or *"What is my available balance?"*
2. **Intent Classification (`/prompts/intent_classification.py`)**:
   - Boss EVA dynamically classifies the intent using Gemini / Ollama fallback.
3. **Branch 1 - Greetings**:
   - Intent is `greetings` ➔ Bypasses database entirely (0 SQL queries).
   - Boss EVA responds directly with `/prompts/greetings_response.py`.
4. **Branch 2 - Balance Inquiry**:
   - Intent is `balance_inquiry` ➔ Dispatched to Specialist VK.
   - VK queries PostgreSQL `accounts` table dynamically for `ACC-94820`.
   - Returns available, checking, savings balance & pending holds in ₹.
5. **Branch 3 - Account Statement**:
   - Intent is `account_statement` ➔ Dispatched to Specialist RO.
   - RO queries PostgreSQL `transactions` table dynamically for `ACC-94820`.
   - Aggregates total credits, total debits, and net cashflow in ₹.
6. **Customer Response Synthesis (`/prompts/customer_response_synthesis.py`)**:
   - Boss EVA synthesizes the verified results into an executive customer-facing message in Indian Rupees (₹ / INR).




```mermaid
graph TD
    User["👤 User (Browser UI)"] -->|Types Prompt & Clicks Send| ReactApp["📱 React Frontend (src/App.tsx)"]
    
    subgraph "Frontend Layer (Vite + React)"
        ReactApp -->|safeJsonPost| ApiCalls["/api/orchestrator/dispatch<br/>/api/agent/execute_subtask<br/>/api/eva/synthesize"]
    end

    subgraph "Node.js & Express Gateway (server.ts : 3000)"
        ApiCalls --> ExpressServer["Node.js Express Server (server.ts)"]
        ExpressServer --> ViteDev["Vite Dev Server (HMR & Asset Bundling)"]
        ExpressServer --> LLMTwoTier["2-Tier LLM Pipeline (Gemini 3.7 -> Ollama)"]
        ExpressServer --> PostgresNode["PostgreSQL (db_manager.ts)"]
    end

    subgraph "Python FastAPI Microservice (fastapi_app.py : 8000)"
        FastApiApp["FastAPI Gateway (fastapi_app.py)"]
        FastApiApp --> AgentVK["Agent VK: Balance Router (agent_vk_balance.py)"]
        FastApiApp --> AgentRO["Agent RO: Statement Router (agent_ro_statement.py)"]
        FastApiApp --> LangGraphOrch["LangGraph Orchestrator (banking_orchestrator.py)"]
        LangGraphOrch --> PostgresPy["PostgreSQL (psycopg2)"]
    end
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details. All third-party dependencies are commercially friendly and permissively licensed (MIT, Apache-2.0, BSD-3-Clause, ISC).