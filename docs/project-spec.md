# BountyMove — Project Spec

## One-liner
On-chain task bounty board on Movement Network where AI agents hunt bounties autonomously, constrained by guardrails enforced in Move.

## Pitch
Users post tasks with MOVE tokens locked in escrow. Anyone — human or AI agent — can claim, complete, and earn. The twist: the Move smart contract enforces a hard cap on what the AI agent can claim. If the agent tries to claim a bounty above its limit, the transaction reverts on-chain. This is real agentic infrastructure — safety constraints enforced by the blockchain, not application code.

## Track
Track 1: Build with an AI Agent

## Stack
- **Smart contract:** Move 2.1 on Movement Network (Bardock Testnet)
- **Frontend:** Next.js 15 + Aptos SDK + wallet-adapter-react + shadcn/ui + Tailwind
- **Agent tooling:** Claude Code + Move Plugin MCP server
- **Network:** Bardock Testnet (Chain ID 250, RPC: `https://testnet.movementnetwork.xyz/v1`)

---

## Smart Contract Design

### Module: `bounty_board::bounty_board`

**Escrow:** Resource account holds locked MOVE. Created in `init_module` with `SignerCapability` stored for payouts.

### Structs

```
BountyBoard has key
  bounties: vector<Bounty>
  next_id: u64
  total_escrowed: u64
  signer_cap: SignerCapability
  resource_addr: address
  admin: address
  agent_address: address        // single registered AI agent
  max_claim_amount: u64         // hard cap in octas (1 MOVE = 10^8)

Bounty has store, drop, copy
  id: u64
  creator: address
  title: vector<u8>
  description: vector<u8>
  bounty_amount: u64
  status: u8                    // 0=Open, 1=Claimed, 2=Submitted, 3=Completed, 4=Cancelled
  hunter: address
  submission_note: vector<u8>
  created_at: u64
```

### Entry Functions

| Function | Description |
|----------|-------------|
| `configure_agent(admin, agent_addr, max_amount)` | Set agent address + max claim cap. Admin-only, call once post-deploy. |
| `create_bounty(creator, title, description, amount)` | Lock MOVE in escrow resource account. |
| `claim_bounty(hunter, bounty_id)` | Claim open bounty. **If hunter == agent_address, assert amount <= max_claim_amount.** |
| `submit_bounty(hunter, bounty_id, note)` | Submit proof of work. |
| `approve_bounty(creator, bounty_id)` | Release escrow to hunter. |
| `cancel_bounty(creator, bounty_id)` | Refund creator if bounty still Open. |

### The Guardrail (core differentiator)

```move
// In claim_bounty:
if (hunter_addr == board.agent_address) {
    assert!(bounty.bounty_amount <= board.max_claim_amount, E_AGENT_EXCEEDS_MAX);
};
```

Human users claim freely. The agent is constrained on-chain.

### View Functions

| Function | Returns |
|----------|---------|
| `get_all_bounties()` | `vector<Bounty>` |
| `get_bounty(id)` | `Bounty` |
| `get_bounty_count()` | `u64` |
| `get_agent_address()` | `address` |
| `get_max_claim_amount()` | `u64` |
| `get_resource_address()` | `address` |
| `get_total_escrowed()` | `u64` |

### Events
`BountyCreated`, `BountyClaimed`, `BountySubmitted`, `BountyCompleted`, `BountyCancelled`

---

## Frontend Design

### Components

| Component | Purpose |
|-----------|---------|
| `bounty-board.tsx` | Main dashboard: fetch + list bounties, stats, create button |
| `bounty-card.tsx` | Single bounty with conditional actions (Claim/Submit/Approve/Cancel) |
| `create-bounty-dialog.tsx` | Form: title, description, MOVE amount |
| `submit-work-dialog.tsx` | Form: submission note text |
| `status-badge.tsx` | Colored label: Open/Claimed/Submitted/Completed/Cancelled |
| `agent-panel.tsx` | Agent address, max cap, escrow balance |

### Helpers

| File | Purpose |
|------|---------|
| `lib/contract.ts` | MODULE_ADDRESS, Aptos client, view function wrappers |
| `types/bounty.ts` | TypeScript interfaces, status enum, label/color maps |

### UI Flow
1. Connect wallet (existing template)
2. See bounty list with status badges
3. Create bounty → MOVE locked in escrow
4. Claim → Submit → Approve lifecycle
5. Agent panel shows guardrail config

---

## Demo Script
1. Create 0.3 MOVE bounty in browser
2. Claude claims via CLI → frontend updates to "Claimed"
3. Claude submits haiku → frontend shows submission
4. Create 1.0 MOVE bounty
5. Claude tries to claim → **transaction reverts: AGENT_EXCEEDS_MAX**
6. "The guardrail is enforced on-chain, not in app code."
7. Approve first bounty → escrow releases to agent
