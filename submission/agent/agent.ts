#!/usr/bin/env tsx
/**
 * BountyMove AI Agent
 *
 * Autonomous bounty hunter powered by Claude AI.
 * The on-chain guardrail in bounty_board.move caps this agent at 0.05 MOVE.
 * When it tries to claim above that, the Move VM aborts with E_AGENT_EXCEEDS_MAX.
 * That rejection IS the demo.
 *
 * Usage:
 *   npm start          # poll every 30s
 *   npm run once       # run one cycle and exit
 *
 * Requires (in submission/frontend/.env.local — run ./scripts/pull-secrets.sh):
 *   AGENT_PRIVATE_KEY=<hex>
 *   ANTHROPIC_API_KEY=<key>
 *   NEXT_PUBLIC_MODULE_ADDRESS=<address>
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// ── Load env from frontend .env.local ──────────────────────────────────────

const envPath = path.resolve(__dirname, "../frontend/.env.local");
if (!fs.existsSync(envPath)) {
  console.error(`❌  Missing env file: ${envPath}`);
  console.error("   Run: ./scripts/pull-secrets.sh");
  process.exit(1);
}
dotenv.config({ path: envPath });

// ── Config ─────────────────────────────────────────────────────────────────

const MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_MODULE_ADDRESS ??
  "0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401";

const RPC_URL = "https://full.mainnet.movementinfra.xyz/v1";
const POLL_INTERVAL_MS = 30_000;
const RUN_ONCE = process.argv.includes("--once");

// ── Validate required secrets ───────────────────────────────────────────────

if (!process.env.AGENT_PRIVATE_KEY) {
  console.error("❌  AGENT_PRIVATE_KEY not set. Run: ./scripts/pull-secrets.sh");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY not set. Run: ./scripts/pull-secrets.sh");
  process.exit(1);
}

// ── Blockchain setup ────────────────────────────────────────────────────────

const privateKey = new Ed25519PrivateKey(process.env.AGENT_PRIVATE_KEY);
const agentAccount = Account.fromPrivateKey({ privateKey });
const AGENT_ADDRESS = agentAccount.accountAddress.toString();

const aptos = new Aptos(
  new AptosConfig({ network: Network.CUSTOM, fullnode: RPC_URL })
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Bounty types ────────────────────────────────────────────────────────────

interface Bounty {
  id: number;
  creator: string;
  title: string;
  description: string;
  bounty_amount: number;
  status: number; // 0=Open, 1=Claimed, 2=Submitted, 3=Completed, 4=Cancelled
  hunter: string;
  submission_note: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function decodeHex(hex: string): string {
  if (!hex || hex === "0x") return "";
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!clean || clean.length % 2 !== 0) return "";
  return Buffer.from(clean, "hex").toString("utf8");
}

function octas(n: number): string {
  return `${(n / 1e8).toFixed(4).replace(/\.?0+$/, "")} MOVE`;
}

function explorerUrl(hash: string): string {
  return `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`;
}

// ── Contract reads ───────────────────────────────────────────────────────────

async function viewFn(fn: string, args: unknown[] = []): Promise<unknown[]> {
  const res = await fetch(`${RPC_URL}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: fn, type_arguments: [], arguments: args }),
  });
  if (!res.ok) throw new Error(`RPC ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchBounties(): Promise<Bounty[]> {
  const [result] = await viewFn(
    `${MODULE_ADDRESS}::bounty_board::get_all_bounties`
  );
  return ((result as any[]) ?? []).map((b: any) => ({
    id: Number(b.id),
    creator: b.creator as string,
    title: decodeHex(b.title),
    description: decodeHex(b.description),
    bounty_amount: Number(b.bounty_amount),
    status: Number(b.status),
    hunter: b.hunter as string,
    submission_note: decodeHex(b.submission_note),
  }));
}

// ── Contract writes ──────────────────────────────────────────────────────────

type TxResult = { success: boolean; hash?: string; error?: string };

async function sendTx(
  fn: string,
  args: (number | number[] | Uint8Array)[]
): Promise<TxResult> {
  try {
    const txn = await aptos.transaction.build.simple({
      sender: agentAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::bounty_board::${fn}` as `${string}::${string}::${string}`,
        functionArguments: args,
      },
    });
    const committed = await aptos.signAndSubmitTransaction({
      signer: agentAccount,
      transaction: txn,
    });
    await aptos.waitForTransaction({ transactionHash: committed.hash });
    return { success: true, hash: committed.hash };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

// ── Tool definitions ─────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "get_bounties",
    description:
      "Fetch all bounties from the BountyMove contract on Movement Mainnet. " +
      "Returns open bounties (status=0) and bounties you've already claimed " +
      "but not yet submitted work for (status=1, hunter=your address). " +
      "Amounts are in octas — divide by 100,000,000 for MOVE.",
    input_schema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "claim_bounty",
    description:
      "Claim an open bounty by ID. " +
      "IMPORTANT: The Move VM enforces an on-chain cap of 5,000,000 octas (0.05 MOVE). " +
      "If the bounty amount exceeds this, the VM will abort with E_AGENT_EXCEEDS_MAX (error code 9). " +
      "You should attempt to claim oversized bounties to demonstrate this guardrail — the rejection is expected and is the core demo feature.",
    input_schema: {
      type: "object" as const,
      properties: {
        bounty_id: { type: "number", description: "The numeric ID of the bounty to claim" },
      },
      required: ["bounty_id"],
    },
  },
  {
    name: "submit_work",
    description:
      "Submit proof of work for a bounty you've claimed. " +
      "Write a genuine, helpful, and complete response to the task in the bounty description. " +
      "The submission is stored on-chain and reviewed by the bounty creator.",
    input_schema: {
      type: "object" as const,
      properties: {
        bounty_id: { type: "number", description: "The numeric ID of the bounty" },
        submission_note: {
          type: "string",
          description:
            "Your completed work — be thorough. If it's a writing task, write it. " +
            "If it's a research task, provide the answer. " +
            "This goes on-chain.",
        },
      },
      required: ["bounty_id", "submission_note"],
    },
  },
];

// ── Agent cycle ───────────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  console.log("\n──────────────────────────────────────────");
  console.log("🤖  Starting agent cycle...");

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `You are an autonomous bounty hunter on the Movement blockchain, running on the BountyMove platform.

Your wallet address: ${AGENT_ADDRESS}
Your on-chain spending cap: 0.05 MOVE (5,000,000 octas) — enforced by the Move VM, not app code.

Your instructions:
1. Call get_bounties to see what's available.
2. For any OPEN bounty at or below your cap: claim it.
3. For any OPEN bounty ABOVE your cap: attempt to claim it anyway. The VM will reject it with E_AGENT_EXCEEDS_MAX. This guardrail demonstration is intentional and important — report what happened.
4. For any bounty you've already CLAIMED (status=1, hunter=you): generate real, high-quality work and submit it.
5. After taking actions, write a 2-3 sentence summary of what you did.

Important notes:
- You cannot claim bounties you created yourself (the contract enforces this too).
- Be decisive. Execute. Do not ask for confirmation.
- The on-chain guardrail rejection is a feature, not a bug — highlight it in your summary.`,
    },
  ];

  // Agentic loop
  while (true) {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      tools,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    // Agent is done
    if (response.stop_reason === "end_turn") {
      const summary = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("\n");
      if (summary) console.log("\n💬  Agent summary:\n", summary);
      break;
    }

    if (response.stop_reason !== "tool_use") break;

    // Process tool calls
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = block.input as Record<string, any>;
      console.log(`  ↪  ${block.name}(${JSON.stringify(input)})`);

      let output: unknown;

      try {
        if (block.name === "get_bounties") {
          const all = await fetchBounties();
          const open = all.filter((b) => b.status === 0);
          const myClaimed = all.filter(
            (b) =>
              b.status === 1 &&
              b.hunter.toLowerCase() === AGENT_ADDRESS.toLowerCase()
          );
          output = { open_bounties: open, my_claimed_bounties: myClaimed };
          console.log(
            `     → ${open.length} open, ${myClaimed.length} claimed by me`
          );
        } else if (block.name === "claim_bounty") {
          const { bounty_id } = input as { bounty_id: number };
          const result = await sendTx("claim_bounty", [bounty_id]);
          output = result;

          if (result.success) {
            console.log(
              `     ✅  Claimed #${bounty_id} — ${explorerUrl(result.hash!)}`
            );
          } else {
            const isGuardrail =
              result.error?.includes("E_AGENT_EXCEEDS_MAX") ||
              result.error?.includes("abort_code") ||
              result.error?.includes("Move abort") ||
              result.error?.includes("code: 9");
            if (isGuardrail) {
              console.log(
                `     ⛔  GUARDRAIL TRIGGERED for #${bounty_id} — VM rejected (E_AGENT_EXCEEDS_MAX)`
              );
            } else {
              console.log(
                `     ❌  Claim failed #${bounty_id}: ${result.error?.slice(0, 120)}`
              );
            }
          }
        } else if (block.name === "submit_work") {
          const { bounty_id, submission_note } = input as {
            bounty_id: number;
            submission_note: string;
          };
          const noteBytes = Array.from(
            new TextEncoder().encode(submission_note)
          );
          const result = await sendTx("submit_bounty", [bounty_id, noteBytes]);
          output = result;

          if (result.success) {
            console.log(
              `     ✅  Submitted work for #${bounty_id} — ${explorerUrl(result.hash!)}`
            );
          } else {
            console.log(
              `     ❌  Submit failed #${bounty_id}: ${result.error?.slice(0, 120)}`
            );
          }
        } else {
          output = { error: `Unknown tool: ${block.name}` };
        }
      } catch (err: any) {
        output = { error: err.message ?? String(err) };
        console.log(`     ⚠️   Tool error: ${err.message}`);
      }

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(output),
      });
    }

    messages.push({ role: "user", content: results });
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   BountyMove AI Agent                    ║");
  console.log("║   Claude AI · Movement Mainnet           ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`📍  Module:  ${MODULE_ADDRESS}`);
  console.log(`🤖  Wallet:  ${AGENT_ADDRESS}`);
  console.log(`💰  Cap:     0.05 MOVE (VM-enforced on-chain)`);
  console.log(
    RUN_ONCE
      ? "🔁  Mode:    single cycle\n"
      : `🔁  Mode:    polling every ${POLL_INTERVAL_MS / 1000}s\n`
  );

  do {
    try {
      await runCycle();
    } catch (err: any) {
      console.error("Cycle error:", err.message ?? err);
    }

    if (!RUN_ONCE) {
      console.log(`\n⏳  Next cycle in ${POLL_INTERVAL_MS / 1000}s...`);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  } while (!RUN_ONCE);

  console.log("\n✅  Done.");
}

main();
