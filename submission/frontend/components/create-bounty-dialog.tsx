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
import { MODULE_ADDRESS, getAptosClient, getExplorerUrl, moveToOctas } from "@/lib/contract";

interface CreateBountyDialogProps {
  children: React.ReactNode;
  onSuccess: () => void;
}

export function CreateBountyDialog({ children, onSuccess }: CreateBountyDialogProps) {
  const { account, signAndSubmitTransaction, network } = useWallet();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const encoder = new TextEncoder();

  const handleCreate = async () => {
    if (!account) return toast.error("No wallet connected");
    if (!title.trim()) return toast.error("Title is required");
    if (!description.trim()) return toast.error("Description is required");
    const moveAmount = parseFloat(amount);
    if (!moveAmount || moveAmount <= 0) return toast.error("Enter a valid MOVE amount");

    setIsLoading(true);
    const loadingToast = toast.loading("Preparing transaction...");

    try {
      const titleBytes = Array.from(encoder.encode(title.trim()));
      const descBytes = Array.from(encoder.encode(description.trim()));
      const octas = moveToOctas(moveAmount);

      toast.loading("Waiting for wallet approval...", { id: loadingToast });

      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${MODULE_ADDRESS}::bounty_board::create_bounty`,
          functionArguments: [titleBytes, descBytes, octas],
        },
      });

      toast.loading("Confirming transaction...", { id: loadingToast });

      const aptos = getAptosClient(network?.chainId);
      await aptos.waitForTransaction({ transactionHash: response.hash });

      toast.success(
        <div className="flex flex-col gap-1">
          <span>Bounty created!</span>
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

      setTitle("");
      setDescription("");
      setAmount("");
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
          <DialogTitle>Post a Bounty</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g. Write a haiku about Move"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Reward (MOVE)</label>
            <Input
              type="number"
              placeholder="0.01"
              min="0.001"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleCreate} disabled={isLoading} className="w-full">
            {isLoading ? "Posting..." : "Post Bounty"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
