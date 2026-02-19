---
description: Help deploy Move modules to Movement network
---

# Deploy to Movement

Help with deploying Move modules to Movement blockchain.

**Usage:** `/move:deploy`

## Instructions

1. Verify CLI is installed:
   - Use `setup_cli` tool with action `check`
   - If not installed, use `setup_cli` with action `install` to show instructions
   - Movement CLI is recommended; Aptos CLI v7.4.0 is supported as fallback

2. Check project is ready:
   - Verify Move.toml exists with correct dependencies (rev should be "m1")
   - Ensure code compiles: `movement move compile`
   - Run tests: `movement move test`

3. Ask user which network:
   - **Bardock Testnet** (recommended for testing)
   - **Mainnet** (production)

4. Network configuration:

   **Bardock Testnet (Chain ID: 250)**
   ```bash
   movement init --network testnet
   ```
   - RPC: `https://testnet.movementnetwork.xyz/v1`
   - Faucet: `https://faucet.movementnetwork.xyz/`
   - Explorer: `https://explorer.movementnetwork.xyz/?network=bardock+testnet`

   **Mainnet (Chain ID: 126)**
   ```bash
   movement init --network mainnet
   ```
   - RPC: `https://mainnet.movementnetwork.xyz/v1`
   - Explorer: `https://explorer.movementnetwork.xyz/?network=mainnet`

5. Initialize account:
   - Use `setup_cli` tool with action `init` and the selected network
   - This runs `movement init --network <network> --assume-yes` non-interactively
   - Accepts optional `private_key` param to restore existing account

6. Offer to run or show commands:
   - "Should I run the deployment command, or just show you what to run?"

7. Deployment steps:
   ```bash
   # Fund account on testnet
   # Visit: https://faucet.movementnetwork.xyz/

   # Deploy
   movement move publish --named-addresses my_addr=default
   ```

8. After deployment:
   - Show the deployed module address
   - Link to explorer to verify
   - Explain how to interact with the module

## Important

- Testnet deployments are free (use faucet)
- Mainnet requires MOVE tokens for gas
- Always test on Bardock first
- Aptos CLI v7.4.0 works as fallback if Movement CLI is unavailable
