import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export const MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_MODULE_ADDRESS ??
  "0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401";

const TESTNET_FULLNODE = "https://testnet.movementnetwork.xyz/v1";
const MAINNET_FULLNODE = "https://full.mainnet.movementinfra.xyz/v1";

function getFullnode(chainId?: number): string {
  return chainId === 126 ? MAINNET_FULLNODE : TESTNET_FULLNODE;
}

// Used only for signing/submitting transactions (wallet adapter handles this)
export function getAptosClient(chainId?: number): Aptos {
  return new Aptos(new AptosConfig({ network: Network.CUSTOM, fullnode: getFullnode(chainId) }));
}

export function getExplorerUrl(txHash: string, chainId?: number): string {
  const network = chainId === 126 ? "mainnet" : "testnet";
  return `https://explorer.movementnetwork.xyz/txn/${txHash}?network=${network}`;
}

export function octasToMove(octas: number): string {
  return (octas / 1e8).toFixed(4).replace(/\.?0+$/, "");
}

export function moveToOctas(move: number): number {
  return Math.round(move * 1e8);
}

// Raw fetch for view functions — bypasses SDK hex parsing which chokes on 0x0 addresses
async function viewFunction(chainId: number | undefined, fn: string, args: unknown[] = []): Promise<unknown[]> {
  const res = await fetch(`${getFullnode(chainId)}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: fn, type_arguments: [], arguments: args }),
  });
  if (!res.ok) throw new Error(`RPC error ${res.status}: ${await res.text()}`);
  return res.json();
}

function decodeHexToString(hex: string): string {
  if (!hex || hex === "0x") return "";
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!clean || clean.length % 2 !== 0) return "";
  const bytes = new Uint8Array(clean.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return new TextDecoder().decode(bytes);
}

export interface BountyRaw {
  id: string;
  creator: string;
  title: string;
  description: string;
  bounty_amount: string;
  status: number;
  hunter: string;
  submission_note: string;
  created_at: string;
}

export async function fetchAllBounties(chainId?: number) {
  const result = await viewFunction(chainId, `${MODULE_ADDRESS}::bounty_board::get_all_bounties`);
  const raw = (result[0] as BountyRaw[]) || [];
  return raw.map((b) => ({
    id: Number(b.id),
    creator: b.creator,
    title: decodeHexToString(b.title),
    description: decodeHexToString(b.description),
    bounty_amount: Number(b.bounty_amount),
    status: Number(b.status),
    hunter: b.hunter,
    submission_note: decodeHexToString(b.submission_note),
    created_at: Number(b.created_at),
  }));
}

export async function fetchAgentConfig(chainId?: number) {
  const [agentRes, maxRes, escrowRes] = await Promise.all([
    viewFunction(chainId, `${MODULE_ADDRESS}::bounty_board::get_agent_address`),
    viewFunction(chainId, `${MODULE_ADDRESS}::bounty_board::get_max_claim_amount`),
    viewFunction(chainId, `${MODULE_ADDRESS}::bounty_board::get_total_escrowed`),
  ]);
  return {
    agentAddress: agentRes[0] as string,
    maxClaimAmount: Number(maxRes[0]),
    totalEscrowed: Number(escrowRes[0]),
  };
}
