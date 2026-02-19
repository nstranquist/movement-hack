"use client";

import { useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MODULE_ADDRESS, getAptosClient, getExplorerUrl } from "@/lib/contract";

interface SubmitWorkDialogProps {
  children: React.ReactNode;
  bountyId: number;
  onSuccess: () => void;
}

export function SubmitWorkDialog({ children, bountyId, onSuccess }: SubmitWorkDialogProps) {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const encoder = new TextEncoder();

  const handleSubmit = async () => {
    if (!account) return toast.error("No wallet connected");
    if (!note.trim()) return toast.error("Submission note is required");

    setIsLoading(true);
    const loadingToast = toast.loading("Preparing transaction...");

    try {
      const noteBytes = Array.from(encoder.encode(note.trim()));

      toast.loading("Waiting for wallet approval...", { id: loadingToast });

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::bounty_board::submit_bounty`,
          functionArguments: [bountyId, noteBytes],
        },
      });

      toast.loading("Confirming transaction...", { id: loadingToast });

      const aptos = getAptosClient(network?.chainId);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Work submitted!</span>
          <a
            href={getExplorerUrl(response.hash, network?.chainId)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
          >
            View on Explorer →
          </a>
        </div>,
        { id: loadingToast, duration: 8000 }
      );

      setNote("");
      setOpen(false);
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      toast.error(message, { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Your Work</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Proof of Work</label>
            <Input
              placeholder="Describe what you did or paste a link..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? "Submitting..." : "Submit Work"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
