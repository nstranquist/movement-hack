 BountyMove — Final Implementation Plan

 Context

 On-chain Task Bounty Board with agent guardrails for the Open Claw Hackathon (ETH Denver, Track 1).
  AI agents hunt bounties autonomously, but the Move contract enforces a hard cap on what they can
 claim. The guardrail rejection is the demo's money shot.

 Simplified scope: No dynamic AgentRegistry, no epoch/daily math. One agent_address + one
 max_claim_amount in the BountyBoard struct. That's enough to demonstrate the concept.

 ---
 Current State

 - Frontend template cloned to submission/frontend/ (deps installed)
 - Move Plugin installed (MCP tools available)
 - Movement CLI v7.4.0 installed
 - Aptos CLI 8.0.0 installed (fallback)
 - Contract written: submission/bounty_board/sources/bounty_board.move
 - Move.toml written: submission/bounty_board/Move.toml
 - movement init (needed before compile — creates ~/.movement/config.yaml)
 - Contract compiled
 - Contract deployed to testnet
 - Frontend wired to contract
 - Agent panel built
 - End-to-end demo tested

 ---
 Phase 1: Smart Contract (~1 hour)

 Contract: submission/bounty_board/sources/bounty_board.move (WRITTEN)

 Structs:
 - BountyBoard has key — bounties: vector<Bounty>, next_id, total_escrowed, signer_cap:
 SignerCapability, resource_addr, admin, agent_address, max_claim_amount
 - Bounty has store, drop, copy — id, creator, title: vector<u8>, description: vector<u8>,
 bounty_amount, status: u8 (0-4), hunter, submission_note: vector<u8>, created_at

 Escrow: Resource account created in init_module. MOVE locked on create, released on approve/cancel
 via SignerCapability.

 Entry functions:
 - configure_agent(admin, agent_addr, max_amount) — one-time setup post-deploy
 - create_bounty(creator, title, description, bounty_amount) — lock MOVE in escrow
 - claim_bounty(hunter, bounty_id) — GUARDRAIL: if hunter == agent_address, assert bounty_amount <=
 max_claim_amount
 - submit_bounty(hunter, bounty_id, submission_note) — submit proof of work
 - approve_bounty(creator, bounty_id) — release escrow to hunter
 - cancel_bounty(creator, bounty_id) — refund if still Open

 View functions: get_all_bounties, get_bounty, get_bounty_count, get_agent_address,
 get_max_claim_amount, get_resource_address, get_total_escrowed

 Events: BountyCreated, BountyClaimed, BountySubmitted, BountyCompleted, BountyCancelled

 Remaining Steps

 1. Run movement init --network testnet (creates config + keypair)
 2. Fund account via faucet (movement account fund-with-faucet)
 3. Compile: movement move compile --named-addresses bounty_board=default
 4. Fix any compilation errors
 5. Deploy: movement move publish --named-addresses bounty_board=default
 6. Smoke test via CLI: create bounty, configure agent, claim within/above limits

 ---
 Phase 2: Frontend Core (~1.5 hours)

 Reference Files (read these patterns)

 - submission/frontend/components/send-transaction.tsx — transaction signing + Aptos client pattern
 - submission/frontend/components/wallet-demo-content.tsx — main connected-state layout to replace
 - submission/frontend/components/wallet-provider.tsx — AptosConfig + network setup

 Files to Create

 File: lib/contract.ts
 Purpose: MODULE_ADDRESS constant, Aptos client factory, view function helpers
 ────────────────────────────────────────
 File: types/bounty.ts
 Purpose: Bounty interface, BountyStatus enum, status labels/colors
 ────────────────────────────────────────
 File: components/bounty-board.tsx
 Purpose: Main dashboard: fetch bounties, render list + stats + create button
 ────────────────────────────────────────
 File: components/bounty-card.tsx
 Purpose: Single bounty card with conditional action buttons
 ────────────────────────────────────────
 File: components/create-bounty-dialog.tsx
 Purpose: Dialog form: title, description, MOVE amount
 ────────────────────────────────────────
 File: components/submit-work-dialog.tsx
 Purpose: Dialog: submission note text
 ────────────────────────────────────────
 File: components/status-badge.tsx
 Purpose: Colored badge mapping status number to label
 ────────────────────────────────────────
 File: components/agent-panel.tsx
 Purpose: Agent address, max_claim_amount, guardrail status

 Files to Modify

 ┌───────────────────────┬────────────────────────────────────────────┐
 │         File          │                   Change                   │
 ├───────────────────────┼────────────────────────────────────────────┤
 │ app/page.tsx          │ Replace WalletDemoContent with BountyBoard │
 ├───────────────────────┼────────────────────────────────────────────┤
 │ components/header.tsx │ Rebrand to "BountyMove"                    │
 ├───────────────────────┼────────────────────────────────────────────┤
 │ app/layout.tsx        │ Update metadata title/description          │
 └───────────────────────┴────────────────────────────────────────────┘

 Key Frontend Patterns

 // Transaction (from send-transaction.tsx pattern)
 const response = await signAndSubmitTransaction({
   sender: account.address,
   data: {
     function: `${MODULE_ADDRESS}::bounty_board::create_bounty`,
     functionArguments: [
       new TextEncoder().encode(title),       // vector<u8>
       new TextEncoder().encode(description), // vector<u8>
       bountyAmountInOctas,                   // u64
     ],
   },
 });

 // View function
 const client = new Aptos(new AptosConfig({
   network: Network.CUSTOM,
   fullnode: "https://testnet.movementnetwork.xyz/v1",
 }));
 const result = await client.view({
   payload: {
     function: `${MODULE_ADDRESS}::bounty_board::get_all_bounties`,
     functionArguments: [],
   },
 });

 Steps

 1. Create lib/contract.ts + types/bounty.ts
 2. Build status-badge.tsx
 3. Build bounty-card.tsx with conditional action buttons (Claim/Submit/Approve/Cancel based on
 status + wallet address)
 4. Build create-bounty-dialog.tsx + submit-work-dialog.tsx
 5. Build bounty-board.tsx (main dashboard, fetches bounties on mount + interval)
 6. Wire into page.tsx, rebrand header.tsx + layout.tsx
 7. Test: connect wallet → create bounty → see it listed → claim → submit → approve

 ---
 Phase 3: Agent Panel + Demo Prep (~45 min)

 Agent Panel (components/agent-panel.tsx)

 - Display agent wallet address (from get_agent_address view function)
 - Display max_claim_amount (from get_max_claim_amount view function)
 - Show current escrow balance (from get_total_escrowed)
 - Visual: card with agent info, guardrail limits displayed clearly

 Demo Flow

 1. User creates 0.3 MOVE bounty in browser
 2. Claude (via CLI) claims it → success, frontend updates
 3. Claude submits work (haiku) → frontend shows submission
 4. User creates 1.0 MOVE bounty
 5. Claude tries to claim → contract rejects: E_AGENT_EXCEEDS_MAX (money shot)
 6. User approves first bounty → escrow released to agent

 Steps

 1. Build agent-panel.tsx
 2. Initialize a second Movement CLI profile for the agent (or use same profile)
 3. Run configure_agent to register agent address with max 0.5 MOVE (50000000 octas)
 4. Test guardrail: claim 0.3 MOVE bounty → pass, claim 1.0 MOVE bounty → reject
 5. Polish UI, add loading states

 ---
 Phase 4: Buffer (~30 min)

 Debugging, deployment, last-minute fixes, demo rehearsal.

 ---
 Cut List (if behind, cut bottom-up)

 1. Agent panel UI → demo agent purely via terminal
 2. cancel_bounty button in frontend (keep in contract)
 3. Status badge colors → use plain text
 4. Auto-refresh polling → manual refresh button

 Never Cut

 - Core contract with escrow (create/claim/submit/approve)
 - Guardrail enforcement in claim_bounty
 - configure_agent function
 - Frontend: bounty list + create dialog
 - Live demo: agent gets rejected on-chain

 ---
 Verification Checklist

 1. movement move compile succeeds
 2. Deploy to Bardock testnet succeeds
 3. CLI: create_bounty → MOVE leaves creator wallet
 4. CLI: claim_bounty within limit → success
 5. CLI: claim_bounty above max → E_AGENT_EXCEEDS_MAX abort
 6. CLI: approve_bounty → MOVE arrives at hunter wallet
 7. Frontend: wallet connects, bounties display, create works
 8. Frontend: claim/submit/approve flow works end-to-end
 9. Agent panel shows guardrail config from chain
 10. Full demo script runs without errors

 ---
 Demo Script

 1. "BountyMove: an on-chain bounty board where AI agents hunt tasks for MOVE."
 2. "The Move contract enforces guardrails — the agent has a hard cap on what it can claim."
 3. Create 0.3 MOVE bounty in browser → appears as Open
 4. Claude claims via terminal → frontend shows Claimed
 5. Claude submits a haiku → frontend shows Submitted with text
 6. Create 1.0 MOVE bounty → appears as Open
 7. Claude tries to claim → transaction aborts: AGENT_EXCEEDS_MAX
 8. "The AI can't overspend. This guardrail is enforced on-chain, not in app code."
 9. Approve first bounty → escrow releases → agent earned MOVE
 10. "This is agentic infrastructure on Movement."