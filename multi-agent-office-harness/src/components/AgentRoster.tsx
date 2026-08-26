import React from 'react';
import { Agent } from '../types';
import { MessageSquare, Sparkles, UserCheck, Terminal, Cpu } from 'lucide-react';

interface AgentRosterProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent
}) => {
  const getStateBadge = (state: Agent['state']) => {
    switch (state) {
      case 'walking_to_boss':
        return { label: 'to boss', bg: 'bg-amber-950/80 text-amber-300 border-amber-600/70 animate-pulse' };
      case 'in_boss_cabin':
        return { label: 'briefing', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/70 animate-pulse' };
      case 'walking_to_desk':
        return { label: 'to desk', bg: 'bg-sky-950/80 text-sky-300 border-sky-600/70 animate-pulse' };
      case 'coding':
        return { label: 'coding', bg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 animate-pulse' };
      case 'walking_to_submit':
        return { label: 'submitting', bg: 'bg-pink-950/80 text-pink-300 border-pink-600/70 animate-pulse' };
      case 'submitting':
        return { label: 'submitted', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 animate-pulse' };
      case 'walking':
        return { label: 'walking', bg: 'bg-purple-950/80 text-purple-300 border-purple-600/70' };
      case 'meeting':
        return { label: 'sync', bg: 'bg-blue-950/80 text-blue-300 border-blue-600/70' };
      case 'coffee':
        return { label: 'cafe', bg: 'bg-rose-950/80 text-rose-300 border-rose-600/70' };
      case 'idle':
      default:
        return { label: 'idle', bg: 'bg-[#15241a] text-emerald-400 border-emerald-700/60' };
    }
  };

  return (
    <div className="bg-[#152019] border-t-2 border-[#26372b] px-3 py-2 text-slate-200">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Floor Workers Roster ({agents.length})
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            Autonomous Handshake &amp; Execution
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Click card to track in 2D Office
        </div>
      </div>

      {/* Grid of Agent Cards matching bottom row in screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {agents.map((agent) => {
          const isSelected = agent.id === selectedAgentId;
          const badge = getStateBadge(agent.state);

          return (
            <div
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent.id);
              }}
              className={`p-2 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#223528] border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                  : 'bg-[#111a14] hover:bg-[#19271e] border-[#2b3e30]'
              }`}
            >
              {/* Card Top: Avatar + Name + Status Badge */}
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <div 
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center font-bold text-[9px] text-white shadow"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <div className="font-mono text-[11px] font-bold text-slate-100 truncate flex items-center gap-1">
                      {agent.name}
                      <span className="text-[9px] text-emerald-400 font-normal">
                        [{agent.codeId}]
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded border font-semibold ${badge.bg}`}
                >
                  {badge.label}
                </span>
              </div>

              {/* Card Mid: Role Title */}
              <div className="text-[9px] text-slate-400 truncate mb-1">
                {agent.title}
              </div>

              {/* Card Bottom: Model tag + Stats */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 border-t border-[#26372b] pt-1 mt-0.5">
                <span className="text-emerald-300/80 truncate text-[8.5px]">
                  {agent.model.replace('ollama:', '')}
                </span>

                <span className="text-[8.5px] px-1.5 py-0.2 bg-[#17251c] text-emerald-300 rounded border border-[#273a2c]">
                  ✓ {agent.stats.tasksCompleted}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
