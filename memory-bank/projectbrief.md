# Project Brief

## Project
**BountyMove** — On-chain task bounty board on Movement Network with AI agent guardrails. Built for the Open Claw Hackathon at ETH Denver (Feb 19, 2025, 5-hour window). Track 1: Build with an AI Agent.

**Pitch:** Users post tasks with MOVE tokens locked in escrow. AI agents can autonomously claim and complete bounties, but the Move smart contract enforces a hard cap — if the agent tries to claim above its limit, the transaction reverts on-chain. Safety constraints enforced by the blockchain, not application code.

## Tech Stack
- **Smart contract:** Move 2.1 on Movement Network Mainnet (Chain ID 126)
- **Frontend:** Next.js 15.5.12, Aptos SDK v4, wallet-adapter-react v7, shadcn/ui, Tailwind CSS
- **Agent tooling:** Claude Code + Move Plugin MCP server
- **CLI:** Movement CLI v7.4.0, Aptos CLI 8.0.0 (fallback)
- **Infra:** AWS SSM for secrets, Vercel for frontend hosting, Terraform for IaC
- **Network:** Mainnet RPC `https://full.mainnet.movementinfra.xyz/v1` (testnet was down)
- **Deployer wallet:** `0xbd573c...7401` (root `~/.movement/config.yaml`)
- **Vercel URL:** https://frontend-zeta-amber-37.vercel.app

## Key Directories
- `submission/bounty_board/` — Move smart contract project
- `submission/frontend/` — Next.js frontend app
- `submission/move-plugin/` — Move Plugin (MCP tools for contract dev)
- `docs/project-spec/` — Project plans and specs
- `hackathon-notes/` — Hackathon info and rules
- `refs/` — Reference repos and docs
- `infra/` — Terraform IaC (if needed)
- `scripts/` — Workflow scripts

## Conventions
- Use `movement` CLI (not `aptos`) for all blockchain operations
- Git repo root is project root, source lives in `./submission/`
- Secrets via AWS SSM Parameter Store at `/bountymove/{env}/{key}`
- Target $0 AWS cost — no paid services without confirmation
- Frontend hosting on Vercel (not AWS)
- Keep CLAUDE.md and README.md up to date
