import React, { useState, useEffect, useRef } from 'react';
import { TaskAssignment, SubTask, Agent, TelemetryLog, HarnessSettings } from '../types';
import { SubTaskGraph } from './SubTaskGraph';
import { CodeSandbox, CodeFile } from './CodeSandbox';
import { AnalyticsView } from './AnalyticsView';
import { 
  Terminal, 
  GitBranch, 
  Code2, 
  BarChart2, 
  Settings, 
  Send, 
  Sparkles, 
  Play, 
  Pause,
  RefreshCw, 
  Cpu, 
  CheckCircle2, 
  MessageSquare, 
  Zap,
  Mic,
  MicOff,
  Paperclip,
  Activity,
  Layers,
  Flame,
  Snowflake,
  Eye,
  Sliders,
  FileCode,
  FileText,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search
} from 'lucide-react';

interface CommandCenterProps {
  currentTask: TaskAssignment | null;
  logs: TelemetryLog[];
  agents: Agent[];
  activeTab: 'dispatch' | 'workflow' | 'code' | 'analytics' | 'settings' | 'monitor' | 'tasks' | 'triggers' | 'memory' | 'workers' | 'audit';
  onChangeTab: (tab: any) => void;
  onDispatchTask: (prompt: string) => void;
  isRunning: boolean;
  codeFiles: CodeFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  activeSubtaskId: string | null;
  onSelectSubtask: (subtask: SubTask) => void;
  settings: HarnessSettings;
  onUpdateSettings: (newSettings: Partial<HarnessSettings>) => void;
  ollamaStatus: { connected: boolean; message: string };
  hasGeminiKey: boolean;
  onCheckOllama: () => void;
  activeStage?: string | null;
  onFreezeToggle?: () => void;
  isFrozen?: boolean;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  currentTask,
  logs,
  agents,
  activeTab,
  onChangeTab,
  onDispatchTask,
  isRunning,
  codeFiles,
  activeFileId,
  onSelectFile,
  activeSubtaskId,
  onSelectSubtask,
  settings,
  onUpdateSettings,
  ollamaStatus,
  hasGeminiKey,
  onCheckOllama,
  activeStage,
  onFreezeToggle,
  isFrozen = false
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [auditLogContent, setAuditLogContent] = useState<string>('');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'STEP' | 'ERROR' | 'VALIDATION' | 'LLM'>('ALL');
  const [batchSearchFilter, setBatchSearchFilter] = useState('');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [autoRefreshAudit, setAutoRefreshAudit] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const bossAgent = agents.find(a => a.isSupervisor) || agents[0];

  // Auto scroll terminal to bottom on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, activeStage]);

  // Fetch live audit log from server safely
  const fetchAuditLog = async () => {
    try {
      setIsLoadingAudit(true);
      const res = await fetch('/api/logs/audit?limit=250');
      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data.logs)) {
              setAuditLogContent(data.logs.join('\n'));
            } else if (typeof data.logs === 'string') {
              setAuditLogContent(data.logs);
            } else {
              setAuditLogContent('');
            }
          } catch {
            setAuditLogContent(text);
          }
        }
      }
    } catch (err) {
      console.warn('Audit log standby:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLog();
    }
  }, [activeTab]);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'audit' && autoRefreshAudit) {
      interval = setInterval(fetchAuditLog, 2500);
    }
    return () => clearInterval(interval);
  }, [activeTab, autoRefreshAudit]);

  const handleSubmitPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isRunning) return;
    onDispatchTask(promptInput.trim());
    setPromptInput('');
  };

  const allTabs = [
    { id: 'dispatch', label: '> terminal', icon: Terminal },
    { id: 'audit', label: '📜 step audit log', icon: FileText },
    { id: 'telemetry', label: '⚡ raw llm', icon: Cpu },
    { id: 'monitor', label: '👁 monitor', icon: Eye },
    { id: 'tasks', label: '✓ tasks', icon: CheckCircle2 },
    { id: 'workflow', label: '🕸 graph', icon: GitBranch },
    { id: 'code', label: '💻 sandbox', icon: Code2 },
    { id: 'analytics', label: '📊 activity', icon: BarChart2 },
    { id: 'workers', label: '👥 workers', icon: Sparkles },
    { id: 'settings', label: '⚙ settings', icon: Settings }
  ];

  // Filter audit lines safely
  const filteredAuditLines = React.useMemo(() => {
    if (!auditLogContent) return [];
    let lines = typeof auditLogContent === 'string'
      ? auditLogContent.split('\n').filter(Boolean)
      : (Array.isArray(auditLogContent) ? (auditLogContent as string[]).filter(Boolean) : []);
    
    if (batchSearchFilter.trim()) {
      const term = batchSearchFilter.trim().toLowerCase();
      lines = lines.filter(l => l.toLowerCase().includes(term));
    }

    if (auditFilter === 'ALL') return lines;
    if (auditFilter === 'STEP') return lines.filter(l => l.includes('STEP_') || l.includes('[STEP '));
    if (auditFilter === 'ERROR') return lines.filter(l => l.includes('[ERROR]') || l.includes('STEP_FAILED') || l.includes('FAIL'));
    if (auditFilter === 'VALIDATION') return lines.filter(l => l.includes('STEP_VALIDATION') || l.includes('VALIDATED') || l.includes('Validation'));
    if (auditFilter === 'LLM') return lines.filter(l => l.includes('LLM_INVOCATION') || l.includes('LLM-'));
    return lines;
  }, [auditLogContent, auditFilter, batchSearchFilter]);

  return (
    <div className="flex flex-col h-full bg-[#131b15] border-l-2 border-[#2b3e30] text-slate-100 overflow-hidden font-mono text-xs shadow-2xl">
      {/* Top Boss Header Card */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1b261e] border-b-2 border-[#26372b]">
        {/* Boss Profile Badge */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded bg-indigo-600 border border-indigo-400 flex items-center justify-center font-bold text-white shadow-md">
              {bossAgent.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1b261e] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white uppercase tracking-wider">
                {bossAgent.name}
              </span>
              <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-1 rounded border border-indigo-700/60 font-semibold">
                id: [{bossAgent.codeId}]
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80">
              Lead Banking Orchestrator &amp; Floor Boss
            </div>
          </div>
        </div>

        {/* Action Toggles: Auto Mode & ICE Freeze */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              onUpdateSettings({ simulationSpeed: settings.simulationSpeed === 1 ? 2 : 1 });
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-all ${
              settings.simulationSpeed > 1
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#152019] text-emerald-300 border-[#2e4334] hover:bg-[#1f2e24]'
            }`}
            title="Toggle Fast Auto Mode"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>auto {settings.simulationSpeed}x</span>
          </button>

          <button
            onClick={() => {
              onFreezeToggle && onFreezeToggle();
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition-all ${
              isFrozen
                ? 'bg-sky-600 text-white border-sky-400'
                : 'bg-[#152019] text-sky-300 border-[#2e4334] hover:bg-[#1f2e24]'
            }`}
            title="Freeze / Pause all office agent movement"
          >
            <Snowflake className="w-3 h-3" />
            <span>{isFrozen ? 'FROZEN' : 'ICE'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation Row */}
      <div className="flex items-center bg-[#162018] border-b border-[#26372b] px-2 py-1 overflow-x-auto gap-1 scrollbar-none">
        {allTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onChangeTab(tab.id);
              }}
              className={`px-2.5 py-1 rounded text-[10px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#273b2d] text-emerald-300 font-bold border border-emerald-600/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1c2a20]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'code' && (
                <span className="bg-[#111913] text-emerald-400 px-1 py-0.2 rounded text-[9px]">
                  {codeFiles.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Viewport */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dispatch' && (
          <div className="flex flex-col h-full bg-[#0e1610]">
            {/* Terminal Header Info Tag */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#141e16] border-b border-[#213023] text-[10px]">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span className="text-emerald-500 font-mono">#</span>
                <span>fastapi-banking-pipeline</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-normal">
                  Boss EVA ↔ Subagent VK/RO Handshake Stream
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Model: <span className="text-emerald-300">{settings.defaultEngine === 'gemini' ? 'gemini-3.7-flash' : 'phi3:mini'}</span>
              </div>
            </div>

            {/* Real-Time Live Movement Stage Banner */}
            {activeStage && (
              <div className="bg-[#1c2c20] border-b-2 border-emerald-500/80 px-3 py-2 flex items-center justify-between text-xs animate-pulse">
                <div className="flex items-center gap-2 text-emerald-300 font-bold font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>{activeStage}</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/60">
                  LIVE TRACKING
                </span>
              </div>
            )}

            {/* Live Monospace Terminal Log Viewport */}
            <div className="flex-1 p-3 overflow-auto space-y-2 font-mono text-[11px] leading-relaxed">
              {logs.map((log) => {
                const isOrch = log.type === 'orchestration' || log.type === 'delegation';
                const isCode = log.type === 'code_gen';
                const isErr = log.type === 'error';
                const isThought = log.type === 'thought';

                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded border transition-all ${
                      isOrch
                        ? 'bg-[#18261c] border-emerald-700/70 text-emerald-200'
                        : isCode
                        ? 'bg-[#13232b] border-sky-700/60 text-sky-200'
                        : isErr
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                        : isThought
                        ? 'bg-[#222116] border-amber-800/60 text-amber-200'
                        : 'bg-[#141e17] border-[#253628] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1 font-mono text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100">[{log.agentName}]</span>
                        <span className="text-slate-500">({log.agentRole})</span>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] leading-relaxed break-words whitespace-pre-line">
                      {log.message}
                    </div>
                  </div>
                );
              })}

              {/* Verified Final Customer Response Box */}
              {currentTask?.finalCustomerResponse && !isRunning && (
                <div className="p-3 bg-gradient-to-r from-[#182a1d] to-[#122318] border-2 border-emerald-500/80 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1.5 pb-1 border-b border-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      OFFICIAL CUSTOMER RESPONSE ROUTED FROM BOSS EVA [0x1]
                    </span>
                    <span className="bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded text-[9px]">
                      FASTAPI VERIFIED
                    </span>
                  </div>
                  <div className="text-emerald-100 text-xs leading-relaxed whitespace-pre-line font-mono">
                    {currentTask.finalCustomerResponse}
                  </div>
                </div>
              )}

              {isRunning && (
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs py-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Boss EVA and Subagent executing handshake &amp; FastAPI computation...</span>
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            {/* Bottom Assignment Input Area */}
            <form onSubmit={handleSubmitPrompt} className="p-2.5 bg-[#141f17] border-t-2 border-[#26372b] flex flex-col gap-2">
              {/* Target Indicator */}
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Direct Routing Target:</span>
                  <span className="text-emerald-300 font-bold">Boss EVA [0x1]</span>
                </div>
                <span className="text-[10px] bg-[#111a13] text-emerald-400 px-1.5 py-0.5 rounded border border-[#26372b]">
                  [ 0x1 ]
                </span>
              </div>

              {/* Message Text Input */}
              <div className="flex gap-2">
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Message EVA... (e.g. Check available balance for ACC-94820, or generate last 30 days statement)"
                  rows={2}
                  disabled={isRunning}
                  className="flex-1 bg-[#0b120d] border border-[#2e4334] focus:border-emerald-500 rounded p-2 text-xs text-slate-200 font-mono resize-none focus:outline-none placeholder:text-slate-600 disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmitPrompt(e);
                    }
                  }}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-slate-500 font-mono">
                  Press Ctrl+Enter or click Send
                </div>

                <button
                  type="submit"
                  disabled={!promptInput.trim() || isRunning}
                  className="px-3.5 py-1.2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-md shadow-emerald-700/30"
                >
                  <Send className="w-3 h-3" />
                  <span>Send ↵</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="flex flex-col h-full bg-[#0c130e] text-slate-200">
            {/* Top Toolbar */}
            <div className="p-3 bg-[#131d16] border-b border-[#233527] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Step-by-Step Execution &amp; Failure Validation Audit Log
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded font-mono">
                  logs/banking_audit.log
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Auto Refresh Toggle */}
                <button
                  onClick={() => setAutoRefreshAudit(!autoRefreshAudit)}
                  className={`px-2 py-1 rounded text-[10px] flex items-center gap-1 border transition-all ${
                    autoRefreshAudit
                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-600'
                      : 'bg-[#18261c] text-slate-400 border-[#283d2d]'
                  }`}
                  title="Auto-refresh log every 2.5 seconds"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                  <span>Live Stream: {autoRefreshAudit ? 'ON' : 'PAUSED'}</span>
                </button>

                {/* Manual Refresh */}
                <button
                  onClick={fetchAuditLog}
                  className="px-2 py-1 bg-[#1a281e] hover:bg-[#233729] text-slate-200 border border-[#2b4131] rounded text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  <span>Refresh</span>
                </button>

                {/* Download Log Link */}
                <a
                  href="/api/logs/download?type=audit"
                  download="banking_audit.log"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .log</span>
                </a>
              </div>
            </div>

            {/* Filter Pill Row */}
            <div className="px-3 py-2 bg-[#0f1811] border-b border-[#203124] flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="text-slate-500 font-bold flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                FILTER:
              </span>
              {(['ALL', 'STEP', 'VALIDATION', 'ERROR', 'LLM'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAuditFilter(f)}
                  className={`px-2 py-0.5 rounded transition-all font-bold ${
                    auditFilter === f
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#152218] text-slate-400 hover:text-slate-200 border border-[#243728]'
                  }`}
                >
                  {f === 'ALL' && 'All Log Lines'}
                  {f === 'STEP' && '🚀 Step Flow'}
                  {f === 'VALIDATION' && '✅ Step Validations'}
                  {f === 'ERROR' && '❌ Failures & Errors'}
                  {f === 'LLM' && '⚡ LLM Invocations'}
                </button>
              ))}
              {/* Batch ID / Text Search */}
              <div className="flex items-center gap-1 bg-[#152218] border border-[#263a2b] rounded px-2 py-0.5 ml-1">
                <Search className="w-2.5 h-2.5 text-emerald-400" />
                <input
                  type="text"
                  placeholder="Filter by batch ID / keyword..."
                  value={batchSearchFilter}
                  onChange={e => setBatchSearchFilter(e.target.value)}
                  className="bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none w-36 text-[9.5px]"
                />
                {batchSearchFilter && (
                  <button onClick={() => setBatchSearchFilter('')} className="text-slate-400 hover:text-white text-[9px]">✕</button>
                )}
              </div>

              <span className="ml-auto text-slate-500 text-[10px] whitespace-nowrap">
                Showing {filteredAuditLines.length} lines
              </span>
            </div>

            {/* Main Log Lines Viewer */}
            <div className="flex-1 p-3 overflow-auto font-mono text-[11px] leading-relaxed space-y-1 bg-[#090f0b]">
              {filteredAuditLines.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0e1610] border border-[#213224] rounded-lg">
                  No log entries matched filter [{auditFilter}]. Dispatch a prompt to begin step-by-step logging.
                </div>
              ) : (
                filteredAuditLines.map((line, idx) => {
                  const isStart = line.includes('STEP_START') || line.includes('>>> -----');
                  const isSuccess = line.includes('STEP_SUCCESS') || line.includes('[STATUS: SUCCESS]');
                  const isValidation = line.includes('STEP_VALIDATION') || line.includes('[STATUS: VALIDATED]');
                  const isError = line.includes('STEP_FAILED') || line.includes('[ERROR]') || line.includes('FAILED') || line.includes('!!! =====');
                  const isProgress = line.includes('STEP_PROGRESS') || line.includes('[STATUS: IN_PROGRESS]');
                  const isLLM = line.includes('LLM_INVOCATION');

                  let rowStyle = 'text-slate-300 bg-[#0f1712] border-slate-800/40';
                  let badge = null;

                  if (isStart) {
                    rowStyle = 'text-sky-300 bg-sky-950/40 border-sky-800/60 font-semibold';
                    badge = <span className="text-[9px] bg-sky-900 text-sky-200 px-1 py-0.2 rounded mr-1">START</span>;
                  } else if (isValidation) {
                    rowStyle = 'text-emerald-300 bg-emerald-950/40 border-emerald-700/60 font-semibold';
                    badge = <span className="text-[9px] bg-emerald-900 text-emerald-200 px-1 py-0.2 rounded mr-1">VALIDATED</span>;
                  } else if (isSuccess) {
                    rowStyle = 'text-teal-300 bg-teal-950/30 border-teal-800/50';
                    badge = <span className="text-[9px] bg-teal-900 text-teal-200 px-1 py-0.2 rounded mr-1">SUCCESS</span>;
                  } else if (isError) {
                    rowStyle = 'text-red-300 bg-red-950/50 border-red-700/80 font-bold';
                    badge = <span className="text-[9px] bg-red-900 text-red-100 px-1 py-0.2 rounded mr-1">FAILURE</span>;
                  } else if (isProgress) {
                    rowStyle = 'text-amber-200 bg-amber-950/30 border-amber-800/50';
                    badge = <span className="text-[9px] bg-amber-900 text-amber-200 px-1 py-0.2 rounded mr-1">PROGRESS</span>;
                  } else if (isLLM) {
                    rowStyle = 'text-purple-300 bg-purple-950/30 border-purple-800/50';
                    badge = <span className="text-[9px] bg-purple-900 text-purple-200 px-1 py-0.2 rounded mr-1">LLM</span>;
                  }

                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded border text-[10.5px] break-all whitespace-pre-wrap ${rowStyle}`}
                    >
                      {badge}
                      {line}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="p-4 bg-[#0e1610] h-full overflow-auto space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#243527]">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Raw LLM Invocations &amp; Telemetry (2-Tier Pipeline)</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
                Tier 1: Gemini 3.7 → Tier 2: Ollama phi3:mini
              </span>
            </div>

            {(!currentTask?.rawRequests || currentTask.rawRequests.length === 0) && (
              <div className="p-4 bg-[#141f17] border border-[#26382a] rounded text-slate-400 text-xs text-center">
                No LLM invocations recorded yet. Dispatch a task in the terminal to capture raw request and response payloads!
              </div>
            )}

            {currentTask?.rawRequests?.map((reqItem: any, idx: number) => {
              const resItem = currentTask?.rawResponses?.[idx];
              return (
                <div key={idx} className="p-3 bg-[#131e15] border border-[#273b2c] rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-[11px] pb-1 border-b border-[#203124]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-300">Invocation #{idx + 1}</span>
                      <span className="bg-[#1b2a1f] text-emerald-400 text-[10px] px-1.5 py-0.2 rounded border border-emerald-700/40">
                        {reqItem.targetEngine || 'Gemini 3.7 Flash'}
                      </span>
                      {reqItem.geminiError && (
                        <span className="bg-amber-950 text-amber-300 text-[9px] px-1.5 py-0.2 rounded border border-amber-700/60">
                          Fallback Triggered
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {reqItem.timestamp ? (
                        (() => {
                          try {
                            const d = new Date(reqItem.timestamp);
                            if (!isNaN(d.getTime())) {
                              return d.toLocaleTimeString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              }) + ' IST';
                            }
                          } catch {}
                          return String(reqItem.timestamp);
                        })()
                      ) : ''}
                    </span>
                  </div>

                  {/* Raw Request Inspector */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-sky-400 font-bold flex items-center justify-between">
                      <span>RAW REQUEST PAYLOAD</span>
                      <span className="text-slate-500 text-[9px]">{reqItem.endpoint || 'POST API'}</span>
                    </div>
                    <pre className="p-2.5 bg-[#0a100c] text-sky-200 border border-sky-900/40 rounded text-[10px] leading-relaxed overflow-x-auto max-h-48 scrollbar-thin">
{JSON.stringify(reqItem, null, 2)}
                    </pre>
                  </div>

                  {/* Raw Response Inspector */}
                  {resItem && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between">
                        <span>RAW RESPONSE PAYLOAD</span>
                        <span className="text-emerald-500 text-[9px]">Status: {resItem.status || '200 OK'} ({resItem.latencyMs || 0}ms)</span>
                      </div>
                      <pre className="p-2.5 bg-[#0a100c] text-emerald-200 border border-emerald-900/40 rounded text-[10px] leading-relaxed overflow-x-auto max-h-48 scrollbar-thin">
{JSON.stringify(resItem, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="p-4 bg-[#0e1610] h-full overflow-auto space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Real-time Office Telemetry Monitor
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {agents.map((agent) => (
                <div key={agent.id} className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-200">{agent.name} [{agent.codeId}]</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1f2f24] text-emerald-300 uppercase">
                      {agent.state.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mb-1">{agent.title}</div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    Coord: ({Math.round(agent.x)}, {Math.round(agent.y)}) → Target: ({Math.round(agent.targetX)}, {Math.round(agent.targetY)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-4 bg-[#0e1610] h-full overflow-auto space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Active Assignment Subtasks ({currentTask?.subtasks?.length || 0})
            </h3>
            {currentTask?.subtasks?.map((st, i) => (
              <div key={st.id} className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">#{i + 1} {st.title}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    st.status === 'completed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' :
                    st.status === 'in_progress' ? 'bg-sky-950 text-sky-300 border border-sky-700 animate-pulse' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {st.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mb-2">{st.description}</div>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Assigned: {agents.find(a => a.id === st.assignedAgentId)?.name || 'Agent'}</span>
                  <span>Progress: {st.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'workflow' && (
          <SubTaskGraph
            subtasks={currentTask?.subtasks || []}
            agents={agents}
            activeSubtaskId={activeSubtaskId}
            onSelectSubtask={onSelectSubtask}
          />
        )}

        {activeTab === 'code' && (
          <CodeSandbox
            files={codeFiles}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            agents={agents}
            tasks={currentTask ? [currentTask] : []}
            ollamaStatus={ollamaStatus}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeTab === 'workers' && (
          <div className="p-4 bg-[#0e1610] h-full overflow-auto space-y-3">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Office Worker Hierarchy &amp; Routing
            </h3>
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: agent.color }}>
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{agent.name} [{agent.codeId}]</div>
                      <div className="text-[10px] text-slate-400">{agent.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-emerald-300 font-mono">{agent.model}</div>
                    <div className="text-[9px] text-slate-500">Tasks Completed: {agent.stats.tasksCompleted}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 overflow-auto h-full space-y-4 text-slate-200 bg-[#0e1610]">
            <div>
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Harness Engine Configuration
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                Configure Ollama Local Docker container and Gemini API backend.
              </p>
            </div>

            {/* Inference Engine Switcher */}
            <div className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg space-y-2.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Default Inference Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ defaultEngine: 'gemini' });
                  }}
                  className={`p-2.5 rounded border text-left transition-all ${
                    settings.defaultEngine === 'gemini'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white'
                      : 'bg-[#101913] border-[#26372b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                    <Sparkles className="w-3 h-3" />
                    Google Gemini 3.7 Flash
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-sans">
                    Multi-turn reasoning &amp; code generation
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({ defaultEngine: 'ollama' });
                  }}
                  className={`p-2.5 rounded border text-left transition-all ${
                    settings.defaultEngine === 'ollama'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white'
                      : 'bg-[#101913] border-[#26372b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-sky-300">
                    <Cpu className="w-3 h-3" />
                    Ollama Local Docker
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-sans">
                    phi3:mini / llama3 on localhost:11434
                  </div>
                </button>
              </div>
            </div>

            {/* Ollama Local Docker Configuration Box */}
            <div className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-200 block">
                    Ollama Docker Endpoint (.env configured)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Reads <code className="text-emerald-400">OLLAMA_BASE_URL</code> &amp; <code className="text-emerald-400">OLLAMA_MODEL</code> from <code className="text-amber-300">.env</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCheckOllama}
                  className="px-2 py-1 bg-[#1f2f24] hover:bg-[#283c2e] text-emerald-300 border border-emerald-700/60 rounded text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Test Connection
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ollama URL (OLLAMA_BASE_URL)</label>
                  <input
                    type="text"
                    value={settings.ollamaEndpoint}
                    onChange={(e) => onUpdateSettings({ ollamaEndpoint: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full bg-[#0b120d] border border-[#2e4334] rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Ollama Model (OLLAMA_MODEL)</label>
                  <input
                    type="text"
                    value={settings.ollamaModel || 'phi3:mini'}
                    onChange={(e) => onUpdateSettings({ ollamaModel: e.target.value })}
                    placeholder="phi3:mini"
                    className="w-full bg-[#0b120d] border border-[#2e4334] rounded p-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-2 bg-[#0d1510] border border-[#233527] rounded text-[10px] text-slate-300 font-sans space-y-1">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <span>💡</span> How to configure in .env file:
                </div>
                <pre className="bg-[#050a07] p-2 rounded text-[10px] font-mono text-amber-200 overflow-x-auto">
{`# Add to your .env file:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
LOG_LEVEL=DEBUG
ENABLE_FILE_LOGGING=true`}
                </pre>
              </div>
            </div>

            {/* Audit & LLM Evaluation Log Center */}
            <div className="p-3 bg-[#152019] border border-[#283b2d] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Audit &amp; LLM Evaluation Log Files
                </label>
                <div className="flex items-center gap-1.5">
                  <a
                    href="/api/logs/download?type=audit"
                    download="banking_audit.log"
                    className="px-2 py-0.5 bg-[#1b2b20] hover:bg-[#253c2c] text-slate-300 hover:text-white border border-[#314a37] rounded text-[10px]"
                  >
                    Download Audit Log
                  </a>
                  <a
                    href="/api/logs/download?type=llm"
                    download="llm_invocations.log"
                    className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 rounded text-[10px]"
                  >
                    Download LLM Log
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Every function execution, database query, and LLM invocation (intent classification, responses) is automatically recorded with execution latency, accuracy metrics, and payload audits into <code className="text-emerald-300">logs/banking_audit.log</code> and <code className="text-emerald-300">logs/llm_invocations.log</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
