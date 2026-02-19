"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { BountyCard } from "@/components/bounty-card";
import { AgentPanel } from "@/components/agent-panel";
import { AgentTerminal } from "@/components/agent-terminal";
import { CreateBountyDialog } from "@/components/create-bounty-dialog";
import { WalletSelectionModal } from "@/components/wallet-selection-modal";
import { Bounty, AgentConfig } from "@/types/bounty";
import { fetchAllBounties, fetchAgentConfig } from "@/lib/contract";

const NULL_AGENT_CONFIG: AgentConfig = {
  agentAddress: "0x0000000000000000000000000000000000000000000000000000000000000000",
  maxClaimAmount: 0,
  totalEscrowed: 0,
};

export function BountyBoard() {
  const { connected, network } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(NULL_AGENT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([
        fetchAllBounties(network?.chainId),
        fetchAgentConfig(network?.chainId),
      ]);
      setBounties(b);
      setAgentConfig(a);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch chain data:", err);
      setError("Could not load bounties. Make sure the contract is deployed.");
    } finally {
      setIsLoading(false);
    }
  }, [network?.chainId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const activeBounties = bounties.filter((b) => b.status < 3);
  const completedBounties = bounties.filter((b) => b.status >= 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bounty Board</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading..." : `${bounties.length} bounties on Movement Network`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <CreateBountyDialog onSuccess={refresh}>
              <Button>+ Post Bounty</Button>
            </CreateBountyDialog>
          ) : (
            <WalletSelectionModal>
              <Button variant="outline">Connect Wallet</Button>
            </WalletSelectionModal>
          )}
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            ↻
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main board */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-16">Loading bounties...</div>
          ) : activeBounties.length === 0 && completedBounties.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium">No bounties yet</p>
              <p className="text-sm mt-1">Post the first one to get started</p>
            </div>
          ) : (
            <>
              {activeBounties.length > 0 && (
                <div className="space-y-3">
                  {activeBounties.map((bounty) => (
                    <BountyCard
                      key={bounty.id}
                      bounty={bounty}
                      agentAddress={agentConfig.agentAddress}
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              )}
              {completedBounties.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
                  {completedBounties.map((bounty) => (
                    <BountyCard
                      key={bounty.id}
                      bounty={bounty}
                      agentAddress={agentConfig.agentAddress}
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <AgentPanel config={agentConfig} />
        </div>
      </div>

      {/* AI Agent Demo Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Live Agent Demo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real AI agents operating on-chain. Alpha is guardrailed by the Move VM — it cannot claim
            bounties over 0.5 MOVE no matter what.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AgentTerminal agentId="alpha" onTxComplete={refresh} />
          <AgentTerminal agentId="beta" onTxComplete={refresh} />
        </div>
      </div>
    </div>
  );
}
