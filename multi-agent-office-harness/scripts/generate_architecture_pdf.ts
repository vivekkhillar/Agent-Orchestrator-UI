import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

interface TableColumn {
  header: string;
  dataKey: string;
  width: number;
}

class PDFBuilder {
  doc: jsPDF;
  pageWidth: number = 595.28;
  pageHeight: number = 841.89;
  margin: number = 40;
  contentWidth: number = 515.28;
  currentY: number = 45;
  pageCount: number = 0;

  constructor() {
    this.doc = new jsPDF({ unit: 'pt', format: 'a4' });
  }

  addHeaderFooter(pageNum: number, totalPages: number) {
    this.doc.setPage(pageNum);
    
    // Header (pages > 1)
    if (pageNum > 1) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(120, 144, 156);
      this.doc.text("Multi-Agent Banking Orchestrator | Technical Workflow & Architecture Specification", this.margin, 30);
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, 35, this.pageWidth - this.margin, 35);
    }

    // Footer (all pages)
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(148, 163, 184);
    this.doc.text("CONFIDENTIAL - FIRST DIGITAL TREASURY & OPERATING CORP", this.margin, this.pageHeight - 25);
    const pageStr = `Page ${pageNum} of ${totalPages}`;
    this.doc.text(pageStr, this.pageWidth - this.margin - this.doc.getTextWidth(pageStr), this.pageHeight - 25);
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.pageHeight - 33, this.pageWidth - this.margin, this.pageHeight - 33);
  }

  checkPageBreak(neededHeight: number): boolean {
    if (this.currentY + neededHeight > this.pageHeight - 50) {
      this.doc.addPage();
      this.currentY = 50;
      return true;
    }
    return false;
  }

  addTitleBanner(title: string, subtitle: string) {
    // Dark Green Header Box
    this.doc.setFillColor(15, 58, 34); // #0F3A22
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, 75, 4, 4, 'F');

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(title, this.margin + 16, this.currentY + 28);

    // Subtitle
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(167, 243, 208); // Emerald 200
    this.doc.text(subtitle, this.margin + 16, this.currentY + 46);

    // Metadata Tag
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(209, 250, 229);
    this.doc.text("Currency Standard: INR (Rs. / INR) | Dual-Tier LLM: Gemini 3.7 Flash -> Ollama phi3:mini | DB: PostgreSQL", this.margin + 16, this.currentY + 63);

    this.currentY += 86;
  }

  addSectionHeading(title: string, tag?: string) {
    this.checkPageBreak(35);
    
    // Left Accent Pill
    this.doc.setFillColor(16, 185, 129); // #10B981
    this.doc.rect(this.margin, this.currentY, 4, 16, 'F');

    // Section Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.setTextColor(15, 23, 42); // Slate 900
    this.doc.text(title, this.margin + 10, this.currentY + 12);

    if (tag) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(5, 150, 105);
      const tagWidth = this.doc.getTextWidth(tag) + 10;
      this.doc.setFillColor(236, 253, 245);
      this.doc.roundedRect(this.pageWidth - this.margin - tagWidth, this.currentY + 1, tagWidth, 13, 2, 2, 'F');
      this.doc.text(tag, this.pageWidth - this.margin - tagWidth + 5, this.currentY + 10);
    }

    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY + 20, this.pageWidth - this.margin, this.currentY + 20);

    this.currentY += 28;
  }

  addSubSectionHeading(title: string) {
    this.checkPageBreak(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(10);
    this.doc.setTextColor(30, 41, 59); // Slate 800
    this.doc.text(title, this.margin, this.currentY + 10);
    this.currentY += 18;
  }

  addParagraph(text: string, fontSize: number = 9, color: [number, number, number] = [51, 65, 85]) {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    
    const lines = this.doc.splitTextToSize(text, this.contentWidth);
    this.checkPageBreak(lines.length * (fontSize * 1.35) + 6);
    
    for (const line of lines) {
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += fontSize * 1.35;
    }
    this.currentY += 4;
  }

  addCallout(title: string, text: string, type: 'info' | 'success' | 'warning' = 'info') {
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    const lines = this.doc.splitTextToSize(text, this.contentWidth - 24);
    const boxHeight = lines.length * 11 + 28;

    this.checkPageBreak(boxHeight + 10);

    let bgColor: [number, number, number] = [240, 253, 244]; // Green-50
    let borderColor: [number, number, number] = [52, 211, 153]; // Emerald-400
    let titleColor: [number, number, number] = [6, 95, 70]; // Emerald-800

    if (type === 'warning') {
      bgColor = [254, 252, 232];
      borderColor = [250, 204, 21];
      titleColor = [133, 77, 14];
    } else if (type === 'info') {
      bgColor = [241, 245, 249];
      borderColor = [148, 163, 184];
      titleColor = [30, 41, 59];
    }

    this.doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    this.doc.setLineWidth(0.75);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'FD');

    // Title
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    this.doc.text(title, this.margin + 12, this.currentY + 14);

    // Body
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(51, 65, 85);
    let lineY = this.currentY + 26;
    for (const l of lines) {
      this.doc.text(l, this.margin + 12, lineY);
      lineY += 11;
    }

    this.currentY += boxHeight + 10;
  }

  addTable(columns: TableColumn[], rows: Record<string, string>[]) {
    this.checkPageBreak(rows.length * 20 + 30);

    const startX = this.margin;
    let y = this.currentY;

    // Header Background
    this.doc.setFillColor(15, 23, 42); // Slate 900
    this.doc.rect(startX, y, this.contentWidth, 18, 'F');

    // Header Text
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(255, 255, 255);
    let colX = startX;
    columns.forEach(col => {
      this.doc.text(col.header, colX + 6, y + 12);
      colX += col.width;
    });

    y += 18;

    // Rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);

    rows.forEach((row, rIdx) => {
      // Calculate row height based on cell text wrapping
      let maxLines = 1;
      columns.forEach(col => {
        const text = row[col.dataKey] || '';
        const lines = this.doc.splitTextToSize(text, col.width - 12);
        if (lines.length > maxLines) maxLines = lines.length;
      });

      const rowHeight = Math.max(16, maxLines * 10 + 6);
      this.checkPageBreak(rowHeight + 10);

      // Zebra striping
      if (rIdx % 2 === 1) {
        this.doc.setFillColor(248, 250, 252);
        this.doc.rect(startX, y, this.contentWidth, rowHeight, 'F');
      }

      // Cell border
      this.doc.setDrawColor(226, 232, 240);
      this.doc.setLineWidth(0.5);
      this.doc.line(startX, y + rowHeight, startX + this.contentWidth, y + rowHeight);

      colX = startX;
      columns.forEach(col => {
        const text = row[col.dataKey] || '';
        const lines = this.doc.splitTextToSize(text, col.width - 12);
        this.doc.setTextColor(51, 65, 85);
        let textY = y + 10;
        lines.forEach((l: string) => {
          this.doc.text(l, colX + 6, textY);
          textY += 10;
        });
        colX += col.width;
      });

      y += rowHeight;
    });

    this.currentY = y + 10;
  }

  addCodeBlock(code: string, language: string = 'json') {
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    const lines = this.doc.splitTextToSize(code, this.contentWidth - 24);
    const boxHeight = lines.length * 9.5 + 20;

    this.checkPageBreak(boxHeight + 8);

    // Dark Background
    this.doc.setFillColor(15, 23, 42); // Slate 900
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'F');

    // Language Badge
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(6.5);
    this.doc.setTextColor(148, 163, 184);
    this.doc.text(language.toUpperCase(), this.margin + this.contentWidth - 35, this.currentY + 11);

    // Code lines
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(248, 250, 252);
    let codeY = this.currentY + 16;
    for (const line of lines) {
      this.doc.text(line, this.margin + 12, codeY);
      codeY += 9.5;
    }

    this.currentY += boxHeight + 10;
  }

  addStepBox(stepNum: string, title: string, actor: string, description: string, details: string[]) {
    this.checkPageBreak(75);

    const boxHeight = 46 + details.length * 10;
    this.doc.setFillColor(255, 255, 255);
    this.doc.setDrawColor(203, 213, 225);
    this.doc.setLineWidth(0.75);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'FD');

    // Step Number Badge
    this.doc.setFillColor(15, 58, 34); // Forest Green
    this.doc.roundedRect(this.margin + 8, this.currentY + 8, 24, 18, 2, 2, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8.5);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(stepNum, this.margin + 14, this.currentY + 20);

    // Title & Actor
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9.5);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(title, this.margin + 38, this.currentY + 16);

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(5, 150, 105);
    this.doc.text(`[Actor: ${actor}]`, this.margin + 38, this.currentY + 26);

    // Description
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(71, 85, 105);
    this.doc.text(description, this.margin + 12, this.currentY + 39);

    // Details bullet points
    let detY = this.currentY + 50;
    details.forEach(d => {
      this.doc.setFillColor(16, 185, 129);
      this.doc.circle(this.margin + 16, detY - 3, 1.5, 'F');
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(7.5);
      this.doc.setTextColor(51, 65, 85);
      this.doc.text(d, this.margin + 24, detY);
      detY += 10;
    });

    this.currentY += boxHeight + 8;
  }

  addSequenceStepCard(
    num: string,
    fromActor: string,
    toActor: string,
    endpoint: string,
    condition: string,
    action: string,
    dataFlow: string
  ) {
    this.checkPageBreak(58);

    const boxHeight = 50;
    this.doc.setFillColor(255, 255, 255);
    this.doc.setDrawColor(203, 213, 225);
    this.doc.setLineWidth(0.75);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'FD');

    // Number Circle
    this.doc.setFillColor(15, 58, 34); // Forest Green
    this.doc.circle(this.margin + 14, this.currentY + 16, 8, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(255, 255, 255);
    const numWidth = this.doc.getTextWidth(num);
    this.doc.text(num, this.margin + 14 - numWidth / 2, this.currentY + 19);

    // From -> To Badge
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(8);
    this.doc.setTextColor(15, 23, 42);
    this.doc.text(`${fromActor}  -->  ${toActor}`, this.margin + 28, this.currentY + 14);

    // Endpoint Tag
    if (endpoint) {
      this.doc.setFont('courier', 'bold');
      this.doc.setFontSize(7);
      this.doc.setTextColor(5, 150, 105);
      this.doc.text(endpoint, this.margin + 28, this.currentY + 24);
    }

    // Condition Tag on Right
    if (condition) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(6.5);
      this.doc.setTextColor(180, 83, 9); // Amber-700
      const condStr = `[Condition: ${condition}]`;
      const condW = this.doc.getTextWidth(condStr);
      this.doc.text(condStr, this.pageWidth - this.margin - condW - 8, this.currentY + 14);
    }

    // Action Description
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7.5);
    this.doc.setTextColor(71, 85, 105);
    this.doc.text(`Action: ${action}`, this.margin + 10, this.currentY + 36);

    // Data Flow
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(7);
    this.doc.setTextColor(100, 116, 139);
    this.doc.text(`Payload / Data: ${dataFlow}`, this.margin + 10, this.currentY + 45);

    this.currentY += boxHeight + 5;
  }
}

export function generateSpecificationPdf(): string {
  const builder = new PDFBuilder();

  // ==========================================
  // PAGE 1: TITLE & EXECUTIVE ARCHITECTURE
  // ==========================================
  builder.addTitleBanner(
    "Multi-Agent Banking Orchestrator Specification",
    "Complete End-to-End System Architecture, Deterministic Tool Execution & Data Flow Guide"
  );

  builder.addSectionHeading("1. Executive Architecture & Physical Office Topology", "SYSTEM OVERVIEW");
  
  builder.addParagraph(
    "The Multi-Agent Banking Orchestrator is an enterprise-grade financial intelligence platform. It coordinates specialized autonomous sub-agents across a simulated 2D banking floor layout, querying live PostgreSQL ledger records and synthesizing verified financial responses in Indian Rupees (INR / Rs.). All operations adhere to strict zero-hallucination policies through deterministic database tools."
  );

  builder.addCallout(
    "Core Architectural Principles",
    "• Strict Currency Standard: All outputs, balances, and calculations are strictly in Indian Rupees (INR / Rs.).\n• Two-Tier LLM Hierarchy: Primary Google Gemini (gemini-3.7-flash) with seamless fallback to Local Ollama (phi3:mini).\n• Deterministic Tools: Sub-agents execute verified Python/psycopg2 SQL queries directly against PostgreSQL.\n• Zero-DB Greetings: Boss EVA resolves conversational queries directly without touching database infrastructure.\n• Unified Tracing: Every step shares an immutable Batch ID tag for auditability and failure diagnosis.",
    "success"
  );

  builder.addSubSectionHeading("Floor Layout & Agent Role Matrix");

  builder.addTable(
    [
      { header: "Agent Identifier", dataKey: "agent", width: 100 },
      { header: "Location / Station", dataKey: "station", width: 110 },
      { header: "Specialization Role", dataKey: "role", width: 130 },
      { header: "Core Tools & Responsibilities", dataKey: "tools", width: 175.28 }
    ],
    [
      {
        agent: "Boss EVA [0x1]",
        station: "Executive Cabin (Top-Left)",
        role: "Lead Floor Orchestrator",
        tools: "Dynamic Intent Classification (prompts/intent_classification.py), Subtask Planning, Zero-DB Greetings, and Final Customer Response Synthesis."
      },
      {
        agent: "Specialist VK",
        station: "Desk 1 (Center Floor)",
        role: "Balance Inquiry Specialist",
        tools: "Executes get_account_data() tool via PostgreSQL accounts table. Reconciles Checking, Savings, and Pending Holds in INR (Rs.)."
      },
      {
        agent: "Specialist RO",
        station: "Desk 2 (Center Floor)",
        role: "Statement Specialist",
        tools: "Executes get_transactions_data() tool via PostgreSQL transactions table. Aggregates Total Credits (+Rs.), Debits (-Rs.), and Net Cashflow."
      },
      {
        agent: "Server Room",
        station: "PostgreSQL Facility (Top-Right)",
        role: "Relational Ledger (Port 5432)",
        tools: "PostgreSQL banking_db with pre-seeded accounts, 30-day transaction ledgers, intent_classifications, and immutable audit_logs."
      }
    ]
  );

  // ==========================================
  // PAGE 2: COMPLETE END-TO-END WORKFLOW
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("2. Complete End-to-End Workflow Pipeline", "5-STAGE PIPELINE");

  builder.addParagraph(
    "Every customer inquiry executes through a 5-stage synchronous/asynchronous pipeline that tracks state transitions, database queries, and LLM evaluations under a unified Batch ID."
  );

  builder.addStepBox(
    "1",
    "UI Prompt Ingestion & Batch ID Initialization",
    "React 19 / Vite Frontend (App.tsx)",
    "Customer submits natural language prompt via the Terminal / CommandCenter UI.",
    [
      "Generates unique tracking tag: batch_<timestamp>_<random>",
      "Dispatches HTTP POST to /api/orchestrator/dispatch with prompt and batch_id",
      "Transitions Boss EVA sprite state to analyzing at Executive Cabin [0x1]"
    ]
  );

  builder.addStepBox(
    "2",
    "Dynamic Intent Classification & Subtask Generation",
    "FastAPI Orchestrator (banking_orchestrator.py)",
    "Boss EVA extracts account numbers via NLP regex and invokes 2-tier LLM pipeline.",
    [
      "Executes NLP Regex parsing to extract account IDs (e.g. ACC-94820, ACC-55210)",
      "Sends INTENT_CLASSIFICATION_SYSTEM_PROMPT to Gemini (fallback to Ollama)",
      "Returns structured plan: Identified Intent, Confidence (%), and Subtask Assignment Array"
    ]
  );

  builder.addStepBox(
    "3",
    "Specialist Agent Subtask & Deterministic Tool Execution",
    "Specialist VK / RO & PostgreSQL Database",
    "Assigned sub-agent walks to Server Room, queries database, and returns to desk.",
    [
      "Calls /api/agent/execute_subtask: executes get_account_data() or get_transactions_data()",
      "Queries PostgreSQL accounts or transactions table directly via psycopg2",
      "LLM generates FastAPI code snippet, execution console output, and thoughtLog referencing live SQL"
    ]
  );

  builder.addStepBox(
    "4",
    "Executive Customer Response Synthesis",
    "Boss EVA (Cabin 0x1) & LLM Pipeline",
    "Boss EVA synthesizes specialist findings and PostgreSQL ledger data into customer response.",
    [
      "Calls /api/eva/synthesize with specialist findings and verified ledger balances",
      "Enforces strict Indian Rupee formatting (INR / Rs.) and distinguishes liquidity vs holds",
      "Includes fail-safe deterministic banking fallback if LLM times out or is slow"
    ]
  );

  builder.addStepBox(
    "5",
    "Dual-Layer Audit Logging & Telemetry Recording",
    "Audit Subsystem (PostgreSQL & Disk Logs)",
    "All telemetry, latencies, tokens, and payloads are cryptographically recorded.",
    [
      "Inserts structured audit record into PostgreSQL audit_logs & agent_activities table",
      "Appends formatted step log to logs/banking_audit.log with [BATCH: <batch_id>] header",
      "Appends raw request/response evaluation metrics to logs/llm_invocations.log"
    ]
  );

  // ==========================================
  // PAGE 3: INTERACTIVE SEQUENCE DIAGRAM & LIFELINE FLOW
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("3. Frontend <--> Backend Interactive Sequence Flow", "SEQUENCE DIAGRAM");

  builder.addParagraph(
    "The sequence diagram below illustrates the exact synchronous and asynchronous communication lifelines between the User, React Frontend, FastAPI Orchestrator, Specialist Sub-Agents, PostgreSQL Database, and the 2-Tier LLM Layer."
  );

  // Lifelines Bar
  builder.doc.setFillColor(15, 23, 42); // Slate 900
  builder.doc.roundedRect(builder.margin, builder.currentY, builder.contentWidth, 18, 3, 3, 'F');
  builder.doc.setFont('helvetica', 'bold');
  builder.doc.setFontSize(7.5);
  builder.doc.setTextColor(167, 243, 208);
  builder.doc.text("LIFELINES:  [1. User / UI]  --->  [2. FastAPI Orchestrator]  --->  [3. PostgreSQL (5432)]  --->  [4. 2-Tier LLM]", builder.margin + 12, builder.currentY + 12);
  builder.currentY += 24;

  builder.addSequenceStepCard(
    "1",
    "User / Terminal UI",
    "FastAPI Orchestrator",
    "POST /api/orchestrator/dispatch",
    "User submits prompt & isRunning == false",
    "Ingests query, extracts Account ID with NLP regex, and triggers planning.",
    'Request: { prompt: "Check balance for ACC-94820", batch_id: "batch_..." }'
  );

  builder.addSequenceStepCard(
    "2",
    "FastAPI Orchestrator",
    "2-Tier LLM (Gemini / Ollama)",
    "invoke_llm_with_fallback(json_mode=True)",
    "GEMINI_API_KEY present (or Ollama fallback)",
    "Evaluates intent_classification.py with temperature 0.1 to plan subtasks.",
    'Response: { intent: "balance_inquiry", assignedAgent: "VK", subtasks: [...] }'
  );

  builder.addSequenceStepCard(
    "3",
    "React Frontend (App.tsx)",
    "2D Office Canvas",
    "getPathToBossCabin & getPathToPostgres",
    "subtasks.length > 0 (e.g. balance_inquiry)",
    "Sprite animates from Desk -> Cabin [0x1] -> Server Room (710, 120).",
    "State transitions: 'walking_to_boss' -> 'in_boss_cabin' -> 'walking_to_postgres'"
  );

  builder.addSequenceStepCard(
    "4",
    "React Frontend (at Server Room)",
    "FastAPI Backend",
    "POST /api/agent/execute_subtask",
    "Agent sprite touches Server Room Station (710, 120)",
    "Invokes deterministic DB tool get_account_data() & generates FastAPI code.",
    'Request: { subtask, agent, prompt, accountId, batch_id }'
  );

  builder.addSequenceStepCard(
    "5",
    "FastAPI Backend",
    "PostgreSQL Database (Port 5432)",
    "psycopg2 SQL SELECT on accounts table",
    "Triggered by execute_agent_subtask()",
    "Fetches live checking, savings, holds, and total ledger balance in INR (Rs.).",
    'SQL Result: Available ₹1,39,430.50, Checking ₹98,450.50, Holds ₹3,420.00'
  );

  builder.addSequenceStepCard(
    "6",
    "React Frontend (App.tsx)",
    "FastAPI Backend",
    "POST /api/eva/synthesize",
    "All subtasks complete OR intent == 'greetings'",
    "Boss EVA synthesizes verified ledger records into final customer response.",
    'Request: { intent, prompt, accountId, batch_id, subtaskResults: [...] }'
  );

  builder.addSequenceStepCard(
    "7",
    "FastAPI Backend",
    "User / Terminal UI",
    "Delivers Final Verified Response",
    "Synthesis complete & currency validation passed",
    "Renders executive speech bubble and appends immutable audit log to DB.",
    'Response: { success: true, customer_response: "Hello! Boss EVA...", usedEngine: "..." }'
  );

  // ==========================================
  // PAGE 4: FRONTEND <--> BACKEND API TRIGGER MATRIX
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("4. Frontend <--> Backend API Calling & Trigger Matrix", "API SPECIFICATION");

  builder.addParagraph(
    "The matrix below details every REST endpoint, its frontend caller, exact execution trigger, runtime conditions, and associated database / LLM actions."
  );

  builder.addTable(
    [
      { header: "API Endpoint & Method", dataKey: "ep", width: 125 },
      { header: "Frontend Caller & Trigger", dataKey: "caller", width: 110 },
      { header: "Condition & Execution Rule", dataKey: "cond", width: 120 },
      { header: "Backend Processing & DB Action", dataKey: "action", width: 160.28 }
    ],
    [
      {
        ep: "GET /api/health",
        caller: "App.tsx (checkHealth) on mount",
        cond: "Always executed on initial app load",
        action: "Verifies FastAPI service health, PostgreSQL connectivity, and GEMINI_API_KEY status."
      },
      {
        ep: "POST /api/ollama/status",
        caller: "App.tsx (checkOllamaStatus)",
        cond: "On mount & when settings endpoint changes",
        action: "Pings Ollama endpoint (localhost:11434) to test local model availability."
      },
      {
        ep: "GET /api/source_files",
        caller: "App.tsx (fetchSourceFiles)",
        cond: "On mount & Code tab refresh",
        action: "Reads active Python agent files and prompts/ directory for Code Sandbox."
      },
      {
        ep: "POST /api/orchestrator/dispatch",
        caller: "App.tsx (handleDispatchTask)",
        cond: "User submits prompt (not currently running)",
        action: "Parses Account ID; calls Gemini/Ollama with prompts/intent_classification.py; returns subtasks & batch_id."
      },
      {
        ep: "POST /api/agent/execute_subtask",
        caller: "App.tsx (handleDispatchTask)",
        cond: "When sub-agent sprite reaches Server Room",
        action: "Executes get_account_data() or get_transactions_data(); generates code & thoughtLog; logs to audit_logs."
      },
      {
        ep: "POST /api/eva/synthesize",
        caller: "App.tsx (handleDispatchTask)",
        cond: "After subtasks complete OR if greetings",
        action: "Boss EVA synthesizes final response in INR (Rs.); enforces zero-DB rule for greetings; saves final audit."
      },
      {
        ep: "GET /api/logs/audit?limit=250",
        caller: "CommandCenter.tsx (fetchAuditLog)",
        cond: "Every 2.5s when Audit tab active",
        action: "Reads real-time step execution lines from logs/banking_audit.log."
      },
      {
        ep: "GET /api/logs/llm?limit=100",
        caller: "CommandCenter.tsx (fetchLlmLogs)",
        cond: "Every 3.0s when Raw LLM tab active",
        action: "Reads raw JSON request/response telemetry from logs/llm_invocations.log."
      }
    ]
  );

  builder.addCallout(
    "Zero-Interference Dual Tracing Architecture",
    "Every API request originating from the frontend carries the unified batch_id. This enables the backend to trace the end-to-end lifecycle across both PostgreSQL audit_logs and local persistent disk logs without cross-talk between concurrent queries.",
    "success"
  );

  // ==========================================
  // PAGE 5: 2D PHYSICAL OFFICE & UI EVENT TRACKING
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("5. 2D Office Physical Movement & UI Event State Machine", "SPRITE & ANIMATION FLOW");

  builder.addParagraph(
    "The frontend UI (App.tsx and OfficeCanvas.tsx) features a physical 2D office simulation where agents physically navigate between workstations, the Executive Cabin, and the PostgreSQL Server Room based on real-time task states."
  );

  builder.addSubSectionHeading("Agent Movement & State Transition Lifecycle");

  builder.addTable(
    [
      { header: "Phase", dataKey: "phase", width: 85 },
      { header: "Agent & Location", dataKey: "loc", width: 110 },
      { header: "Visual Sprite Action", dataKey: "action", width: 145 },
      { header: "UI Event & State Updates", dataKey: "event", width: 175.28 }
    ],
    [
      {
        phase: "A. Briefing Call",
        loc: "Boss EVA @ Cabin [0x1] (105, 85)",
        action: "Boss EVA speech bubble summons specialist: 'Report to Executive Cabin for task...'",
        event: "Stage set to 'BRIEFING IN CABIN'. Active task initialized with 'queued' subtasks."
      },
      {
        phase: "B. Walk to Cabin",
        loc: "Specialist VK/RO -> Cabin (105, 140)",
        action: "Sub-agent calculates waypoint path (getPathToBossCabin) and walks to Boss desk.",
        event: "Agent state: 'walking_to_boss'. Speech: 'Heading to Boss Cabin for task briefing...'"
      },
      {
        phase: "C. Walk to Server",
        loc: "Specialist -> Server Room (710, 120)",
        action: "Sub-agent walks across office floor to PostgreSQL Server Room racks.",
        event: "Agent state: 'walking_to_postgres'. Subtask status transitions to 'in_progress'."
      },
      {
        phase: "D. Tool Execution",
        loc: "Specialist @ Server Room (710, 120)",
        action: "Sub-agent executes live SQL query. Server rack LED animation pulses.",
        event: "Agent state: 'querying_db'. Calls POST /api/agent/execute_subtask with batch_id. Live SQL thoughts stream to Terminal."
      },
      {
        phase: "E. Return to Desk",
        loc: "Specialist -> Workstation Desk",
        action: "Sub-agent returns to desk (getPathFromPostgresToDesk) to generate microservice code.",
        event: "Agent state: 'walking_to_desk' -> 'working'. Generates FastAPI code & marks subtask 'completed (100%)'."
      },
      {
        phase: "F. Report to Boss",
        loc: "Boss EVA @ Cabin [0x1] (105, 85)",
        action: "Boss EVA synthesizes all subtask outputs and displays executive customer response.",
        event: "Calls POST /api/eva/synthesize. Speech bubble renders response. Task status marked 'completed'. All agents reset to 'idle'."
      }
    ]
  );

  builder.addCallout(
    "Real-Time UI Event Tracing & Stream Synchronization",
    "1. Terminal Sync: Every agent transition emits a structured event (addLog) displaying the agent's role, avatar, and thought.\n" +
    "2. Activity Matrix: Subtask durations (ms), tokens, and AST code files are pushed to the live Activity & Code tabs.\n" +
    "3. Batch Tracing: The batchId generated at Step A accompanies all sub-agent and tool invocations across disk and DB.",
    "info"
  );

  // ==========================================
  // PAGE 6: DETERMINISTIC TOOLS & DB SCHEMAS
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("6. Deterministic Tool Calling & PostgreSQL Architecture", "DATABASE INTERFACE");

  builder.addParagraph(
    "Why Deterministic Tool Calling? Small local models (Ollama phi3:mini) and production financial systems require absolute schema reliability. Rather than allowing an LLM to hallucinate SQL queries, specialist agents invoke deterministic Python tool functions with parameter-safe psycopg2 bindings."
  );

  builder.addSubSectionHeading("PostgreSQL Core Database Tables");

  builder.addTable(
    [
      { header: "Table Name", dataKey: "tbl", width: 100 },
      { header: "Primary Key", dataKey: "pk", width: 80 },
      { header: "Key Columns & Data Types", dataKey: "cols", width: 175 },
      { header: "Accessing Function / Tool", dataKey: "tool", width: 160.28 }
    ],
    [
      {
        tbl: "accounts",
        pk: "account_id",
        cols: "account_holder VARCHAR, available_balance NUMERIC, checking_balance NUMERIC, savings_balance NUMERIC, pending_holds NUMERIC, currency VARCHAR(8)",
        tool: "get_account_data() & agent_vk_balance.py (/api/v1/agent/vk/balance)"
      },
      {
        tbl: "transactions",
        pk: "txn_id",
        cols: "account_id VARCHAR, date TIMESTAMP, description TEXT, amount NUMERIC, type VARCHAR(8), balance_after NUMERIC",
        tool: "get_transactions_data() & agent_ro_statement.py (/api/v1/agent/ro/statement)"
      },
      {
        tbl: "audit_logs",
        pk: "id (SERIAL)",
        cols: "log_id VARCHAR, agent_id VARCHAR, agent_name VARCHAR, log_type VARCHAR, message TEXT, metadata JSONB, created_at TIMESTAMP",
        tool: "log_audit_to_postgres() (Called on every step completion)"
      },
      {
        tbl: "agent_activities",
        pk: "id (SERIAL)",
        cols: "activity_id VARCHAR, agent_id VARCHAR, action_type VARCHAR, task_title VARCHAR, output_summary TEXT, tokens_used INT, execution_time_ms INT",
        tool: "log_agent_activity_to_postgres() (Populates Activity tab)"
      },
      {
        tbl: "intent_classifications",
        pk: "id (SERIAL)",
        cols: "query_text TEXT, classified_intent VARCHAR, confidence NUMERIC, llm_reasoning TEXT, assigned_agent VARCHAR, llm_model VARCHAR",
        tool: "log_intent_to_postgres() (Records Boss EVA planning classifications)"
      }
    ]
  );

  builder.addCallout(
    "Zero-Database Access Rule for Greetings",
    "When a user inputs conversational prompts ('hello', 'good morning', 'hi'), Boss EVA classifies the intent as 'greetings' with zero subtasks. Boss EVA directly returns an executive welcome greeting without executing any database queries (database_accessed: false), minimizing latency and eliminating database load.",
    "info"
  );

  // ==========================================
  // PAGE 7: PROMPTS MATRIX & LLM FALLBACK
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("7. Dedicated Prompts & 2-Tier LLM Fallback Pipeline", "PROMPTS & LLM LAYER");

  builder.addParagraph(
    "Every stage uses dedicated, modular prompt files located in the prompts/ directory. When GEMINI_API_KEY is present, invocations are routed to Gemini 3.7 Flash (~500ms). If unavailable, requests fall back to local Ollama (phi3:mini) with bounded token generation."
  );

  builder.addSubSectionHeading("Modular Prompts Matrix");

  builder.addTable(
    [
      { header: "Prompt File", dataKey: "file", width: 140 },
      { header: "Invoking Function", dataKey: "fn", width: 110 },
      { header: "Injected Dynamic Inputs", dataKey: "inputs", width: 135 },
      { header: "Enforced Output Contract", dataKey: "output", width: 130.28 }
    ],
    [
      {
        file: "prompts/intent_classification.py",
        fn: "plan_orchestration()",
        inputs: "User prompt, extracted account ID, custom directives",
        output: "Strict JSON with intent, intent_confidence, assigned_agent, subtasks array"
      },
      {
        file: "prompts/agent_vk_balance.py",
        fn: "execute_agent_subtask()",
        inputs: "Account ID, Live PostgreSQL checking, savings, holds in INR (Rs.)",
        output: "JSON with speechSummary, thoughtLog referencing SQL, code, executionOutput"
      },
      {
        file: "prompts/agent_ro_statement.py",
        fn: "execute_agent_subtask()",
        inputs: "Account ID, Total Credits (+Rs.), Debits (-Rs.), 30-day txn count",
        output: "JSON with ASCII statement table, thoughtLog, and FastAPI router code"
      },
      {
        file: "prompts/customer_response_synthesis.py",
        fn: "synthesize_customer_response()",
        inputs: "User query, live account ledger, transaction sums, specialist findings",
        output: "Concise executive banking response strictly formatted in INR (Rs.)"
      },
      {
        file: "prompts/greetings_response.py",
        fn: "synthesize_customer_response()",
        inputs: "User prompt, optional account identifier",
        output: "Executive conversational greeting with zero database queries"
      }
    ]
  );

  builder.addSubSectionHeading("2-Tier Fallback Flowchart & Bounded Token Configuration");

  builder.addParagraph(
    "1. Primary Tier: Google Gemini (gemini-3.7-flash) via google-genai SDK. Temperature: 0.1–0.2.\n" +
    "2. Secondary Tier: Local Ollama (phi3:mini) via HTTP POST /api/generate. Bounded with num_predict: 350 to prevent CPU token runaway.\n" +
    "3. Configurable Timeout: OLLAMA_TIMEOUT (default: 300.0s) loaded from root .env file.\n" +
    "4. Deterministic Reconciled Fallback: If both LLM tiers are offline, Boss EVA generates verified mathematical statements directly from PostgreSQL data."
  );

  // ==========================================
  // PAGE 8: DATA CONTRACTS & JSON SCHEMAS
  // ==========================================
  builder.doc.addPage();
  builder.currentY = 45;

  builder.addSectionHeading("8. Complete JSON Data Contracts & API Payloads", "API CONTRACTS");

  builder.addSubSectionHeading("1. Orchestration Dispatch Endpoint: POST /api/orchestrator/dispatch");
  builder.addCodeBlock(
`// Request Payload:
{
  "prompt": "Check available balance for ACC-94820",
  "batch_id": "batch_20260826_180000_123"
}

// Response Payload (OrchestratedResponse):
{
  "success": true,
  "status": "SUCCESS",
  "batch_id": "batch_20260826_180000_123",
  "intent": "balance_inquiry",
  "intentConfidence": 0.99,
  "assignedAgentName": "VK",
  "extractedAccountId": "ACC-94820",
  "plan": "Supervisor plan: delegate balance verification to Specialist VK.",
  "subtasks": [
    {
      "id": "subtask_vk_1",
      "title": "Database Balance & Ledger Audit",
      "assignedAgentId": "agent_vk",
      "targetFile": "agent_vk_balance.py",
      "batch_id": "batch_20260826_180000_123"
    }
  ],
  "usedEngine": "gemini-3.7-flash",
  "fallbackTriggered": false
}`,
    "json"
  );

  builder.addSubSectionHeading("2. Response Synthesis Endpoint: POST /api/eva/synthesize");
  builder.addCodeBlock(
`// Request Payload (SynthesisRequest):
{
  "intent": "balance_inquiry",
  "prompt": "Check available balance for ACC-94820",
  "accountId": "ACC-94820",
  "batch_id": "batch_20260826_180000_123",
  "subtaskResults": [
    { "speechSummary": "Specialist VK verified available funds: Rs. 1,39,430.50 INR." }
  ]
}

// Response Payload:
{
  "success": true,
  "batch_id": "batch_20260826_180000_123",
  "boss_agent": "EVA [0x1]",
  "intent": "balance_inquiry",
  "database_accessed": true,
  "customer_response": "Hello! Boss EVA [0x1] here. Specialist VK has verified the live PostgreSQL ledger for First Digital Treasury (ACC-94820): Total Available Liquidity is Rs. 1,39,430.50 INR (Rs. 98,450.50 Checking + Rs. 44,400.00 Savings less Rs. 3,420.00 in Pending Holds).",
  "usedEngine": "gemini-3.7-flash",
  "fallbackTriggered": false
}`,
    "json"
  );

  // Add Page Numbers & Headers to All Pages
  const totalPages = builder.doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    builder.addHeaderFooter(i, totalPages);
  }

  // Save to Disk
  const outputPath = path.join(process.cwd(), 'Architecture_Specification.pdf');
  const buffer = builder.doc.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`Generated Architecture_Specification.pdf successfully at: ${outputPath} (${totalPages} pages)`);
  return outputPath;
}

generateSpecificationPdf();
