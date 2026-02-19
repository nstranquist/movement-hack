"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function NetworkToggle() {
  const { network, wallet, connected } = useWallet();

  const chainId = network?.chainId;
  const isMainnet = chainId === 126;
  const isTestnet = chainId === 250;
  const isNightly = wallet?.name?.toLowerCase().includes("nightly");

  const label = isMainnet ? "Mainnet" : isTestnet ? "Testnet" : connected ? `Chain ${chainId ?? "?"}` : "No Wallet";
  const dotColor = isMainnet ? "bg-green-500" : isTestnet ? "bg-yellow-500" : "bg-gray-400";

  const switchTo = async (target: "mainnet" | "testnet") => {
    const targetChainId = target === "mainnet" ? 126 : 250;
    const targetLabel = target === "mainnet" ? "Mainnet" : "Testnet";

    if (!connected) {
      toast.error("Connect a wallet first");
      return;
    }

    if (chainId === targetChainId) {
      toast.info(`Already on ${targetLabel}`);
      return;
    }

    if (isNightly && typeof window !== "undefined" && (window as any).nightly?.aptos?.changeNetwork) {
      try {
        await (window as any).nightly.aptos.changeNetwork({ chainId: targetChainId, name: "custom" });
        toast.success(`Switched to Movement ${targetLabel}`);
      } catch (err: any) {
        toast.error(err.message || `Failed to switch to ${targetLabel}`);
      }
    } else {
      toast.info(`Please switch to ${targetLabel} (Chain ID ${targetChainId}) in your wallet manually.`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchTo("mainnet")} className="gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Mainnet
          {isMainnet && <span className="ml-auto text-xs text-muted-foreground">current</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchTo("testnet")} className="gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          Testnet
          {isTestnet && <span className="ml-auto text-xs text-muted-foreground">current</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
