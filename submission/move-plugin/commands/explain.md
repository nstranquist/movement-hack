---
description: Explain the current Move file or selected code
---

# Explain Move Code

Analyze and explain the current Move file or selected code.

**Usage:** `/move:explain`

## Instructions

1. Read the current file (or use context if provided)

2. If it's a `.move` file, explain:
   - **Module structure** - What the module does
   - **Resources/structs** - Data types and their purpose
   - **Functions** - Entry points, view functions, internal helpers
   - **Abilities** - key, store, copy, drop and why they're used
   - **Access control** - Who can call what

3. Highlight Movement/Aptos-specific patterns:
   - Object model usage (ConstructorRef, TransferRef, etc.)
   - Fungible Asset patterns (primary_fungible_store, metadata)
   - Token patterns (collection, token)
   - Event emission

4. Note any potential issues:
   - Missing abilities
   - Access control concerns
   - Gas optimization opportunities

5. Use `search_framework` tool if you need to reference framework code for context

## Move 2.1 Reminder

Movement supports Move 2.1. Do NOT suggest:
- `&mut Resource[addr]` syntax (Move 2.2+)
- `#[randomness]` attribute (Move 2.2+)
