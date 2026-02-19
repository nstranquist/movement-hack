"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentConfig } from "@/types/bounty";
import { octasToMove } from "@/lib/contract";

interface AgentPanelProps {
  config: AgentConfig;
}

function truncate(addr: string): string {
  if (!addr || addr === "0x0") return "Not configured";
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

export function AgentPanel({ config }: AgentPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(config.agentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConfigured = config.agentAddress !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span>🤖</span>
          <span>AI Agent Guardrails</span>
          <span className={`ml-auto inline-flex items-center gap-1 text-xs font-medium ${isConfigured ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
            <span className={`h-2 w-2 rounded-full ${isConfigured ? "bg-green-500" : "bg-gray-400"}`} />
            {isConfigured ? "Active" : "Not configured"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Agent Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
              {truncate(config.agentAddress)}
            </code>
            {isConfigured && (
              <button
                onClick={copyAddress}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Max Claim Cap</p>
            <p className="font-semibold text-foreground mt-0.5">
              {isConfigured ? `${octasToMove(config.maxClaimAmount)} MOVE` : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">Total Escrowed</p>
            <p className="font-semibold text-foreground mt-0.5">
              {octasToMove(config.totalEscrowed)} MOVE
            </p>
          </div>
        </div>

        {isConfigured && (
          <p className="text-xs text-muted-foreground bg-orange-50 dark:bg-orange-950 rounded-md px-3 py-2 border border-orange-200 dark:border-orange-800">
            The Move VM will reject any claim by this agent that exceeds{" "}
            <strong>{octasToMove(config.maxClaimAmount)} MOVE</strong>. Try it — the contract enforces this, not app logic.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
