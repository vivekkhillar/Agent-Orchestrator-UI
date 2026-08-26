import { Agent, OfficeRoom, OfficeDesk, HarnessSettings, TaskAssignment } from '../types';

export const INITIAL_ROOMS: OfficeRoom[] = [
  {
    id: 'room_director',
    name: "Boss Executive Cabin",
    type: 'director',
    x: 25,
    y: 25,
    width: 210,
    height: 180,
    color: '#334155',
    floorColor: '#96baa3',
    accentColor: '#4f46e5',
    label: "BOSS CABIN [0x1]",
    capacity: 3
  },
  {
    id: 'room_conference',
    name: "Boardroom / Sync",
    type: 'conference',
    x: 245,
    y: 25,
    width: 375,
    height: 180,
    color: '#334155',
    floorColor: '#9bbfa8',
    accentColor: '#3b82f6',
    label: "WAR ROOM / BOARDROOM",
    capacity: 8
  },
  {
    id: 'room_server',
    name: "PostgreSQL & Servers",
    type: 'server_room',
    x: 630,
    y: 25,
    width: 305,
    height: 180,
    color: '#1e293b',
    floorColor: '#92b59f',
    accentColor: '#10b981',
    label: "POSTGRESQL & AUDIT LOGS",
    capacity: 4
  },
  {
    id: 'room_engineering',
    name: "Open Bullpen & Workstations",
    type: 'engineering',
    x: 25,
    y: 215,
    width: 665,
    height: 285,
    color: '#334155',
    floorColor: '#94bfa5',
    accentColor: '#0ea5e9',
    label: "ENGINEERING BULLPEN",
    capacity: 12
  },
  {
    id: 'room_breakroom',
    name: "Lounge & Coffee Counter",
    type: 'breakroom',
    x: 700,
    y: 215,
    width: 235,
    height: 285,
    color: '#334155',
    floorColor: '#99c3aa',
    accentColor: '#ec4899',
    label: "LOUNGE & CAFE",
    capacity: 6
  }
];

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent_supervisor',
    codeId: '0x1',
    name: 'EVA',
    role: 'supervisor',
    title: 'Lead Banking Orchestrator & Floor Boss',
    intentSpecialty: 'all',
    avatarSeed: 1,
    color: '#6366f1',
    hairColor: '#312e81',
    skinColor: '#fed7aa',
    shirtColor: '#4338ca',
    x: 105,
    y: 85,
    targetX: 105,
    targetY: 85,
    deskX: 105,
    deskY: 85,
    currentRoomId: 'room_director',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.2,
    isSupervisor: true,
    stats: {
      tasksCompleted: 42,
      tokensUsed: 31450,
      executionTimeMs: 16200,
      linesOfCode: 0
    },
    speechBubble: {
      text: "Boss EVA online in Cabin [0x1]. Send banking task in ₹ to route to VK or RO.",
      expiresAt: Date.now() + 8000
    }
  },
  {
    id: 'agent_vk',
    codeId: '0x2',
    name: 'VK',
    role: 'balance_specialist',
    title: 'Balance Inquiry Specialist (PostgreSQL + INR)',
    intentSpecialty: 'balance_inquiry',
    avatarSeed: 2,
    color: '#0ea5e9',
    hairColor: '#78350f',
    skinColor: '#fed7aa',
    shirtColor: '#0284c7',
    x: 75,
    y: 310,
    targetX: 75,
    targetY: 310,
    deskX: 75,
    deskY: 310,
    currentRoomId: 'room_engineering',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.2,
    isSupervisor: false,
    stats: {
      tasksCompleted: 35,
      tokensUsed: 42100,
      executionTimeMs: 24300,
      linesOfCode: 3420
    },
    speechBubble: {
      text: "VK ready at workstation. Handles PostgreSQL Balance Inquiry in ₹ (INR).",
      expiresAt: Date.now() + 6000
    }
  },
  {
    id: 'agent_ro',
    codeId: '0x3',
    name: 'RO',
    role: 'statement_specialist',
    title: 'Account Statement Specialist (PostgreSQL + INR)',
    intentSpecialty: 'account_statement',
    avatarSeed: 3,
    color: '#10b981',
    hairColor: '#0f172a',
    skinColor: '#fed7aa',
    shirtColor: '#059669',
    x: 215,
    y: 310,
    targetX: 215,
    targetY: 310,
    deskX: 215,
    deskY: 310,
    currentRoomId: 'room_engineering',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.2,
    isSupervisor: false,
    stats: {
      tasksCompleted: 28,
      tokensUsed: 39500,
      executionTimeMs: 22100,
      linesOfCode: 2980
    },
    speechBubble: {
      text: "RO ready at workstation. Handles PostgreSQL Account Statements in ₹ (INR).",
      expiresAt: Date.now() + 7000
    }
  },
  {
    id: 'agent_qa',
    codeId: '0x4',
    name: 'Rex',
    role: 'qa_engineer',
    title: 'PostgreSQL & Test Suite Auditor',
    avatarSeed: 4,
    color: '#f59e0b',
    hairColor: '#475569',
    skinColor: '#fed7aa',
    shirtColor: '#d97706',
    x: 495,
    y: 310,
    targetX: 495,
    targetY: 310,
    deskX: 495,
    deskY: 310,
    currentRoomId: 'room_engineering',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.1,
    isSupervisor: false,
    stats: {
      tasksCompleted: 19,
      tokensUsed: 14800,
      executionTimeMs: 12600,
      linesOfCode: 920
    },
    speechBubble: {
      text: "PostgreSQL & FastAPI validation harness armed.",
      expiresAt: Date.now() + 6500
    }
  },
  {
    id: 'agent_data',
    codeId: '0x5',
    name: 'Maya',
    role: 'data_analyst',
    title: 'PostgreSQL Analytics & Risk Model',
    avatarSeed: 5,
    color: '#ec4899',
    hairColor: '#312e81',
    skinColor: '#fed7aa',
    shirtColor: '#db2777',
    x: 75,
    y: 430,
    targetX: 75,
    targetY: 430,
    deskX: 75,
    deskY: 430,
    currentRoomId: 'room_engineering',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.4,
    isSupervisor: false,
    stats: {
      tasksCompleted: 15,
      tokensUsed: 18100,
      executionTimeMs: 14300,
      linesOfCode: 740
    },
    speechBubble: {
      text: "PostgreSQL transaction analytics ready.",
      expiresAt: Date.now() + 7500
    }
  },
  {
    id: 'agent_security',
    codeId: '0x6',
    name: 'Cipher',
    role: 'security_devops',
    title: 'PostgreSQL Audit Logger & SecOps Guard',
    avatarSeed: 6,
    color: '#8b5cf6',
    hairColor: '#022c22',
    skinColor: '#fed7aa',
    shirtColor: '#7c3aed',
    x: 215,
    y: 430,
    targetX: 215,
    targetY: 430,
    deskX: 215,
    deskY: 430,
    currentRoomId: 'room_engineering',
    state: 'idle',
    model: 'gemini-3.7-flash',
    temperature: 0.1,
    isSupervisor: false,
    stats: {
      tasksCompleted: 22,
      tokensUsed: 21400,
      executionTimeMs: 16100,
      linesOfCode: 680
    },
    speechBubble: {
      text: "PostgreSQL audit log recorder & file logger active.",
      expiresAt: Date.now() + 8500
    }
  }
];

export const INITIAL_DESKS: OfficeDesk[] = [
  // Boss Executive Desk in Cabin
  { id: 'desk_supervisor', agentId: 'agent_supervisor', x: 105, y: 100, direction: 'south', roomId: 'room_director' },
  // Bullpen Row 1 Desks
  { id: 'desk_vk', agentId: 'agent_vk', x: 75, y: 310, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_ro', agentId: 'agent_ro', x: 215, y: 310, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_mid1', agentId: '', x: 355, y: 310, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_qa', agentId: 'agent_qa', x: 495, y: 310, direction: 'south', roomId: 'room_engineering' },
  // Bullpen Row 2 Desks
  { id: 'desk_data', agentId: 'agent_data', x: 75, y: 430, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_security', agentId: 'agent_security', x: 215, y: 430, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_mid2', agentId: '', x: 355, y: 430, direction: 'south', roomId: 'room_engineering' },
  { id: 'desk_extra', agentId: '', x: 495, y: 430, direction: 'south', roomId: 'room_engineering' },
  // Lab / Server room desks
  { id: 'desk_lab1', agentId: '', x: 710, y: 90, direction: 'south', roomId: 'room_server' },
  { id: 'desk_lab2', agentId: '', x: 840, y: 90, direction: 'south', roomId: 'room_server' }
];

export const DEFAULT_SETTINGS: HarnessSettings = {
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'phi3:mini',
  geminiModel: 'gemini-3.7-flash',
  useGeminiAsFallback: true,
  defaultEngine: 'gemini',
  simulationSpeed: 1.2,
  soundEnabled: true,
  autonomousWandering: true
};
