# BountyMove — Wallet Setup

## Roles

| Role | Address | Balance | Purpose |
|------|---------|---------|---------|
| **Deployer / Admin (CLI)** | `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401` | ~1.5 MOVE | Deploys contract on both networks, calls `configure_agent`, runs agent CLI demo |
| **Human (Nico)** | `0xabcd2ac4a5cb45bcbcc15b028057932adbee88ca45c0f0c1792bf3b75689ed74` | ~0.24 MOVE | Creates bounties, approves work via Nightly browser wallet |
| ~~Accidental wallet~~ | ~~`0x72516177d68867bd8bf24d326a361d4e089cd96d1f6723114839f5caf8dd0cf2`~~ | ~0.26 MOVE | Created by `movement init` inside `submission/bounty_board/` subfolder — do not use |

## Deployer Key Location

- **Config file:** `~/.movement/config.yaml` (root profile)
- **SSM:** `/bountymove/dev/AGENT_PRIVATE_KEY` (set from the root config private key)
- **SSM:** `/bountymove/dev/MODULE_ADDRESS` (set to deployer address after each deploy)

> Never commit the private key. Pull it with `./scripts/pull-secrets.sh`.

## Network

| Network | Chain ID | RPC | Status |
|---------|----------|-----|--------|
| **Mainnet** | 126 | `https://full.mainnet.movementinfra.xyz/v1` | Primary |
| Testnet | 250 | `https://testnet.movementnetwork.xyz/v1` | Secondary (was down during hackathon) |

## Consolidation Decision

The project originally had two CLI wallets:
- `~/.movement/config.yaml` (root) → `0xbd573c...` — had the testnet deploy + 1.5 MOVE mainnet
- `submission/bounty_board/.movement/config.yaml` (subfolder) → `0x7251...` — accidental `movement init` inside the contract directory

**Decision:** Use `0xbd573c...7401` (root config) as the single deployer for both networks.
- Same address on both networks → no env var changes needed per network
- Already has sufficient MOVE on mainnet
- Eliminates the confusion of two deployer wallets

If needed, recover the ~0.26 MOVE from `0x7251...` by sending it to `0xbd573c...` on mainnet.

## Demo Economics

- Total budget: ~1.74 MOVE across all wallets
- Bounty size: **0.01 MOVE** (1,000,000 octas) — allows high volume cycling
- Agent max_claim_amount: **0.05 MOVE** (5,000,000 octas)
- Guardrail demo: create a 0.1 MOVE bounty → agent gets rejected on-chain (`E_AGENT_EXCEEDS_MAX`)

## Demo Script (CLI as Agent)

The deployer wallet (`0xbd573c...`) acts as the agent in the demo via CLI:

```bash
# Agent claims within cap (0.01 MOVE bounty) — should succeed
movement move run \
  --function-id {MODULE_ADDRESS}::bounty_board::claim_bounty \
  --args u64:0

# Agent tries to claim above cap (0.1 MOVE bounty) — should abort
movement move run \
  --function-id {MODULE_ADDRESS}::bounty_board::claim_bounty \
  --args u64:1
```

## Frontend Config

- `MODULE_ADDRESS` = deployer address = `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401`
- Set in `submission/frontend/lib/contract.ts`
- Also set as Vercel env var: `NEXT_PUBLIC_MODULE_ADDRESS`
