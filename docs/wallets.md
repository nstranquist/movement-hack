# BountyMove — Wallet Setup

## Roles

| Role | Address | MOVE | Purpose |
|------|---------|------|---------|
| **Human (Nico)** | `0xabcd2ac4a5cb45bcbcc15b028057932adbee88ca45c0f0c1792bf3b75689ed74` | ~0.5 | Create bounties, approve work via browser wallet |
| **Deployer / Admin** | `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401` | 1.5 | Deploy contract, becomes `@bounty_board` + admin. Calls `configure_agent`. |
| **Agent (Claude)** | `0x72516177d68867bd8bf24d326a361d4e089cd96d1f6723114839f5caf8dd0cf2` | 0 (needs ~0.2) | Autonomous bounty hunter, constrained by on-chain guardrails |

## Network
- **Mainnet** (Chain ID 126, RPC: `https://full.mainnet.movementinfra.xyz/v1`)
- Testnet currently down — mainnet is primary target

## Demo Economics
- Total budget: ~2 MOVE across all wallets
- Bounty size: **0.01 MOVE** (1000000 octas) — allows ~150 cycles
- Agent max_claim_amount: **0.05 MOVE** (5000000 octas)
- Guardrail demo: create a 0.1 MOVE bounty → agent gets rejected on-chain

## Closed Loop Strategy
Agents and human keep recycling MOVE through small bounties:
1. Human creates 0.01 MOVE bounty
2. Agent claims → submits work
3. Human approves → agent receives 0.01 MOVE
4. Agent (or human) creates next bounty
5. Repeat — shows real-time marketplace activity without draining funds

## Setup Steps
1. Import deployer key (`0xbd57...`) into Movement CLI
2. Deploy contract from deployer
3. Call `configure_agent` with agent address + 0.05 MOVE cap
4. Send ~0.2 MOVE to agent wallet for gas
5. Verify: agent claims 0.01 MOVE bounty → success
6. Verify: agent claims 0.1 MOVE bounty → E_AGENT_EXCEEDS_MAX rejection

## Frontend Config
- `MODULE_ADDRESS` in `lib/contract.ts`: `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401`
- Already matches deployer address — no change needed after deploy
