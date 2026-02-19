# Progress

## Current Phase
VAN complete → ready for BUILD

## Implementation Log

### Phase 1: Smart Contract
- [x] Project scaffolded (`submission/bounty_board/`)
- [x] `Move.toml` with `rev = "m1"` dependency
- [x] `bounty_board.move` written (escrow via resource account, agent guardrail in claim_bounty)
- [x] Compiled — `bounty_board.mv` bytecode exists in `build/`
- [ ] `movement init --network testnet`
- [ ] Fund account via faucet
- [ ] Deploy to Bardock testnet
- [ ] `configure_agent` — set agent address + max cap
- [ ] Smoke test via CLI

### Phase 2: Frontend
- [x] Template cloned to `submission/frontend/`
- [x] Dependencies installed
- [x] `lib/contract.ts` created
- [x] `types/bounty.ts` created
- [x] All 6 components created (bounty-board, bounty-card, create-bounty-dialog, submit-work-dialog, status-badge, agent-panel)
- [ ] Components wired into `page.tsx`
- [ ] Header rebranded to "BountyMove"
- [ ] Layout metadata updated
- [ ] MODULE_ADDRESS set (after deploy)
- [ ] End-to-end test

### Phase 3: Agent Demo
- [ ] Agent CLI wallet initialized
- [ ] Agent registered via `configure_agent`
- [ ] Guardrail test: claim within cap → success
- [ ] Guardrail test: claim above cap → reject
- [ ] Demo script rehearsed

## Test Results
<!-- Updated by /build after running tests -->
