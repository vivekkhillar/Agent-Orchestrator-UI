import React, { useState } from 'react';
import { Agent } from '../types';
import { X, Send, Cpu, Bot, CheckCircle2, Code2, Zap, Sliders, MessageSquare, Terminal } from 'lucide-react';

interface AgentInspectorModalProps {
  agent: Agent | null;
  onClose: () => void;
  onUpdateAgentModel: (agentId: string, model: Agent['model']) => void;
  onDirectPrompt: (agentId: string, message: string) => void;
}

export const AgentInspectorModal: React.FC<AgentInspectorModalProps> = ({
  agent,
  onClose,
  onUpdateAgentModel,
  onDirectPrompt
}) => {
  const [directInput, setDirectInput] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'agent'; text: string; time: string }[]>([
    {
      sender: 'agent',
      text: agent?.speechBubble?.text || `Hello! I'm ${agent?.name}, standing by for directives.`,
      time: 'Just now'
    }
  ]);
  const [isReplying, setIsReplying] = useState(false);

  if (!agent) return null;

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directInput.trim() || isReplying) return;

    const userText = directInput.trim();
    setDirectInput('');

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog(prev => [...prev, { sender: 'user', text: userText, time: nowStr }]);
    setIsReplying(true);

    // Call callback
    onDirectPrompt(agent.id, userText);

    // Generate quick agent response
    setTimeout(() => {
      setIsReplying(false);
      setChatLog(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `Roger that. Executing directive with ${agent.model}. Updating workspace AST and running validation pass now.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-mono text-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-850 border-b border-slate-800 text-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-md"
              style={{ backgroundColor: agent.color }}
            >
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">{agent.name}</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
                  {agent.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">{agent.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-auto space-y-4 flex-1">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase">Tasks Solved</span>
              <div className="text-base font-bold text-slate-100 mt-0.5">
                {agent.stats.tasksCompleted}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase">Tokens Consumed</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">
                {agent.stats.tokensUsed.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-750">
              <span className="text-[10px] text-slate-400 uppercase">Lines of Code</span>
              <div className="text-base font-bold text-sky-400 mt-0.5">
                {agent.stats.linesOfCode.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Model Engine Configuration for this Agent */}
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-750 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="font-bold text-slate-200">LLM Inference Backend</div>
                <div className="text-[10px] text-slate-400">Select model provider for {agent.name.split(' ')[0]}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={agent.model}
                onChange={(e) => {
                  onUpdateAgentModel(agent.id, e.target.value as Agent['model']);
                }}
                className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-xs cursor-pointer"
              >
                <option value="ollama:phi3:mini">Ollama - phi3:mini (Local)</option>
                <option value="gemini-3.7-flash">Google Gemini 3.7 Flash</option>
                <option value="ollama:llama3">Ollama - llama3:8b (Local)</option>
              </select>
            </div>
          </div>

          {/* Direct 1-on-1 Chat / Directive Log */}
          <div className="border border-slate-750 rounded-xl bg-slate-950 overflow-hidden flex flex-col h-56">
            <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-slate-300 font-bold text-[11px]">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Direct Communication Channel</span>
            </div>

            <div className="flex-1 p-3 overflow-auto space-y-2.5">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-xl text-xs font-sans leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-slate-850 border border-slate-700 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
              {isReplying && (
                <div className="flex items-center gap-2 text-slate-500 text-[11px] italic">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                  {agent.name} is formulating response...
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendPrompt} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={directInput}
                onChange={(e) => setDirectInput(e.target.value)}
                placeholder={`Instruct ${agent.name.split(' ')[0]} directly...`}
                className="flex-1 bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={!directInput.trim() || isReplying}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
