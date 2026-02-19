# Progress

## Current Phase: BUILD
## Started: 2025-02-19

## Implementation Log

### Phase 1: Smart Contract
- [x] Project scaffolded (`submission/bounty_board/`)
- [x] `Move.toml` with `rev = "m1"` dependency
- [x] `bounty_board.move` written (escrow via resource account, agent guardrail in claim_bounty)
- [x] Compiled — `bounty_board.mv` bytecode exists in `build/`
- [x] `movement init --network mainnet` (switched from testnet — testnet was down)
- [x] CLI wallet funded: `0x7251...` has ~0.26 MOVE
- [x] **Deployed to mainnet** — tx: `0x0bab458a...` ✓
- [x] `configure_agent` — Agent `0xbd57...` with max 0.05 MOVE (5000000 octas) — tx: `0x57965e...` ✓
- [x] On-chain verification: `get_agent_address` + `get_max_claim_amount` return correct values
- [ ] Smoke test: create bounty via CLI, read back

### Phase 2: Frontend
- [x] Template cloned to `submission/frontend/`
- [x] Dependencies installed
- [x] `lib/contract.ts` created — MODULE_ADDRESS updated to deployer `0x7251...`
- [x] `types/bounty.ts` created
- [x] All components created (bounty-board, bounty-card, create-bounty-dialog, submit-work-dialog, status-badge, agent-panel, network-toggle)
- [x] Components wired into `page.tsx`
- [x] Header rebranded to "BountyMove" with network toggle
- [x] Micro-bounty defaults: placeholder 0.01 MOVE, step 0.001
- [x] Frontend builds clean (`npm run build` passes)
- [ ] End-to-end test with live contract

### Phase 3: Agent Demo
- [x] Agent wallet (`0xbd57...`) funded with 1.5 MOVE
- [x] Agent registered via `configure_agent` on-chain
- [ ] Guardrail test: claim within cap → success
- [ ] Guardrail test: claim above cap → reject
- [ ] Demo script rehearsed

## Deployment Info

### First Deploy (superseded)
- **Network:** Movement Mainnet (Chain ID 126)
- **Contract address:** `0x72516177d68867bd8bf24d326a361d4e089cd96d1f6723114839f5caf8dd0cf2` ← accidental wallet, deprecated
- **Deploy tx:** `0x0bab458a14e53a1050228f4781d18ff0f88f54cbcb35b39186cfda8bf9047433`
- **Agent config tx:** `0x57965e012bc1281a8a98ba2ef17965bce0f53c46546ec2ba1c93abc8f9d6efd4`

### Target Deploy (in progress — separate chat)
- **Deployer:** `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401` (root ~/.movement config)
- **Expected MODULE_ADDRESS:** `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401`
- **Reason for redeploy:** wallet consolidation — single deployer for both networks

## Blockers
- Redeploy from `0xbd573c...` in progress (separate chat)
- After redeploy: update MODULE_ADDRESS in lib/contract.ts + Vercel env var + SSM
- Then: test full frontend flow with live contract

## Test Results
- Contract compile: PASS
- Contract deploy: PASS (mainnet)
- Agent config: PASS (verified on-chain)
- Frontend build: PASS
