import React from 'react';
import { SubTask, Agent } from '../types';
import { CheckCircle2, Clock, PlayCircle, AlertCircle, ArrowRight, GitBranch, Cpu, Code2, ShieldAlert } from 'lucide-react';

interface SubTaskGraphProps {
  subtasks: SubTask[];
  agents: Agent[];
  activeSubtaskId: string | null;
  onSelectSubtask: (subtask: SubTask) => void;
}

export const SubTaskGraph: React.FC<SubTaskGraphProps> = ({
  subtasks,
  agents,
  activeSubtaskId,
  onSelectSubtask
}) => {
  const getAgent = (agentId: string) => agents.find(a => a.id === agentId);

  const getStatusIcon = (status: SubTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-sky-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'queued':
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryColor = (cat: SubTask['category']) => {
    switch (cat) {
      case 'python':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'typescript':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'qa':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'research':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      case 'devops':
      case 'architecture':
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  if (!subtasks || subtasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono">
        <GitBranch className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-300">No Workflow DAG Active</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Submit an engineering prompt to generate an autonomous DAG decomposition graph with agent dependencies.
        </p>
      </div>
    );
  }

  const supervisor = agents.find(a => a.isSupervisor);

  return (
    <div className="flex flex-col h-full bg-slate-950 p-4 overflow-auto font-mono text-xs text-slate-200">
      {/* Root Node: Supervisor Plan */}
      <div className="bg-slate-900 border border-indigo-500/50 rounded-xl p-3.5 mb-6 shadow-xl relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
            <h3 className="font-bold text-xs text-indigo-300 uppercase tracking-wide">
              Supervisor Orchestration Root: {supervisor?.name || 'Marcus Chen'}
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
            {subtasks.length} Subtasks Decomposed
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
          The main supervisor has analyzed requirements and synchronized 5 parallel and sequential execution streams.
        </p>

        {/* Tree stem line */}
        <div className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-indigo-500/60" />
      </div>

      {/* Subtask Nodes Grid */}
      <div className="space-y-3 relative">
        {subtasks.map((task, index) => {
          const agent = getAgent(task.assignedAgentId);
          const isSelected = task.id === activeSubtaskId;

          return (
            <div
              key={task.id}
              onClick={() => {
                onSelectSubtask(task);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 shadow-xl ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    STEP {index + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-100">{task.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded border ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                  {getStatusIcon(task.status)}
                </div>
              </div>

              {/* Task Description */}
              <p className="text-[11px] text-slate-400 font-sans mb-3 line-clamp-2">
                {task.description}
              </p>

              {/* Agent Attribution & Progress */}
              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] text-white"
                    style={{ backgroundColor: agent?.color || '#6366f1' }}
                  >
                    {agent?.name.charAt(0) || 'A'}
                  </div>
                  <span className="text-slate-300 font-medium">{agent?.name}</span>
                  <span className="text-slate-500">({agent?.title})</span>
                </div>

                {task.generatedCode && (
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
                    <Code2 className="w-3 h-3" /> {task.generatedCode.filename}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-2.5">
                <div
                  className={`h-full transition-all duration-300 ${
                    task.status === 'completed'
                      ? 'bg-emerald-400'
                      : task.status === 'in_progress'
                      ? 'bg-sky-400 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
