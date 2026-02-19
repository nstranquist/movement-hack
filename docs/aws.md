# AWS Setup — BountyMove

## Philosophy

Target cost: **$0**. All state lives on-chain; AWS is only used for secret management.

## Services Used

| Service | Purpose | Cost |
|---------|---------|------|
| SSM Parameter Store (Standard) | Store API keys and private keys | Free |

**Not used:** Secrets Manager, RDS, S3, ECS, Amplify, Lambda (run agent locally for demo).

**Frontend hosting:** Vercel — not AWS.

## Secret Paths

Convention: `/bountymove/{env}/{key}`

| Parameter | Type | Description |
|-----------|------|-------------|
| `/bountymove/dev/ANTHROPIC_API_KEY` | SecureString | Claude API key for the agent |
| `/bountymove/dev/AGENT_PRIVATE_KEY` | SecureString | Movement wallet private key for the agent |
| `/bountymove/dev/MODULE_ADDRESS` | String | Deployed contract address (set after `movement move publish`) |

## Infrastructure

Managed via Terraform in `./infra/main.tf`.

```bash
cd infra
terraform init
terraform apply
```

Parameters are created as placeholders with `lifecycle { ignore_changes = [value] }` — Terraform won't overwrite values you set manually.

## Setting Secret Values

```bash
# Anthropic API key
aws ssm put-parameter \
  --name /bountymove/dev/ANTHROPIC_API_KEY \
  --value 'sk-ant-...' \
  --type SecureString \
  --overwrite

# Agent Movement wallet private key
aws ssm put-parameter \
  --name /bountymove/dev/AGENT_PRIVATE_KEY \
  --value '0x...' \
  --type SecureString \
  --overwrite

# Deployed contract address (fill in after `movement move publish`)
aws ssm put-parameter \
  --name /bountymove/dev/MODULE_ADDRESS \
  --value '0x...' \
  --type String \
  --overwrite
```

## Local Development

Pull all secrets into `submission/frontend/.env.local`:

```bash
./scripts/pull-secrets.sh         # defaults to dev
./scripts/pull-secrets.sh dev     # explicit env
```

The `.env.local` file is gitignored — never commit it.

## AWS Account

- **Account ID:** 703824314632
- **IAM User:** `ai-agent-hackathon-vibers-backup`
- **Region:** `us-east-1`
