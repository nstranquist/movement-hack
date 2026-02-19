import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  Account,
  Ed25519PrivateKey,
  Aptos,
  AptosConfig,
  Network,
  AccountAddress,
} from "@aptos-labs/ts-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_MODULE_ADDRESS ??
  "0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401";

const MAINNET_URL = "https://full.mainnet.movementinfra.xyz/v1";

const AGENT_CONFIGS = {
  alpha: {
    name: "Agent Alpha",
    address: "0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401",
    privateKeyEnv: "AGENT_ALPHA_PRIVATE_KEY",
    guardrailed: true,
    maxCapMove: 0.5,
  },
  beta: {
    name: "Agent Beta",
    address: "0x72516177d68867bd8bf24d326a361d4e089cd96d1f6723114839f5caf8dd0cf2",
    privateKeyEnv: "AGENT_BETA_PRIVATE_KEY",
    guardrailed: false,
    maxCapMove: null,
  },
};

function sseChunk(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function viewFn(fn: string, args: unknown[] = []): Promise<unknown[]> {
  const res = await fetch(`${MAINNET_URL}/view`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ function: fn, type_arguments: [], arguments: args }),
  });
  if (!res.ok) throw new Error(`View error ${res.status}: ${await res.text()}`);
  return res.json();
}

function decodeHex(hex: string): string {
  if (!hex || hex === "0x") return "";
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!clean || clean.length % 2 !== 0) return "";
  const bytes = new Uint8Array(clean.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  return new TextDecoder().decode(bytes);
}

async function getBounties() {
  const result = await viewFn(`${MODULE_ADDRESS}::bounty_board::get_all_bounties`);
  const raw = (result[0] as any[]) || [];
  return raw.map((b) => ({
    id: Number(b.id),
    creator: b.creator,
    title: decodeHex(b.title),
    description: decodeHex(b.description),
    amount_move: Number(b.bounty_amount) / 1e8,
    status: Number(b.status), // 0=Open, 1=Claimed, 2=Submitted, 3=Approved, 4=Cancelled
    hunter: b.hunter,
    submission_note: decodeHex(b.submission_note),
  }));
}

async function submitTx(aptos: Aptos, account: Account, fn: string, args: any[]): Promise<string> {
  const txn = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: { function: fn as `${string}::${string}::${string}`, functionArguments: args },
  });
  const result = await aptos.signAndSubmitTransaction({ signer: account, transaction: txn });
  await aptos.waitForTransaction({ transactionHash: result.hash });
  return result.hash;
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agentId") as "alpha" | "beta";
  const cfg = AGENT_CONFIGS[agentId];
  if (!cfg) return new Response("Invalid agentId", { status: 400 });

  const privateKeyHex = process.env[cfg.privateKeyEnv];
  if (!privateKeyHex) return new Response(`Missing env: ${cfg.privateKeyEnv}`, { status: 500 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: object) => {
        controller.enqueue(encoder.encode(sseChunk(data)));
      };

      try {
        // Setup wallet
        const privateKey = new Ed25519PrivateKey(privateKeyHex);
        const address = AccountAddress.from(cfg.address);
        const account = Account.fromPrivateKey({ privateKey, address });
        const aptos = new Aptos(
          new AptosConfig({ network: Network.CUSTOM, fullnode: MAINNET_URL })
        );

        // Verify address matches
        const derivedAddr = account.accountAddress.toString();
        emit({ type: "status", text: `${cfg.name} online · ${cfg.address.slice(0, 10)}...${cfg.address.slice(-6)}` });

        if (derivedAddr.toLowerCase() !== cfg.address.toLowerCase()) {
          emit({ type: "warn", text: `Address mismatch: derived ${derivedAddr} vs configured ${cfg.address}` });
        }

        // Fetch bounties
        const bounties = await getBounties();
        emit({ type: "status", text: `Scanning chain... found ${bounties.length} bounties` });

        // Build system prompt
        const statusLabels = ["Open", "Claimed", "Submitted", "Approved", "Cancelled"];
        const bountyList = bounties
          .map(
            (b) =>
              `#${b.id}: "${b.title}" | ${b.amount_move} MOVE | ${statusLabels[b.status]} | creator:${b.creator.slice(0, 8)}... | hunter:${b.hunter.slice(0, 8)}...`
          )
          .join("\n") || "No bounties yet.";

        const systemPrompt = cfg.guardrailed
          ? `You are ${cfg.name}, a GUARDRAILED AI agent on Movement Mainnet.
Your wallet: ${cfg.address}
Cap: The Move VM enforces you CANNOT claim bounties > 0.5 MOVE. This is on-chain law — not app logic.

Current bounties:
${bountyList}

Rules:
- You may create_bounty, claim_bounty (only Open ones you didn't create), submit_work (only ones you've claimed), approve_work (only ones YOU created)
- Never claim your own bounty or bounties you didn't create
- Keep new bounty amounts between 0.05–0.2 MOVE (conserve funds)
- Take 2–3 meaningful actions, then call done
- Write real content for submissions (haiku, explanation, etc.)
- Be concise in your thinking text`
          : `You are ${cfg.name}, a FREE AI agent on Movement Mainnet.
Your wallet: ${cfg.address}
No on-chain cap — you can claim any amount.

Current bounties:
${bountyList}

Rules:
- You may create_bounty, claim_bounty (only Open ones you didn't create), submit_work (only ones you've claimed), approve_work (only ones YOU created)
- Never claim your own bounty
- Keep new bounty amounts between 0.05–0.15 MOVE (conserve funds)
- Take 2–3 meaningful actions, then call done
- Write real content for submissions
- Be concise in your thinking text`;

        // Anthropic tools
        const tools: Anthropic.Tool[] = [
          {
            name: "create_bounty",
            description: "Post a new bounty task on-chain, funding it from your wallet",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short task title (max 50 chars)" },
                description: { type: "string", description: "Task description (max 150 chars)" },
                amount_move: { type: "number", description: "Reward in MOVE (e.g. 0.1)" },
              },
              required: ["title", "description", "amount_move"],
            },
          },
          {
            name: "claim_bounty",
            description: "Claim an Open bounty to work on it",
            input_schema: {
              type: "object",
              properties: {
                bounty_id: { type: "number", description: "ID of the Open bounty to claim" },
              },
              required: ["bounty_id"],
            },
          },
          {
            name: "submit_work",
            description: "Submit your completed work for a bounty you claimed",
            input_schema: {
              type: "object",
              properties: {
                bounty_id: { type: "number", description: "ID of the bounty" },
                note: { type: "string", description: "Your submission content (max 150 chars)" },
              },
              required: ["bounty_id", "note"],
            },
          },
          {
            name: "approve_work",
            description: "Approve submitted work for a bounty you created, releasing payment to the hunter",
            input_schema: {
              type: "object",
              properties: {
                bounty_id: { type: "number", description: "ID of the bounty to approve" },
              },
              required: ["bounty_id"],
            },
          },
          {
            name: "done",
            description: "Signal you are finished for this session",
            input_schema: { type: "object", properties: {} },
          },
        ];

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
        const messages: Anthropic.MessageParam[] = [
          {
            role: "user",
            content: "Analyze the bounty board and take your best actions now. Be decisive.",
          },
        ];

        // Agentic loop
        let iterations = 0;
        let done = false;

        while (!done && iterations < 6) {
          iterations++;

          const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 512,
            system: systemPrompt,
            tools,
            messages,
          });

          // Emit thinking text
          for (const block of response.content) {
            if (block.type === "text" && block.text.trim()) {
              emit({ type: "thinking", text: block.text.trim() });
            }
          }

          if (response.stop_reason === "end_turn") {
            done = true;
            break;
          }
          if (response.stop_reason !== "tool_use") break;

          // Execute tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type !== "tool_use") continue;

            const input = block.input as Record<string, any>;
            emit({ type: "tool_call", tool: block.name, args: input });

            let resultText = "";
            try {
              if (block.name === "done") {
                done = true;
                resultText = "Done.";
              } else if (block.name === "create_bounty") {
                const titleBytes = Array.from(new TextEncoder().encode(input.title));
                const descBytes = Array.from(new TextEncoder().encode(input.description));
                const amountOctas = Math.round(input.amount_move * 1e8);
                const hash = await submitTx(aptos, account, `${MODULE_ADDRESS}::bounty_board::create_bounty`, [
                  titleBytes,
                  descBytes,
                  amountOctas,
                ]);
                resultText = `Created. TX: ${hash}`;
                emit({
                  type: "tx",
                  hash,
                  action: `Created bounty: "${input.title}" (${input.amount_move} MOVE)`,
                  explorer: `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`,
                });
              } else if (block.name === "claim_bounty") {
                const hash = await submitTx(aptos, account, `${MODULE_ADDRESS}::bounty_board::claim_bounty`, [
                  input.bounty_id,
                ]);
                resultText = `Claimed. TX: ${hash}`;
                emit({
                  type: "tx",
                  hash,
                  action: `Claimed bounty #${input.bounty_id}`,
                  explorer: `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`,
                });
              } else if (block.name === "submit_work") {
                const noteBytes = Array.from(new TextEncoder().encode(input.note));
                const hash = await submitTx(aptos, account, `${MODULE_ADDRESS}::bounty_board::submit_bounty`, [
                  input.bounty_id,
                  noteBytes,
                ]);
                resultText = `Submitted. TX: ${hash}`;
                emit({
                  type: "tx",
                  hash,
                  action: `Submitted work for #${input.bounty_id}: "${input.note.slice(0, 60)}..."`,
                  explorer: `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`,
                });
              } else if (block.name === "approve_work") {
                const hash = await submitTx(aptos, account, `${MODULE_ADDRESS}::bounty_board::approve_bounty`, [
                  input.bounty_id,
                ]);
                resultText = `Approved. TX: ${hash}`;
                emit({
                  type: "tx",
                  hash,
                  action: `Approved bounty #${input.bounty_id} — payment released`,
                  explorer: `https://explorer.movementnetwork.xyz/txn/${hash}?network=mainnet`,
                });
              }
            } catch (err: any) {
              const msg: string = err.message ?? String(err);
              const isGuardrail =
                msg.includes("E_AGENT_EXCEEDS_MAX") ||
                msg.includes("ABORT_CODE") ||
                msg.includes("move abort");
              resultText = `Error: ${msg}`;
              emit({
                type: "error",
                message: isGuardrail
                  ? "GUARDRAIL: Move VM rejected — bounty exceeds your 0.5 MOVE cap"
                  : msg.slice(0, 120),
                guardrail: isGuardrail,
              });
            }

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: resultText,
            });
          }

          messages.push({ role: "assistant", content: response.content });
          messages.push({ role: "user", content: toolResults });
        }

        emit({ type: "done" });
      } catch (err: any) {
        emit({ type: "error", message: err.message ?? String(err), guardrail: false });
        emit({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
