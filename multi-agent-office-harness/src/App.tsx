import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent, OfficeRoom, OfficeDesk, TaskAssignment, SubTask, TelemetryLog, HarnessSettings } from './types';
import { INITIAL_AGENTS, INITIAL_ROOMS, INITIAL_DESKS, DEFAULT_SETTINGS } from './data/initialState';
import { Header } from './components/Header';
import { OfficeCanvas } from './components/OfficeCanvas';
import { CommandCenter } from './components/CommandCenter';
import { AgentRoster } from './components/AgentRoster';
import { CodeFile } from './components/CodeSandbox';

// Helper to generate realistic paths around walls and through cabin door
function getPathToBossCabin(startX: number, startY: number): { x: number; y: number }[] {
  return [
    { x: startX, y: 235 },      // Walk into bullpen central aisle
    { x: 200, y: 235 },         // Walk along aisle to corridor
    { x: 200, y: 160 },         // Walk through Boss Cabin doorway
    { x: 105, y: 140 }          // Stand in front of Boss executive desk
  ];
}

function getPathToDesk(deskX: number, deskY: number): { x: number; y: number }[] {
  return [
    { x: 105, y: 140 },         // Stand in front of Boss desk
    { x: 200, y: 160 },         // Exit through Boss Cabin doorway
    { x: 200, y: 235 },         // Corridor to bullpen aisle
    { x: deskX, y: 235 },       // Aisle above workstation
    { x: deskX, y: deskY }      // Workstation desk chair
  ];
}

// Helper to route agents directly into the PostgreSQL Database & Server Room (Room 0x3, Port 5432)
function getPathToPostgres(startX: number, startY: number): { x: number; y: number }[] {
  return [
    { x: startX, y: 235 },      // Walk into central bullpen aisle
    { x: 710, y: 235 },         // Walk along corridor past conference room to PostgreSQL room doorway
    { x: 710, y: 190 },         // Walk through PostgreSQL server room doorway
    { x: 710, y: 120 }          // Stand directly at PostgreSQL Database Console Terminal (5432)
  ];
}

// Helper to route agents from PostgreSQL Server Room back to their workstation desk
function getPathFromPostgresToDesk(deskX: number, deskY: number): { x: number; y: number }[] {
  return [
    { x: 710, y: 120 },         // Stand at PostgreSQL Database Terminal
    { x: 710, y: 190 },         // Exit through PostgreSQL room doorway
    { x: 710, y: 235 },         // Corridor outside server room
    { x: deskX, y: 235 },       // Aisle above workstation desk
    { x: deskX, y: deskY }      // Workstation desk chair
  ];
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [rooms] = useState<OfficeRoom[]>(INITIAL_ROOMS);
  const [desks] = useState<OfficeDesk[]>(INITIAL_DESKS);
  const [settings, setSettings] = useState<HarnessSettings>(DEFAULT_SETTINGS);

  const [currentTask, setCurrentTask] = useState<TaskAssignment | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [isArchitectureDocOpen, setIsArchitectureDocOpen] = useState(false);

  const [logs, setLogs] = useState<TelemetryLog[]>([
    {
      id: 'init_1',
      timestamp: Date.now() - 15000,
      agentId: 'agent_supervisor',
      agentName: 'EVA',
      agentRole: 'supervisor',
      type: 'orchestration',
      message: 'Boss EVA [0x1] ready in Executive Cabin. FastAPI Banking Orchestrator online.'
    },
    {
      id: 'init_2',
      timestamp: Date.now() - 10000,
      agentId: 'agent_vk',
      agentName: 'VK',
      agentRole: 'balance_specialist',
      type: 'orchestration',
      message: 'Specialist VK ready at Desk 1: Dedicated to Balance Inquiry intent.'
    },
    {
      id: 'init_3',
      timestamp: Date.now() - 5000,
      agentId: 'agent_ro',
      agentName: 'RO',
      agentRole: 'statement_specialist',
      type: 'orchestration',
      message: 'Specialist RO ready at Desk 2: Dedicated to Account Statement intent.'
    }
  ]);

  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dispatch' | 'workflow' | 'code' | 'analytics' | 'settings' | 'monitor' | 'tasks' | 'triggers' | 'memory' | 'workers' | 'audit' | 'telemetry'>('dispatch');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('agent_supervisor');
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [ollamaStatus, setOllamaStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Local Ollama Docker container not checked yet.'
  });

  // Safe Fetch Helper to prevent unexpected end of JSON input or HTML fallback
  const safeJsonPost = async (url: string, body: any, fallback: any = {}) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await res.text();
      if (!text || text.trim() === '') {
        return fallback;
      }
      try {
        return JSON.parse(text);
      } catch {
        return fallback;
      }
    } catch (err: any) {
      console.warn(`[SafeFetch] Error querying ${url}:`, err);
      return fallback;
    }
  };

  // Dynamically fetch live Python source files & prompts from FastAPI backend
  const fetchSourceFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/source_files');
      const data = await res.json();
      if (data.success && data.files && data.files.length > 0) {
        setCodeFiles(data.files);
        setActiveFileId(prev => prev || data.files[0].id);
      }
    } catch (err) {
      console.warn('[SourceFiles] Could not fetch live files:', err);
    }
  }, []);

  // Check health and Ollama status on mount
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setHasGeminiKey(data.hasGeminiKey !== false);
    } catch {
      setHasGeminiKey(true);
    }
  }, []);

  const checkOllamaStatus = useCallback(async () => {
    try {
      const data = await safeJsonPost('/api/ollama/status', { endpoint: settings.ollamaEndpoint }, {
        connected: false,
        message: 'Could not connect to Ollama.'
      });
      setOllamaStatus({
        connected: !!data.connected,
        message: data.message || 'Ollama connection checked.'
      });
    } catch (err: any) {
      setOllamaStatus({
        connected: false,
        message: 'Could not connect to Ollama: ' + err.message
      });
    }
  }, [settings.ollamaEndpoint]);

  useEffect(() => {
    checkHealth();
    checkOllamaStatus();
    fetchSourceFiles();
  }, [checkHealth, checkOllamaStatus, fetchSourceFiles]);

  // Main Real-Time Animation & Waypoint Path Interpolation Loop
  useEffect(() => {
    if (isFrozen) return;

    const interval = setInterval(() => {
      setAgents((prevAgents) => {
        return prevAgents.map((agent) => {
          const stepSpeed = 3.5 * settings.simulationSpeed;

          // If agent has active waypoints list
          if (agent.waypoints && agent.waypoints.length > 0) {
            const currentIndex = agent.currentWaypointIndex || 0;
            const currentWaypoint = agent.waypoints[currentIndex];

            if (!currentWaypoint) {
              return { ...agent, waypoints: undefined, currentWaypointIndex: 0 };
            }

            const dx = currentWaypoint.x - agent.x;
            const dy = currentWaypoint.y - agent.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 3.5) {
              const nextX = agent.x + (dx / dist) * Math.min(stepSpeed, dist);
              const nextY = agent.y + (dy / dist) * Math.min(stepSpeed, dist);
              return {
                ...agent,
                x: nextX,
                y: nextY
              };
            } else {
              // Reached current waypoint
              const nextIndex = currentIndex + 1;
              if (nextIndex < agent.waypoints.length) {
                return {
                  ...agent,
                  x: currentWaypoint.x,
                  y: currentWaypoint.y,
                  currentWaypointIndex: nextIndex,
                  targetX: agent.waypoints[agent.waypoints.length - 1].x,
                  targetY: agent.waypoints[agent.waypoints.length - 1].y
                };
              } else {
                // Completed all waypoints to destination!
                const finalPoint = agent.waypoints[agent.waypoints.length - 1];
                return {
                  ...agent,
                  x: finalPoint.x,
                  y: finalPoint.y,
                  targetX: finalPoint.x,
                  targetY: finalPoint.y,
                  waypoints: undefined,
                  currentWaypointIndex: 0
                };
              }
            }
          }

          // Direct linear step if target is different and no waypoints
          const dx = agent.targetX - agent.x;
          const dy = agent.targetY - agent.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 3) {
            const nextX = agent.x + (dx / dist) * Math.min(stepSpeed, dist);
            const nextY = agent.y + (dy / dist) * Math.min(stepSpeed, dist);
            return {
              ...agent,
              x: nextX,
              y: nextY
            };
          } else {
            return {
              ...agent,
              x: agent.targetX,
              y: agent.targetY
            };
          }
        });
      });
    }, 35);

    return () => clearInterval(interval);
  }, [settings.simulationSpeed, isFrozen]);

  // Autonomous Wandering for Idle Agents (Periodic background vitality)
  useEffect(() => {
    if (!settings.autonomousWandering || isRunning || isFrozen) return;

    const wanderInterval = setInterval(() => {
      setAgents((prev) => {
        const idleAgents = prev.filter(a => a.state === 'idle' && !a.activeTaskId && !a.isSupervisor);
        if (idleAgents.length === 0) return prev;

        const luckyAgent = idleAgents[Math.floor(Math.random() * idleAgents.length)];
        const wanderOptions = [
          { x: 800, y: 280, speech: "Grabbing fresh espresso from the cafe bar...", state: 'coffee' as const },
          { x: 420, y: 110, speech: "Checking the whiteboard sprint notes...", state: 'meeting' as const },
          { x: 780, y: 100, speech: "Checking server nodes in lab...", state: 'walking' as const },
          { x: luckyAgent.deskX, y: luckyAgent.deskY, speech: "Back to my desk terminal.", state: 'idle' as const }
        ];

        const chosen = wanderOptions[Math.floor(Math.random() * wanderOptions.length)];

        return prev.map(a => {
          if (a.id === luckyAgent.id) {
            return {
              ...a,
              targetX: chosen.x,
              targetY: chosen.y,
              state: 'walking',
              speechBubble: {
                text: chosen.speech,
                expiresAt: Date.now() + 5000
              }
            };
          }
          return a;
        });
      });
    }, 14000);

    return () => clearInterval(wanderInterval);
  }, [settings.autonomousWandering, isRunning, isFrozen]);

  // Helper to append logs
  const addLog = useCallback((log: Omit<TelemetryLog, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      ...prev,
      {
        ...log,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now()
      }
    ]);
  }, []);

  // Update specific agent helper
  const updateAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
  }, []);

  // Handle Manual floor click to command an agent to walk
  const handleAgentMove = (agentId: string, targetX: number, targetY: number) => {
    updateAgent(agentId, {
      targetX,
      targetY,
      state: 'walking',
      waypoints: undefined,
      speechBubble: {
        text: `Moving to floor coordinates (${targetX}, ${targetY})`,
        expiresAt: Date.now() + 4000
      }
    });
  };

  // Main "Boss-Sub-Agent" Handshake Real-Time Movement Pipeline
  const handleDispatchTask = async (prompt: string) => {
    if (!prompt || !prompt.trim()) return;
    setIsRunning(true);

    // 1. Boss EVA receives prompt in Cabin [0x1]
    updateAgent('agent_supervisor', {
      state: 'idle',
      x: 105,
      y: 85,
      targetX: 105,
      targetY: 85,
      speechBubble: {
        text: "Analyzing query with LLM Orchestrator...",
        expiresAt: Date.now() + 6000
      }
    });

    setActiveStage("1/4: DISPATCHING QUERY TO FASTAPI LANGGRAPH ORCHESTRATOR");

    addLog({
      agentId: 'agent_supervisor',
      agentName: 'EVA',
      agentRole: 'supervisor',
      type: 'orchestration',
      message: `[Boss EVA @ Cabin 0x1] Received task: "${prompt}". Dispatching to FastAPI Orchestrator for intent classification and parameter extraction.`
    });

    try {
      // 2. Call FastAPI backend orchestrator directly
      const orchData = await safeJsonPost('/api/orchestrator/dispatch', {
        prompt
      });

      if (!orchData || orchData.success === false) {
        throw new Error(orchData?.error || orchData?.message || "Failed to reach FastAPI orchestrator");
      }

      const identifiedIntent = orchData.intent || 'other';
      const extractedAccountId = orchData.extractedAccountId || null;
      const assignedAgentName = orchData.assignedAgentName || 'Boss EVA';
      const llmReasoning = orchData.llmReasoning || `Intent classified as ${identifiedIntent.toUpperCase()}`;

      addLog({
        agentId: 'agent_supervisor',
        agentName: 'EVA',
        agentRole: 'supervisor',
        type: 'thought',
        message: `[FastAPI Orchestrator] Intent: [${identifiedIntent.toUpperCase()}] (${((orchData.intentConfidence || 0.98) * 100).toFixed(0)}% confidence). ${llmReasoning} | Target Account: ${extractedAccountId || 'None in prompt'} | Assigned: ${assignedAgentName}`
      });

      const newSubtasks: SubTask[] = (orchData.subtasks || []).map((st: any, idx: number) => ({
        id: st.id || `subtask_${idx}`,
        parentTaskId: `task_${Date.now()}`,
        title: st.title || `Subtask ${idx + 1}`,
        description: st.description || '',
        assignedAgentId: st.assignedAgentId || 'agent_vk',
        category: st.category || 'python',
        status: 'queued',
        progress: 0,
        dependencies: st.dependencies || [],
        thoughtLog: []
      }));

      const newTaskAssignment: TaskAssignment = {
        id: `task_${Date.now()}`,
        title: prompt.length > 50 ? prompt.slice(0, 48) + '...' : prompt,
        userPrompt: prompt,
        status: 'in_progress',
        supervisorPlan: orchData.plan,
        intent: identifiedIntent,
        intentConfidence: orchData.intentConfidence,
        assignedAgentName: assignedAgentName,
        subtasks: newSubtasks,
        createdAt: Date.now(),
        totalTokens: 1400,
        totalDurationMs: 0,
        rawRequests: orchData.raw_requests || (orchData.rawRequest ? [orchData.rawRequest] : []),
        rawResponses: orchData.raw_responses || (orchData.rawResponse ? [orchData.rawResponse] : []),
        llmInvocations: orchData.llm_invocations || [],
        usedEngine: orchData.usedEngine || 'gemini-3.7-flash',
        fallbackTriggered: orchData.fallbackTriggered || false
      };

      setCurrentTask(newTaskAssignment);

      const subtaskResults: any[] = [];

      // 3. Execute subtasks if present
      if (newSubtasks.length === 0) {
        setActiveStage(`BOSS EVA: DIRECT HANDLING [${identifiedIntent.toUpperCase()}]`);
        updateAgent('agent_supervisor', {
          speechBubble: {
            text: `Handling ${identifiedIntent.toUpperCase()} directly in Cabin [0x1] (Zero DB calls).`,
            expiresAt: Date.now() + 6000
          }
        });
        await new Promise(r => setTimeout(r, 1000 / settings.simulationSpeed));
      } else {
        for (let i = 0; i < newSubtasks.length; i++) {
          const subtask = newSubtasks[i];
          const assignedAgent = agents.find(a => a.id === subtask.assignedAgentId) || agents[1];

          // --- SUBSTEP A: Boss calls subagent to the cabin ---
          setActiveStage(`STAGE ${i + 1}/${newSubtasks.length}: BRIEFING ${assignedAgent.name.toUpperCase()} IN CABIN`);

          updateAgent('agent_supervisor', {
            speechBubble: {
              text: `${assignedAgent.name}, report to Executive Cabin for task: "${subtask.title}"`,
              expiresAt: Date.now() + 5000
            }
          });

          addLog({
            agentId: 'agent_supervisor',
            agentName: 'EVA',
            agentRole: 'supervisor',
            type: 'delegation',
            message: `[Boss EVA -> ${assignedAgent.name}] Briefing assignment: "${subtask.title}".`
          });

          // --- SUBSTEP B: Subagent walks in real-time to Boss Cabin ---
          const pathToCabin = getPathToBossCabin(assignedAgent.x, assignedAgent.y);
          const finalCabinPoint = pathToCabin[pathToCabin.length - 1];

          updateAgent(assignedAgent.id, {
            state: 'walking_to_boss',
            waypoints: pathToCabin,
            currentWaypointIndex: 0,
            targetX: finalCabinPoint.x,
            targetY: finalCabinPoint.y,
            speechBubble: {
              text: "Heading to Boss Cabin for task briefing...",
              expiresAt: Date.now() + 4000
            }
          });

          await new Promise(r => setTimeout(r, 2000 / settings.simulationSpeed));

          updateAgent(assignedAgent.id, {
            x: 105,
            y: 140,
            targetX: 105,
            targetY: 140,
            state: 'in_boss_cabin',
            waypoints: undefined,
            speechBubble: {
              text: `Ready Boss EVA! Executing ${subtask.title}.`,
              expiresAt: Date.now() + 4000
            }
          });

          await new Promise(r => setTimeout(r, 1200 / settings.simulationSpeed));

          // --- SUBSTEP C: Subagent walks to PostgreSQL Server Room ---
          setActiveStage(`STAGE ${i + 1}/${newSubtasks.length}: ${assignedAgent.name.toUpperCase()} QUERYING POSTGRESQL`);

          const pathToPostgres = getPathToPostgres(105, 140);
          const finalPostgresPoint = pathToPostgres[pathToPostgres.length - 1];

          updateAgent(assignedAgent.id, {
            state: 'walking_to_postgres',
            waypoints: pathToPostgres,
            currentWaypointIndex: 0,
            targetX: finalPostgresPoint.x,
            targetY: finalPostgresPoint.y,
            activeTaskId: subtask.id,
            speechBubble: {
              text: "Heading to PostgreSQL Server Room to fetch live database records...",
              expiresAt: Date.now() + 4000
            }
          });

          setCurrentTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              subtasks: prev.subtasks.map(s => s.id === subtask.id ? { ...s, status: 'in_progress', progress: 30 } : s)
            };
          });

          await new Promise(r => setTimeout(r, 2000 / settings.simulationSpeed));

          // --- SUBSTEP D: Subagent queries PostgreSQL via FastAPI backend ---
          updateAgent(assignedAgent.id, {
            x: 710,
            y: 120,
            targetX: 710,
            targetY: 120,
            state: 'querying_db',
            waypoints: undefined,
            speechBubble: {
              text: `Querying PostgreSQL ledger${extractedAccountId ? ` for ${extractedAccountId}` : ''} in ₹ (INR)...`,
              expiresAt: Date.now() + 5000
            }
          });

          const execData = await safeJsonPost('/api/agent/execute_subtask', {
            subtask,
            agent: assignedAgent,
            prompt,
            accountId: extractedAccountId
          });

          subtaskResults.push(execData);

          const thoughts = execData?.thoughtLog || [];
          for (const t of thoughts) {
            addLog({
              agentId: assignedAgent.id,
              agentName: assignedAgent.name,
              agentRole: assignedAgent.role,
              type: 'thought',
              message: `[${assignedAgent.name} @ DB Room] ${t}`
            });
          }

          const speech = execData?.speechSummary || `${assignedAgent.name} finished querying PostgreSQL database.`;

          updateAgent(assignedAgent.id, {
            speechBubble: {
              text: speech,
              expiresAt: Date.now() + 5000
            }
          });

          await new Promise(r => setTimeout(r, 1800 / settings.simulationSpeed));

          // --- SUBSTEP E: Return to Desk ---
          setActiveStage(`STAGE ${i + 1}/${newSubtasks.length}: ${assignedAgent.name.toUpperCase()} RETURNING TO WORKSTATION DESK`);

          const pathToDesk = getPathFromPostgresToDesk(assignedAgent.deskX, assignedAgent.deskY);
          const finalDeskPoint = pathToDesk[pathToDesk.length - 1];

          updateAgent(assignedAgent.id, {
            state: 'walking_to_desk',
            waypoints: pathToDesk,
            currentWaypointIndex: 0,
            targetX: finalDeskPoint.x,
            targetY: finalDeskPoint.y,
            speechBubble: {
              text: "Returning to desk to assemble FastAPI service...",
              expiresAt: Date.now() + 4000
            }
          });

          await new Promise(r => setTimeout(r, 2000 / settings.simulationSpeed));

          // --- SUBSTEP F: Coding at Desk ---
          setActiveStage(`STAGE ${i + 1}/${newSubtasks.length}: ${assignedAgent.name.toUpperCase()} CODING & RUNNING FASTAPI MICROSERVICE`);

          updateAgent(assignedAgent.id, {
            x: assignedAgent.deskX,
            y: assignedAgent.deskY,
            targetX: assignedAgent.deskX,
            targetY: assignedAgent.deskY,
            state: 'coding',
            waypoints: undefined,
            speechBubble: {
              text: "Building FastAPI router, validating schemas, and executing endpoint...",
              expiresAt: Date.now() + 5000
            }
          });

          if (execData?.code) {
            const newFile: CodeFile = {
              id: `file_${subtask.id}`,
              filename: execData.code.filename,
              language: execData.code.language,
              content: execData.code.content,
              authorAgentName: assignedAgent.name,
              authorRole: assignedAgent.role
            };
            setCodeFiles(prev => [newFile, ...prev.filter(f => f.filename !== newFile.filename)]);
            setActiveFileId(newFile.id);
          }

          setCurrentTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              subtasks: prev.subtasks.map(s => s.id === subtask.id ? {
                ...s,
                status: 'in_progress',
                progress: 85,
                thoughtLog: execData?.thoughtLog || [],
                generatedCode: execData?.code,
                executionOutput: execData?.executionOutput
              } : s)
            };
          });

          await new Promise(r => setTimeout(r, 1600 / settings.simulationSpeed));

          // --- SUBSTEP G: Carry to Boss Cabin to Submit ---
          setActiveStage(`STAGE ${i + 1}/${newSubtasks.length}: ${assignedAgent.name.toUpperCase()} SUBMITTING TO BOSS CABIN`);

          const pathToCabinSubmission = getPathToBossCabin(assignedAgent.deskX, assignedAgent.deskY);
          const finalSubmitPoint = pathToCabinSubmission[pathToCabinSubmission.length - 1];

          updateAgent(assignedAgent.id, {
            state: 'walking_to_submit',
            waypoints: pathToCabinSubmission,
            currentWaypointIndex: 0,
            targetX: finalSubmitPoint.x,
            targetY: finalSubmitPoint.y,
            speechBubble: {
              text: "Task completed! Carrying response to Boss Cabin.",
              expiresAt: Date.now() + 4000
            }
          });

          await new Promise(r => setTimeout(r, 2000 / settings.simulationSpeed));

          updateAgent(assignedAgent.id, {
            x: 105,
            y: 140,
            targetX: 105,
            targetY: 140,
            state: 'submitting',
            waypoints: undefined,
            speechBubble: {
              text: `Boss EVA, here is the verified result!`,
              expiresAt: Date.now() + 5000
            },
            stats: {
              ...assignedAgent.stats,
              tasksCompleted: assignedAgent.stats.tasksCompleted + 1,
              tokensUsed: assignedAgent.stats.tokensUsed + 650,
              executionTimeMs: assignedAgent.stats.executionTimeMs + 1800
            }
          });

          updateAgent('agent_supervisor', {
            speechBubble: {
              text: `Verified ${assignedAgent.name}'s submission!`,
              expiresAt: Date.now() + 5000
            }
          });

          setCurrentTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              subtasks: prev.subtasks.map(s => s.id === subtask.id ? {
                ...s,
                status: 'completed',
                progress: 100,
                thoughtLog: execData?.thoughtLog || [],
                generatedCode: execData?.code,
                executionOutput: execData?.executionOutput
              } : s)
            };
          });

          addLog({
            agentId: 'agent_supervisor',
            agentName: 'EVA',
            agentRole: 'supervisor',
            type: 'orchestration',
            message: `[Boss EVA @ Cabin 0x1] Approved submission from ${assignedAgent.name}. Subtask "${subtask.title}" verified.`
          });

          await new Promise(r => setTimeout(r, 1600 / settings.simulationSpeed));

          // Return to desk
          const pathToDeskFinal = getPathToDesk(assignedAgent.deskX, assignedAgent.deskY);
          updateAgent(assignedAgent.id, {
            state: 'walking_to_desk',
            waypoints: pathToDeskFinal,
            currentWaypointIndex: 0,
            targetX: assignedAgent.deskX,
            targetY: assignedAgent.deskY,
            activeTaskId: undefined,
            speechBubble: {
              text: "Returning to desk.",
              expiresAt: Date.now() + 3000
            }
          });

          await new Promise(r => setTimeout(r, 1600 / settings.simulationSpeed));

          updateAgent(assignedAgent.id, {
            x: assignedAgent.deskX,
            y: assignedAgent.deskY,
            targetX: assignedAgent.deskX,
            targetY: assignedAgent.deskY,
            state: 'idle',
            waypoints: undefined
          });
        }
      }

      // 4. Boss EVA Calls FastAPI Synthesis Endpoint
      setActiveStage("BOSS EVA: SYNTHESIZING FINAL RESPONSE VIA LLM");

      const synthRes = await safeJsonPost('/api/eva/synthesize', {
        intent: identifiedIntent,
        prompt,
        subtaskResults,
        accountId: extractedAccountId
      });

      const finalMsg = synthRes?.customer_response || "Inquiry processed successfully by First Digital Treasury.";

      setCurrentTask(prev => {
        if (!prev) return null;
        const updatedRawReqs = synthRes?.rawRequest ? [...(prev.rawRequests || []), synthRes.rawRequest] : prev.rawRequests;
        const updatedRawResps = synthRes?.rawResponse ? [...(prev.rawResponses || []), synthRes.rawResponse] : prev.rawResponses;
        return {
          ...prev,
          rawRequests: updatedRawReqs,
          rawResponses: updatedRawResps,
          status: 'completed',
          completedAt: Date.now(),
          finalCustomerResponse: finalMsg
        };
      });

      updateAgent('agent_supervisor', {
        speechBubble: {
          text: `Response synthesized! "${finalMsg.slice(0, 80)}..."`,
          expiresAt: Date.now() + 10000
        },
        stats: {
          ...agents[0].stats,
          tasksCompleted: agents[0].stats.tasksCompleted + 1,
          tokensUsed: agents[0].stats.tokensUsed + 1800
        }
      });

      addLog({
        agentId: 'agent_supervisor',
        agentName: 'EVA',
        agentRole: 'supervisor',
        type: 'orchestration',
        message: `[Boss EVA -> Customer Response] ${finalMsg}`
      });

    } catch (err: any) {
      addLog({
        agentId: 'agent_supervisor',
        agentName: 'EVA',
        agentRole: 'supervisor',
        type: 'error',
        message: `Execution error: ${err.message}`
      });
      setCurrentTask(prev => prev ? { ...prev, status: 'failed' } : null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d140e] text-slate-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        settings={settings}
        isRunning={isRunning}
        activeTaskTitle={currentTask?.title}
        hasGeminiKey={hasGeminiKey}
        ollamaStatus={ollamaStatus}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Workspace (Left: 2D Retro Office Canvas, Right: Command Center) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: 2D Office Canvas Floor */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden p-2 bg-[#0a0f0b]">
          <OfficeCanvas
            agents={agents}
            rooms={rooms}
            desks={desks}
            selectedAgentId={selectedAgentId}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
            onAgentMove={handleAgentMove}
            simulationSpeed={settings.simulationSpeed}
            activeMovementStage={activeStage}
          />
        </div>

        {/* Right Column: Command Center & Terminal */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden p-2 pl-0 bg-[#0a0f0b]">
          <CommandCenter
            currentTask={currentTask}
            logs={logs}
            agents={agents}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onDispatchTask={handleDispatchTask}
            isRunning={isRunning}
            codeFiles={codeFiles}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            activeSubtaskId={activeSubtaskId}
            onSelectSubtask={(st) => setActiveSubtaskId(st.id)}
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(prev => ({ ...prev, ...newSettings }))}
            ollamaStatus={ollamaStatus}
            hasGeminiKey={hasGeminiKey}
            onCheckOllama={checkOllamaStatus}
            activeStage={activeStage}
            isFrozen={isFrozen}
            onFreezeToggle={() => setIsFrozen(f => !f)}
          />
        </div>
      </div>

      {/* Bottom Row: Agent Floor Roster Cards */}
      <AgentRoster
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={(agentId) => {
          setSelectedAgentId(agentId);
        }}
      />
    </div>
  );
}
