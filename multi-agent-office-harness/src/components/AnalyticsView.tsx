import React, { useState, useEffect } from 'react';
import { Agent, TaskAssignment, AgentActivityRecord } from '../types';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Clock, 
  CheckCircle, 
  BarChart3, 
  Database, 
  ShieldCheck, 
  Flame,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface AnalyticsViewProps {
  agents: Agent[];
  tasks: TaskAssignment[];
  ollamaStatus: { connected: boolean; message: string };
  hasGeminiKey: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  agents,
  tasks,
  ollamaStatus,
  hasGeminiKey
}) => {
  const [activities, setActivities] = useState<AgentActivityRecord[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('ALL');

  const totalTokens = agents.reduce((sum, a) => sum + a.stats.tokensUsed, 0);
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.stats.tasksCompleted, 0);
  const totalLoc = agents.reduce((sum, a) => sum + a.stats.linesOfCode, 0);
  const avgLatencyMs = Math.round(
    agents.reduce((sum, a) => sum + a.stats.executionTimeMs, 0) / Math.max(1, totalTasksCompleted)
  );

  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const res = await fetch('/api/agent/activities?limit=50');
      if (res.ok) {
        const text = await res.text();
        if (text && (text.startsWith('{') || text.startsWith('['))) {
          const data = JSON.parse(text);
          if (data.activities && Array.isArray(data.activities)) {
            setActivities(data.activities);
          }
        }
      }
    } catch (err) {
      console.warn('Agent activity sync standby:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    let timer: any;
    if (autoRefresh) {
      timer = setInterval(fetchActivities, 3000);
    }
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const filteredActivities = activities.filter((act) => {
    const matchesAgent = selectedAgentFilter === 'ALL' || act.agent_id === selectedAgentFilter;
    const matchesSearch = 
      !searchQuery.trim() ||
      act.task_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.agent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-[#0c130e] p-4 overflow-auto font-mono text-xs text-slate-200 gap-5">
      {/* High Level KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121c15] border border-[#233527] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Tokens</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {totalTokens.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">₹ Standard Ledger Active</div>
        </div>

        <div className="bg-[#121c15] border border-[#233527] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Completed Tasks</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {totalTasksCompleted}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">across {agents.length} floor agents</div>
        </div>

        <div className="bg-[#121c15] border border-[#233527] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">Lines of Code</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono">
            {totalLoc.toLocaleString()}
          </div>
          <div className="text-[10px] text-sky-400 mt-1">FastAPI Python Microservices</div>
        </div>

        <div className="bg-[#121c15] border border-[#233527] rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider">DB Activity Count</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {activities.length} Records
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">Live in PostgreSQL</div>
        </div>
      </div>

      {/* Real-Time Database Agent Activity Ledger */}
      <div className="bg-[#121c15] border border-[#25392a] rounded-xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Live Database Agent Activity Ledger
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PostgreSQL Sync Active
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search DB activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-6 pr-2 py-1 bg-[#0b120d] border border-[#2b3e30] rounded text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
              />
            </div>

            {/* Agent Filter Dropdown */}
            <select
              value={selectedAgentFilter}
              onChange={(e) => setSelectedAgentFilter(e.target.value)}
              className="bg-[#0b120d] border border-[#2b3e30] rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Agents</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.name} [{ag.codeId}]
                </option>
              ))}
            </select>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2 py-1 rounded text-[10px] font-mono flex items-center gap-1 border transition-all ${
                autoRefresh
                  ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700/80'
                  : 'bg-[#18261c] text-slate-400 border-[#2b3e30]'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingActivities ? 'animate-spin' : ''}`} />
              <span>Live Feed: {autoRefresh ? 'ON' : 'PAUSED'}</span>
            </button>
          </div>
        </div>

        {/* Activities Table */}
        <div className="border border-[#25392a] rounded-lg overflow-hidden bg-[#0a100c]">
          <div className="overflow-x-auto max-h-[340px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#152219] text-[10px] text-slate-400 font-bold border-b border-[#25392a] uppercase tracking-wider sticky top-0">
                  <th className="py-2 px-3">Time (IST)</th>
                  <th className="py-2 px-3">Agent</th>
                  <th className="py-2 px-3">Action Type</th>
                  <th className="py-2 px-3">Task &amp; Details</th>
                  <th className="py-2 px-3">Currency</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2f22] text-[11px] font-mono">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No matching agent activity records in PostgreSQL database.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const agent = agents.find((a) => a.id === act.agent_id);
                    const formattedTime = (() => {
                      if (!act.timestamp) return '–';
                      try {
                        const d = new Date(act.timestamp);
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
                      return act.timestamp.includes('[IST]') ? act.timestamp.slice(11, 23) + ' IST' : act.timestamp;
                    })();

                    return (
                      <tr key={act.id} className="hover:bg-[#131f16] transition-colors">
                        <td className="py-2 px-3 text-emerald-400 whitespace-nowrap text-[10px] font-semibold" title={act.timestamp}>
                          {formattedTime}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div 
                              className="w-4 h-4 rounded flex items-center justify-center font-bold text-[8px] text-white"
                              style={{ backgroundColor: agent?.color || '#10b981' }}
                            >
                              {act.agent_name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-200 text-[10.5px]">
                              {act.agent_name}
                            </span>
                            <span className="text-[9px] text-emerald-400">
                              [{agent?.codeId || '0x'}]
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-[#17251c] text-emerald-300 border border-[#2b3e30] text-[9.5px]">
                            {act.action_type}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300 max-w-xs sm:max-w-md truncate">
                          <div className="font-semibold text-slate-100 truncate">{act.task_title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{act.details}</div>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-emerald-400 font-bold">
                          {act.currency_symbol} {act.currency}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[9.5px] font-bold">
                            ✓ {act.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Agent Workload & Token Distribution Breakdown */}
      <div className="bg-[#121c15] border border-[#25392a] rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          Workload Distribution by Sub-Agent
        </h3>

        <div className="space-y-3">
          {agents.map((agent) => {
            const tokenPct = Math.round((agent.stats.tokensUsed / Math.max(1, totalTokens)) * 100);
            return (
              <div key={agent.id} className="p-2.5 bg-[#0e1710] rounded-lg border border-[#233527]">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: agent.color }} 
                    />
                    <span className="font-bold text-slate-200">{agent.name}</span>
                    <span className="text-slate-400 text-[10px]">({agent.title})</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                    <span>{agent.stats.tasksCompleted} Tasks Completed</span>
                    <span>{agent.stats.tokensUsed.toLocaleString()} Tokens ({tokenPct}%)</span>
                    <span className="text-emerald-400">{agent.model.replace('ollama:', '')}</span>
                  </div>
                </div>

                <div className="w-full bg-[#1b2b1f] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tokenPct}%`,
                      backgroundColor: agent.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engine Status Diagnostic Card */}
      <div className="bg-[#121c15] border border-[#25392a] rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          Inference Engine &amp; PostgreSQL Service Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ollama Local Docker Box */}
          <div className="p-3 bg-[#0e1710] border border-[#233527] rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-200">Ollama Local (Docker)</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${ollamaStatus.connected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-[#18261c] text-slate-400 border-[#283b2d]'}`}>
                {ollamaStatus.connected ? 'ONLINE' : 'STANDBY READY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {ollamaStatus.message}
            </p>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">
              Model: phi3:mini / llama3:8b
            </div>
          </div>

          {/* Google Gemini Cloud Engine */}
          <div className="p-3 bg-[#0e1710] border border-[#233527] rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-200">Google Gemini 3.7 Flash</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${hasGeminiKey ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                {hasGeminiKey ? 'KEY ATTACHED' : 'READY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Provides server-side reasoning, decomposition planning, and code synthesis via Google GenAI SDK.
            </p>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">
              Endpoint: /api/orchestrator/dispatch
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
