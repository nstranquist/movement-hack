# Move Plugin for Claude Code

Move smart contract development tools for Movement blockchain.

## Installation

### Via skills.sh (recommended)

```bash
npx skills add Rahat-ch/move-plugin
```

For Claude Code only:
```bash
npx skills add Rahat-ch/move-plugin -a claude-code
```

Global install (all projects):
```bash
npx skills add Rahat-ch/move-plugin -g -a claude-code
```

### Via Claude Code plugin marketplace

```bash
/plugin marketplace add Rahat-ch/move-plugin
/plugin install move
```

## Commands

| Command | Description |
|---------|-------------|
| `/move:new <template> <name>` | Scaffold a new Move project |
| `/move:explain` | Explain the current Move file |
| `/move:debug` | Parse compiler errors and suggest fixes |
| `/move:search <query>` | Search the Move framework |
| `/move:deploy` | Help with deployment to Movement |

### Templates

- `basic` - Simple module with init, entry, and view functions
- `fa` - Fungible Asset token with mint/burn/transfer
- `nft` - NFT collection with token minting

### Examples

```bash
# Create a new fungible asset project
/move:new fa my_token

# Search for object patterns
/move:search object

# Debug compiler errors
/move:debug
```

## MCP Tools

The plugin provides these tools to Claude:

- `scaffold_module` - Generate Move projects from templates
- `run_cli` - Execute Movement/Aptos CLI commands
- `search_framework` - Search Move framework code
- `query_rpc` - Query Movement chain via RPC
- `setup_cli` - Check, install, or initialize the CLI

## Move Expert Skill

The plugin includes a Move expert skill that automatically activates when:
- Working with `.move` files
- Discussing Move/Movement/Aptos concepts
- Debugging Move compiler errors
- Building smart contracts

## Requirements

- [Movement CLI](https://docs.movementnetwork.xyz/devs/movementcli) (recommended) or [Aptos CLI](https://github.com/aptos-labs/aptos-core/releases) v7.4.0 as fallback
- Node.js 18+

Install Movement CLI:
```bash
brew install movementlabsxyz/tap/movement
```

## Networks

**Bardock Testnet (Chain ID: 250)**
- RPC: `https://testnet.movementnetwork.xyz/v1`
- Faucet: `https://faucet.movementnetwork.xyz/`
- Explorer: `https://explorer.movementnetwork.xyz/?network=bardock+testnet`

**Mainnet (Chain ID: 126)**
- RPC: `https://mainnet.movementnetwork.xyz/v1`
- Explorer: `https://explorer.movementnetwork.xyz/?network=mainnet`

## License

Apache-2.0
