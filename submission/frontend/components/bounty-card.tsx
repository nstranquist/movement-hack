"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { SubmitWorkDialog } from "@/components/submit-work-dialog";
import { toast } from "sonner";
import { Bounty, STATUS } from "@/types/bounty";
import { MODULE_ADDRESS, getAptosClient, getExplorerUrl, octasToMove } from "@/lib/contract";

interface BountyCardProps {
  bounty: Bounty;
  agentAddress: string;
  onRefresh: () => void;
}

function truncate(addr: string): string {
  if (!addr || addr === "0x0") return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function BountyCard({ bounty, agentAddress, onRefresh }: BountyCardProps) {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const myAddress = account?.address?.toString() ?? "";
  const isCreator = bounty.creator === myAddress;
  const isHunter = bounty.hunter === myAddress;
  const isAgent = bounty.hunter.toLowerCase() === agentAddress.toLowerCase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runTx = async (fn: string, args: any[], label: string) => {
    if (!account) return toast.error("No wallet connected");
    setIsLoading(true);
    const loadingToast = toast.loading(`${label}...`);
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: { function: `${MODULE_ADDRESS}::bounty_board::${fn}`, functionArguments: args },
      });
      toast.loading("Confirming...", { id: loadingToast });
      await getAptosClient(network?.chainId).waitForTransaction({ transactionHash: response.hash });
      toast.success(
        <div className="flex flex-col gap-1">
          <span>{label} confirmed!</span>
          <a href={getExplorerUrl(response.hash, network?.chainId)} target="_blank" rel="noopener noreferrer" className="text-xs underline">
            View on Explorer →
          </a>
        </div>,
        { id: loadingToast, duration: 8000 }
      );
      onRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      toast.error(message, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col gap-0">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{bounty.title}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAgent && (
              <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-0.5 text-xs font-medium">
                🤖 Agent
              </span>
            )}
            <StatusBadge status={bounty.status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{bounty.description}</p>

        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{octasToMove(bounty.bounty_amount)} MOVE</span>
          <span className="text-muted-foreground text-xs">by {truncate(bounty.creator)}</span>
        </div>

        {bounty.status === STATUS.CLAIMED || bounty.status === STATUS.SUBMITTED || bounty.status === STATUS.COMPLETED ? (
          <div className="text-xs text-muted-foreground">
            Hunter: {truncate(bounty.hunter)}
          </div>
        ) : null}

        {bounty.submission_note && bounty.status >= STATUS.SUBMITTED && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground italic">
            &ldquo;{bounty.submission_note}&rdquo;
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {bounty.status === STATUS.OPEN && !isCreator && (
            <Button
              size="sm"
              className="flex-1"
              disabled={isLoading}
              onClick={() => runTx("claim_bounty", [bounty.id], "Claiming bounty")}
            >
              Claim
            </Button>
          )}
          {bounty.status === STATUS.CLAIMED && isHunter && (
            <SubmitWorkDialog bountyId={bounty.id} onSuccess={onRefresh}>
              <Button size="sm" variant="outline" className="flex-1" disabled={isLoading}>
                Submit Work
              </Button>
            </SubmitWorkDialog>
          )}
          {bounty.status === STATUS.SUBMITTED && isCreator && (
            <Button
              size="sm"
              className="flex-1"
              disabled={isLoading}
              onClick={() => runTx("approve_bounty", [bounty.id], "Approving bounty")}
            >
              Approve & Pay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
