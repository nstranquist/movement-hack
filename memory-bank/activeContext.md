# Active Context

## Current Task
Wallet consolidation + redeploy — in progress in separate chat. Updating docs/infra in this chat.

## Current Phase
BUILD — contract needs redeploy from `0xbd573c...`, frontend pending MODULE_ADDRESS update

## Next Steps
1. Redeploy contract from `0xbd573c...7401` (root ~/.movement config) on mainnet
2. Call `configure_agent` with agent address + 0.05 MOVE cap
3. Update `MODULE_ADDRESS` in `lib/contract.ts` + Vercel env var to `0xbd573c...7401`
4. Update SSM `/bountymove/dev/MODULE_ADDRESS` with new address
5. Smoke test: create bounty via CLI, read back with `get_all_bounties`
6. Test agent guardrail (within cap → success, above cap → E_AGENT_EXCEEDS_MAX)
7. Demo rehearsal

## Wallet Strategy (Updated)

Single deployer: `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401`
- Source: `~/.movement/config.yaml` (root profile)
- Role: deployer + admin + agent CLI demo wallet
- Balance: ~1.5 MOVE mainnet

Human browser wallet: `0xabcd2ac4a5cb45bcbcc15b028057932adbee88ca45c0f0c1792bf3b75689ed74` (Nightly)

Deprecated/accidental: `0x72516177...` — do not use (accidental `movement init` in subfolder)

## Key Files
- `submission/bounty_board/sources/bounty_board.move` — contract source
- `submission/frontend/lib/contract.ts` — MODULE_ADDRESS (needs update after redeploy)
- `~/.movement/config.yaml` — root CLI wallet (deployer)
- `docs/wallets.md` — wallet roles documented
- `infra/main.tf` — SSM parameters (Terraform)
- `scripts/pull-secrets.sh` — pulls SSM secrets to .env.local

## What's Done
- Contract written + compiled
- First mainnet deploy from `0x7251...` (superseded — consolidating to `0xbd573c...`)
- Frontend: all components built, builds clean
- SSM parameters provisioned (Terraform)
- Vercel deployed: https://frontend-zeta-amber-37.vercel.app
- Next.js updated to 15.5.12 (CVE fix)

## Network
- **Primary:** Movement Mainnet (Chain ID 126), RPC: `https://full.mainnet.movementinfra.xyz/v1`
- Testnet was down during hackathon — mainnet is the demo target
