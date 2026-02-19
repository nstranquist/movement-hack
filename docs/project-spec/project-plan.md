# BountyMove — Final Implementation Plan

## Context
Building BountyMove for the Open Claw Hackathon (ETH Denver, 5-hour window). Hybrid Track 1+2: a working bounty board app (Track 1) with on-chain AI agent guardrails (Track 2). The pitch: Claude autonomously hunts bounties, but the Move contract mathematically constrains it — when the agent tries to claim a bounty above its cap, the VM rejects it. That rejection IS the demo.

**Current state:**
- Contract: `submission/bounty_board/sources/bounty_board.move` — fully written, not yet compiled or deployed
- Frontend: `submission/frontend/` — base Next.js template, no BountyMove components yet

---

## Phase 1: Compile & Deploy Contract

**File:** `submission/bounty_board/sources/bounty_board.move` (exists, do not modify unless compile fails)
**Config:** `submission/bounty_board/Move.toml` (correct dep: `rev = "m1"`)

**Steps:**
1. Compile: `movement move compile --named-addresses bounty_board=default` (from `submission/bounty_board/`)
2. If not initialized: `movement init --network testnet` — saves account to `~/.movement/`
3. Fund account: https://faucet.movementnetwork.xyz/
4. Deploy: `movement move publish --named-addresses bounty_board=default`
5. Note the deployed address (it's the CLI account address, e.g. `0xabc...`)
6. Configure agent (replace with actual agent wallet addr + cap in octas, 50000000 = 0.5 MOVE):
   ```
   movement move run \
     --function-id {DEPLOYED_ADDR}::bounty_board::configure_agent \
     --args address:{AGENT_WALLET_ADDR} u64:50000000
   ```
7. Smoke test via CLI: create a bounty, read it back with `get_all_bounties`

**Known contract notes:**
- `@bounty_board` in view functions resolves to the deployer's address (the named address)
- `vector<u8>` args for title/description passed as `hex:...` in CLI
- `cancel_bounty` exists but is a cut-list item — only implement frontend button if time allows

---

## Phase 2: Frontend — Foundation Files

### `submission/frontend/lib/contract.ts` (new)
- Export `MODULE_ADDRESS` constant (filled in after deploy)
- Export `getAptosClient()` — reuse pattern from `components/send-transaction.tsx` (CUSTOM network, testnet fullnode)
- Export `getExplorerUrl(txHash)` helper
- Export view function callers:
  - `fetchAllBounties()` → calls `get_all_bounties`, decodes `vector<u8>` fields via `new TextDecoder().decode(new Uint8Array(bytes))`
  - `fetchAgentConfig()` → calls `get_agent_address()` + `get_max_claim_amount()` + `get_total_escrowed()`

### `submission/frontend/types/bounty.ts` (new)
```typescript
interface Bounty {
  id: number;
  creator: string;
  title: string;
  description: string;
  bounty_amount: number;    // in octas
  status: number;
  hunter: string;
  submission_note: string;
  created_at: number;
}

const STATUS = { OPEN: 0, CLAIMED: 1, SUBMITTED: 2, COMPLETED: 3, CANCELLED: 4 }
const STATUS_LABEL = { 0: "Open", 1: "Claimed", 2: "Submitted", 3: "Completed", 4: "Cancelled" }
const STATUS_COLOR = { 0: "green", 1: "yellow", 2: "blue", 3: "purple", 4: "gray" }

interface AgentConfig {
  agentAddress: string;
  maxClaimAmount: number;   // in octas
  totalEscrowed: number;
}
```

---

## Phase 3: Frontend — Components (build in this order)

### `components/status-badge.tsx` (new)
Simple colored badge chip using `STATUS_LABEL` and `STATUS_COLOR`. No logic, just display.

### `components/create-bounty-dialog.tsx` (new)
Dialog with: title (text), description (text), amount (number, in MOVE — convert to octas ×10^8 on submit).
On submit: `signAndSubmitTransaction` calling `bounty_board::create_bounty` with:
- `functionArguments: [Array.from(encoder.encode(title)), Array.from(encoder.encode(desc)), amountOctas]`
Toast pattern: copy exactly from `components/send-transaction.tsx` (loading → wallet → confirmation → success with explorer link).
On success: call `onSuccess()` callback to trigger board refresh.

### `components/submit-work-dialog.tsx` (new)
Same pattern as create dialog but single field (submission_note). Calls `bounty_board::submit_bounty` with `[bountyId, Array.from(encoder.encode(note))]`.

### `components/bounty-card.tsx` (new)
Props: `bounty: Bounty`, `onRefresh: () => void`, `agentAddress: string`
Display: title, description (truncated), amount in MOVE (divide octas by 10^8), status badge, creator/hunter address (truncated).
Conditional action buttons (based on `status` + connected wallet address):
- OPEN + not creator: "Claim" → calls `claim_bounty(bounty.id)`
- CLAIMED + hunter is me: "Submit Work" → opens `SubmitWorkDialog`
- SUBMITTED + creator is me: "Approve" → calls `approve_bounty(bounty.id)`
- OPEN + creator is me (optional cut): "Cancel" → calls `cancel_bounty(bounty.id)`
Show `[Agent]` badge if `bounty.hunter === agentAddress`.

### `components/agent-panel.tsx` (new)
Displays:
- Agent address (truncated with copy button)
- Max claim cap in MOVE
- Total MOVE in escrow
- Guardrail status: "Active" green dot
Small info box: "Try claiming a bounty > {maxCap} MOVE in the terminal to see the guardrail reject it"

### `components/bounty-board.tsx` (new)
Main dashboard. Fetches bounties + agent config on mount via `fetchAllBounties()` + `fetchAgentConfig()`.
Polls every 5 seconds with `setInterval`.
Layout: header row (title + "Create Bounty" button + `CreateBountyDialog`) | grid of `BountyCard` components | `AgentPanel` sidebar.
Shows empty state when no bounties.

---

## Phase 4: Wire In + Rebrand

### `app/page.tsx` — modify
- Replace `WalletDemoContent` with `BountyBoard`
- Update hero text: "BountyMove" / "AI-powered bounty board on Movement Network"

### `components/header.tsx` — modify
- Replace "Movement Network" branding with "BountyMove"
- Keep existing nav/theme toggle structure

### `app/layout.tsx` — modify
- Update `metadata.title` to "BountyMove"
- Update `metadata.description`

---

## Phase 5: Demo Prep

Seed bounties before judges arrive:
1. Create 2-3 bounties via frontend (e.g., 0.3 MOVE, 0.2 MOVE, 1.5 MOVE)
2. Register agent CLI wallet via `configure_agent` with max cap 0.5 MOVE

**Demo script:**
1. Show frontend with bounties listed, agent panel showing guardrail config
2. Terminal: agent claims the 0.3 MOVE bounty → succeeds → frontend updates
3. Terminal: agent submits work (e.g., a haiku as the note)
4. Frontend: approve → escrow releases → status = Completed
5. Terminal: agent tries to claim the 1.5 MOVE bounty → `E_AGENT_EXCEEDS_MAX` abort
6. "The Move VM mathematically blocked the agent. That's on-chain guardrails."

---

## Cut List (if behind, cut bottom-up)
1. `cancel_bounty` button on frontend (contract has it, just skip the UI)
2. Agent panel info box text / polish
3. 5-second polling (manual refresh button instead)
4. Explorer links in toasts (just show success without link)

## Never Cut
- Contract compile + deploy
- `configure_agent` call (must have agent address + cap set)
- Frontend: bounty list + create dialog
- `claim_bounty` guardrail enforcement visible in demo (this is the pitch)

---

## Verification Checklist
1. `movement move compile` exits 0
2. `movement move publish` succeeds, address noted
3. CLI: create bounty → `get_all_bounties` returns it
4. CLI: agent claims within cap → success
5. CLI: agent claims above cap → `E_AGENT_EXCEEDS_MAX` abort (abort code 9)
6. Frontend: wallet connects, bounties load, create dialog works
7. Frontend: claim → submit → approve full flow works
8. Agent panel shows correct config read from chain
