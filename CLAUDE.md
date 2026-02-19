# Movement Hackathon

The primary hackathon notes are located in ./hackathon-notes/openclawhackathon.md

Our overall hackathon plan is located in ./docs/project-spec/project-plan.md

- The submission is located in ./submission
- The notes are located in ./hackathon-notes
- Other reference repos are located in ./refs
- This is the root of our git repo, even though source code lives primarily in ./submission. take this into account for env variables and gitignore.

## Tooling

- use 'movement' cli
- use 'aws' cli
- use 'vercel' cli

### AWS Details

**human notes:**
- Using for secret management, other services tbd
- Keep costs as low as possible, preferrably 0
- Manage infrastructure as code via terraform whenever possible

**agent notes:**
- **Secrets:** SSM Parameter Store (free standard tier) — do not use Secrets Manager
- **Compute:** Lambda only if needed for agent backend; prefer running agent locally for demo
- **Frontend hosting:** Vercel (not AWS) — zero config, free, native Next.js support
- **IaC:** Terraform in `./infra/` — always use for any AWS resources
- Never add paid services without explicit confirmation — target $0 cost
- Secrets path convention: `/bountymove/{env}/{key}` (e.g. `/bountymove/dev/ANTHROPIC_API_KEY`)
- Pull secrets to local `.env.local` via `./scripts/pull-secrets.sh`

### Movement Details

**human notes:**
- Primary driver for blockchain interaction and development. Refer to their docs at ./refs/movement-docs as well as the hackathon info and project plans.

**agent notes:**
- CLI working dir for contract commands: `submission/bounty_board/`
- Deployed module address: `0xbd573c130b74f71bf82356cc87c0ee0d6228e423c370b7f5b4a009534bac7401`
- Network: Bardock Testnet (chainId 250), RPC: `https://testnet.movementnetwork.xyz/v1`
- Agent wallet (CLI default profile): same as module address above, max claim cap 0.5 MOVE
- Human wallet (Nightly browser): `0xabcd2ac4a5cb45bcbcc15b028057932adbee88ca45c0f0c1792bf3b75689ed74`
- Config: `.movement/config.yaml` at repo root (has `default` + `agent2` profiles)
- Encode strings to hex for CLI args: `echo -n "your string" | xxd -p | tr -d '\n'`

### Vercel Details

**human notes:**
- Use for frontend hosting

**agent notes:**
- Frontend root: `submission/frontend/`
- Production URL: https://frontend-zeta-amber-37.vercel.app
- Deploy: `cd submission/frontend && npx vercel --prod --yes`
- Env vars set in Vercel (public addresses only — not secrets):
  - `NEXT_PUBLIC_MODULE_ADDRESS` = deployed contract address
  - `NEXT_PUBLIC_AGENT_WALLET_ADDRESS` = CLI agent wallet
  - `NEXT_PUBLIC_HUMAN_WALLET_ADDRESS` = human browser wallet
- Secrets (`ANTHROPIC_API_KEY`, `AGENT_PRIVATE_KEY`) stay in SSM only — no server-side routes use them
- `typescript` and `eslint` build errors ignored via `next.config.ts` (template had pre-existing issues)

## Developer Practices

- write to ./scripts when necessary to optimize your workflow
- keep CLAUDE.md up to date and README.md up to date
- write to docs/progress/ periodically with very high level brief of development progress based on our original plans and project roadmap.
- always read .env directly and update .env and aws parameters accordingly. skip the .env.example practice and manipulate my real .env directly.

## Memory Bank Workflow

This project uses a structured development workflow. See [WORKFLOW.md](./WORKFLOW.md) for full documentation.

**Quick reference:** Start every task with `/van [description]`, then follow the routing:
- `/van` -> `/plan` -> `/creative` -> `/build` -> `/reflect` -> `/archive`
- Phases are skipped automatically based on task complexity (Level 1-4)
- Persistent context is stored in `memory-bank/` — check `memory-bank/activeContext.md` to see current state
