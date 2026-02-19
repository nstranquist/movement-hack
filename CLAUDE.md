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
- ...

## Developer Practices

- write to ./scripts when necessary to optimize your workflow
- keep CLAUDE.md up to date and README.md up to date

## Memory Bank Workflow

This project uses a structured development workflow. See [WORKFLOW.md](./WORKFLOW.md) for full documentation.

**Quick reference:** Start every task with `/van [description]`, then follow the routing:
- `/van` -> `/plan` -> `/creative` -> `/build` -> `/reflect` -> `/archive`
- Phases are skipped automatically based on task complexity (Level 1-4)
- Persistent context is stored in `memory-bank/` — check `memory-bank/activeContext.md` to see current state
