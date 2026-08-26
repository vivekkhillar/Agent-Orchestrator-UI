export type AgentRole = 
  | 'supervisor'
  | 'balance_specialist'
  | 'statement_specialist'
  | 'python_dev'
  | 'ts_dev'
  | 'data_analyst'
  | 'qa_engineer'
  | 'security_devops';

export type AgentState = 
  | 'idle'
  | 'walking'
  | 'walking_to_boss'
  | 'in_boss_cabin'
  | 'walking_to_desk'
  | 'walking_to_postgres'
  | 'querying_db'
  | 'coding'
  | 'walking_to_submit'
  | 'submitting'
  | 'meeting'
  | 'coffee'
  | 'reviewing'
  | 'debugging';

export type ModelProvider = 'ollama:phi3:mini' | 'gemini-3.7-flash' | 'ollama:llama3' | 'claude-3.7-sonnet' | 'ollama:custom';

export interface Agent {
  id: string;
  codeId: string; // e.g. "0x1", "0x2"
  name: string;
  role: AgentRole;
  title: string;
  intentSpecialty?: 'balance_inquiry' | 'account_statement' | 'general_banking' | 'all';
  avatarSeed: number;
  color: string;
  hairColor: string;
  skinColor: string;
  shirtColor: string;
  x: number; // grid or canvas coordinates
  y: number;
  targetX: number;
  targetY: number;
  deskX: number;
  deskY: number;
  currentRoomId: string;
  state: AgentState;
  activeTaskId?: string;
  model: ModelProvider;
  temperature: number;
  waypoints?: { x: number; y: number }[];
  currentWaypointIndex?: number;
  stats: {
    tasksCompleted: number;
    tokensUsed: number;
    executionTimeMs: number;
    linesOfCode: number;
  };
  speechBubble?: {
    text: string;
    expiresAt: number;
  };
  isSupervisor: boolean;
}

export type TaskStatus = 'queued' | 'in_progress' | 'completed' | 'failed';

export interface SubTask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  assignedAgentId: string;
  category: 'python' | 'typescript' | 'architecture' | 'qa' | 'research' | 'devops';
  status: TaskStatus;
  progress: number; // 0-100
  dependencies: string[]; // subtask ids
  thoughtLog: string[];
  generatedCode?: {
    filename: string;
    language: 'python' | 'typescript' | 'json' | 'sql' | 'markdown';
    content: string;
  };
  executionOutput?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface TaskAssignment {
  id: string;
  title: string;
  userPrompt: string;
  status: TaskStatus;
  supervisorPlan: string;
  intent?: string;
  intentConfidence?: number;
  assignedAgentName?: string;
  finalCustomerResponse?: string;
  usedEngine?: string;
  fallbackTriggered?: boolean;
  rawRequests?: any[];
  rawResponses?: any[];
  llmInvocations?: any[];
  subtasks: SubTask[];
  createdAt: number;
  completedAt?: number;
  totalTokens: number;
  totalDurationMs: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  agentRole: AgentRole;
  type: 'orchestration' | 'thought' | 'delegation' | 'code_gen' | 'execution' | 'chat' | 'error' | 'metric';
  message: string;
  codeSnippet?: string;
}

export interface OfficeRoom {
  id: string;
  name: string;
  type: 'director' | 'conference' | 'engineering' | 'breakroom' | 'qa_lab' | 'server_room';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  floorColor: string;
  accentColor: string;
  label: string;
  capacity: number;
}

export interface OfficeDesk {
  id: string;
  agentId: string;
  x: number;
  y: number;
  direction: 'north' | 'south' | 'east' | 'west';
  roomId: string;
}

export interface HarnessSettings {
  ollamaEndpoint: string;
  ollamaModel: string;
  geminiModel: string;
  useGeminiAsFallback: boolean;
  defaultEngine: 'ollama' | 'gemini';
  simulationSpeed: number; // 1x, 2x, 3x
  soundEnabled: boolean;
  autonomousWandering: boolean;
}

export interface AgentActivityRecord {
  id: string;
  activity_id: string;
  agent_id: string;
  agent_name: string;
  agent_role: string;
  action_type: string;
  task_title: string;
  details: string;
  output_summary?: string;
  currency: string;
  currency_symbol: string;
  tokens_used: number;
  execution_time_ms: number;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'COMPLETED' | 'FALLBACK';
  timestamp: string;
}
