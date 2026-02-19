---
description: Scaffold a new Move project from templates (basic, fa, nft)
---

# New Move Project

Create a new Move project for Movement blockchain using the specified template.

**Usage:** `/move:new <template> <name>`

**Templates:**
- `basic` - Basic module with init and entry functions
- `fa` - Fungible Asset with mint/burn/transfer
- `nft` - NFT Collection with token objects

**Arguments:**
- `$1` - Template type (basic, fa, nft)
- `$2` - Project name

## Prerequisites

Movement CLI must be installed. The scaffolding tool uses `movement move init` to generate Move.toml with correct dependencies. Aptos CLI v7.4.0 is supported as a fallback if Movement CLI is unavailable.

Use the `setup_cli` tool with action `check` to verify CLI is available before scaffolding.

## Instructions

1. Verify CLI is installed using `setup_cli` check action

2. Use the `scaffold_module` MCP tool with:
   - `template`: $1 (or "basic" if not specified)
   - `name`: $2 (required)

3. The tool will:
   - Run `<cli> move init --name <name>` to generate Move.toml with correct deps (rev = "m1")
   - Create `sources/` with main module from template
   - Create `tests/` with test file
   - Add `.gitignore` and `README.md`
   - For NFT template: append `AptosTokenObjects` dependency to Move.toml

4. After scaffolding, explain:
   - How to compile: `movement move compile --named-addresses <name>=default`
   - How to test: `movement move test --named-addresses <name>=default`
   - How to deploy: `movement move publish --named-addresses <name>=default`

## Networks

- **Bardock Testnet** (Chain ID: 250): `https://testnet.movementnetwork.xyz/v1`
- **Mainnet** (Chain ID: 126): `https://mainnet.movementnetwork.xyz/v1`
