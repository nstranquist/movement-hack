---
description: Search Movement docs and framework code
---

# Search Move Resources

Search the Movement framework code and documentation.

**Usage:** `/move:search <query>`

**Arguments:**
- `$ARGUMENTS` - Search query (e.g., "fungible asset", "object model", "token")

## Instructions

1. Use the `search_framework` MCP tool with the query

2. Return results with:
   - **Relevant code snippets** from the framework
   - **Explanation** of what the code does
   - **Usage examples** if applicable

3. Common search topics:
   - `fungible_asset` - FA creation, minting, burning
   - `primary_fungible_store` - Default FA storage
   - `object` - Object model, refs, creation
   - `token` - NFT tokens
   - `collection` - NFT collections
   - `coin` - Legacy coin module
   - `account` - Account management
   - `signer` - Signer capabilities

4. If results aren't sufficient, suggest related searches

5. Always include the framework module path (e.g., `aptos_framework::fungible_asset`)

## Framework Locations

- `aptos_framework` - Core framework (FA, objects, account)
- `aptos_token_objects` - NFT token objects
- `aptos_token` - Legacy token v1
- `aptos_stdlib` - Standard library utilities
