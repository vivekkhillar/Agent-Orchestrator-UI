import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, FileCode, Download, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export interface CodeFile {
  id: string;
  filename: string;
  language: 'python' | 'typescript' | 'json' | 'markdown';
  content: string;
  authorAgentName: string;
  authorRole: string;
}

interface CodeSandboxProps {
  files: CodeFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

export const CodeSandbox: React.FC<CodeSandboxProps> = ({
  files,
  activeFileId,
  onSelectFile
}) => {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [executionStats, setExecutionStats] = useState<{ durationMs: number; returnCode: number } | null>(null);

  const currentFile = files.find(f => f.id === activeFileId) || files[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunScript = async () => {
    if (!currentFile) return;
    setIsRunning(true);
    setTerminalOutput(`>>> Initializing Python 3.11 harness runtime...\n>>> Loading module: ${currentFile.filename}\n>>> Executing AST...`);

    try {
      const response = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentFile.content, language: currentFile.language })
      });
      const data = await response.json();
      
      setTimeout(() => {
        setIsRunning(false);
        setTerminalOutput(data.stdout || data.stderr || 'Execution finished with code 0.');
        setExecutionStats({
          durationMs: data.executionTimeMs || 34,
          returnCode: data.returnCode || 0
        });
      }, 500);
    } catch (err: any) {
      setIsRunning(false);
      setTerminalOutput(`Execution error: ${err.message}`);
      setExecutionStats({ durationMs: 12, returnCode: 1 });
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono">
        <FileCode className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm font-bold text-slate-300">No Code Artifacts Yet</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Dispatch an engineering assignment to the Supervisor Marcus Chen to generate Python, TypeScript, and Pytest code artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden font-mono text-xs">
      {/* File Tabs Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-2 py-1 overflow-x-auto">
        <div className="flex items-center gap-1">
          {files.map((file) => {
            const isActive = currentFile?.id === file.id;
            return (
              <button
                key={file.id}
                onClick={() => {
                  onSelectFile(file.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-mono transition-colors border-t-2 ${
                  isActive
                    ? 'bg-slate-950 text-indigo-400 border-indigo-500 font-bold'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200 border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{file.filename}</span>
                <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-normal">
                  {file.language}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
            title="Download File"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-md transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Python'}</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-slate-200 border-b border-slate-800">
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 mb-2 border-b border-slate-800/80">
          <span>Author: <strong className="text-indigo-300">{currentFile?.authorAgentName}</strong> ({currentFile?.authorRole})</span>
          <span>Lines: {currentFile?.content.split('\n').length} | Encoding: UTF-8</span>
        </div>
        <pre className="text-slate-200 whitespace-pre font-mono">
          {currentFile?.content.split('\n').map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900/60">
              <span className="w-8 select-none text-slate-600 text-right pr-3 font-mono text-[10px]">
                {idx + 1}
              </span>
              <span className={
                line.startsWith('#') || line.startsWith('//') || line.startsWith('"""') 
                  ? 'text-slate-500 italic'
                  : line.includes('def ') || line.includes('class ') || line.includes('async ')
                  ? 'text-indigo-400 font-bold'
                  : line.includes('import ') || line.includes('from ')
                  ? 'text-purple-400'
                  : line.includes('return ') || line.includes('await ')
                  ? 'text-pink-400'
                  : 'text-slate-200'
              }>
                {line}
              </span>
            </div>
          ))}
        </pre>
      </div>

      {/* Terminal Output Drawer */}
      <div className="h-44 bg-slate-900 border-t border-slate-800 flex flex-col">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-850 border-b border-slate-800 text-[11px]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-slate-300 uppercase tracking-wider">
              Runtime Execution Output
            </span>
          </div>
          {executionStats && (
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Exit Code: {executionStats.returnCode}
              </span>
              <span className="text-slate-400">
                Time: {executionStats.durationMs}ms
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 p-3 overflow-auto bg-black/80 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap leading-tight">
          {terminalOutput || (
            <span className="text-slate-500">
              Click &quot;Run Python&quot; above to execute the selected script inside the sandbox harness.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
