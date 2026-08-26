import React from 'react';
import { Bot, Cpu, Maximize2 } from 'lucide-react';
import { HarnessSettings } from '../types';

interface HeaderProps {
  settings: HarnessSettings;
  isRunning: boolean;
  activeTaskTitle?: string;
  hasGeminiKey: boolean;
  ollamaStatus: { connected: boolean; message: string };
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isRunning,
  activeTaskTitle,
  hasGeminiKey,
  ollamaStatus,
  onOpenSettings
}) => {
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="bg-[#1b261e] border-b-2 border-[#283b2e] px-4 py-2 flex items-center justify-between shadow-lg text-slate-100 flex-wrap gap-2">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-xs shadow">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-mono text-xs font-bold text-white tracking-wide uppercase">
            Multi-Agent Office Harness
          </span>
        </div>
      </div>

      {/* Engine & Quick Controls */}
      <div className="flex items-center gap-2">
        {/* Model Provider Pill */}
        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 bg-[#141e17] hover:bg-[#19271c] border border-[#2b3e30] rounded px-2.5 py-1 text-xs cursor-pointer transition-all text-slate-200"
          title="Configure Engine"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[10px]">
            Engine: <strong className="text-emerald-300">{settings.defaultEngine === 'gemini' ? 'Gemini 3.7' : 'Ollama phi3'}</strong>
          </span>
          <span className={`w-2 h-2 rounded-full ${hasGeminiKey || ollamaStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleToggleFullscreen}
          className="p-1.5 bg-[#141e17] hover:bg-[#19271c] text-slate-300 border border-[#2b3e30] rounded transition-colors"
          title="Fullscreen Toggle"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};

