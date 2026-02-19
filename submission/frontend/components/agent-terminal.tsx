"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

type AgentId = "alpha" | "beta";

interface LogLine {
  type: "status" | "thinking" | "tool_call" | "tx" | "error" | "done" | "warn";
  text?: string;
  tool?: string;
  args?: Record<string, any>;
  hash?: string;
  action?: string;
  explorer?: string;
  message?: string;
  guardrail?: boolean;
  ts: number;
}

interface AgentTerminalProps {
  agentId: AgentId;
  onTxComplete?: () => void;
}

const AGENT_LABELS: Record<AgentId, { name: string; badge: string; badgeClass: string }> = {
  alpha: {
    name: "Agent Alpha",
    badge: "GUARDRAILED",
    badgeClass: "text-orange-400 border-orange-500/50 bg-orange-500/10",
  },
  beta: {
    name: "Agent Beta",
    badge: "FREE",
    badgeClass: "text-green-400 border-green-500/50 bg-green-500/10",
  },
};

function ToolCallLine({ line }: { line: LogLine }) {
  const argStr = line.args
    ? Object.entries(line.args)
        .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 30)}`)
        .join(", ")
    : "";
  return (
    <span className="text-blue-400">
      ⚡ <span className="font-bold">{line.tool}</span>
      {argStr && <span className="text-blue-300/70">({argStr})</span>}
    </span>
  );
}

function TxLine({ line }: { line: LogLine }) {
  return (
    <span className="text-emerald-400">
      ✅ {line.action}
      {line.explorer && (
        <>
          {" "}
          <a
            href={line.explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-emerald-300/80 hover:text-emerald-200 text-xs"
          >
            [{line.hash?.slice(0, 8)}...]
          </a>
        </>
      )}
    </span>
  );
}

function renderLine(line: LogLine) {
  switch (line.type) {
    case "status":
      return <span className="text-slate-400">&gt; {line.text}</span>;
    case "thinking":
      return <span className="text-slate-300">{line.text}</span>;
    case "tool_call":
      return <ToolCallLine line={line} />;
    case "tx":
      return <TxLine line={line} />;
    case "error":
      return (
        <span className={line.guardrail ? "text-red-400 font-bold" : "text-red-400"}>
          {line.guardrail ? "🚫 " : "❌ "}
          {line.message}
        </span>
      );
    case "warn":
      return <span className="text-yellow-400">⚠ {line.text}</span>;
    case "done":
      return <span className="text-slate-500">─── session complete ───</span>;
    default:
      return <span className="text-slate-400">{line.text}</span>;
  }
}

export function AgentTerminal({ agentId, onTxComplete }: AgentTerminalProps) {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const label = AGENT_LABELS[agentId];

  const addLine = useCallback((line: Omit<LogLine, "ts">) => {
    setLines((prev) => [...prev, { ...line, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setLines([]);
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/agent/stream?agentId=${agentId}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const event = JSON.parse(line);
            addLine(event);
            if (event.type === "tx" && onTxComplete) onTxComplete();
            if (event.type === "done") break;
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        addLine({ type: "error", message: err.message, guardrail: false });
      }
    } finally {
      setRunning(false);
    }
  }, [agentId, running, addLine, onTxComplete]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  return (
    <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-slate-100">🤖 {label.name}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${label.badgeClass}`}>
            {label.badge}
          </span>
          {running && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              running
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {running ? (
            <Button size="sm" variant="ghost" onClick={stop} className="h-6 text-xs text-red-400 hover:text-red-300">
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={run}
              className="h-6 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100"
            >
              ▶ Run
            </Button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div className="h-64 overflow-y-auto p-3 font-mono text-xs leading-relaxed space-y-0.5">
        {lines.length === 0 && !running && (
          <span className="text-slate-600">Press Run to launch {label.name}...</span>
        )}
        {lines.map((line, i) => (
          <div key={i}>{renderLine(line)}</div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
