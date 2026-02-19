---
description: Parse Move compiler errors and suggest fixes
---

# Debug Move Code

Parse compiler errors from stderr and suggest fixes.

**Usage:** `/move:debug`

## Instructions

1. Check for recent compiler output:
   - Look for error messages in the terminal/output
   - Parse the error location (file:line:column)
   - Identify the error type

2. Common error patterns and fixes:

   **Ability Errors:**
   - "does not have the 'key' ability" → Add `has key` to struct
   - "does not have the 'store' ability" → Add `has store` to struct
   - "cannot copy" → Add `has copy` or use `&` reference

   **Borrow Errors:**
   - "cannot borrow" → Check mutability, use `borrow_global_mut`
   - "still borrowed" → Ensure reference is dropped before re-borrow

   **Type Errors:**
   - "expected X, found Y" → Check function signatures
   - "mismatched types" → Verify generic parameters

   **Move Errors:**
   - "cannot move out" → Use `move_from` or copy the value
   - "resource already exists" → Check `exists<T>(addr)` first

   **Access Errors:**
   - "function is not public" → Add `public` or `public(friend)`
   - "module not found" → Check Move.toml dependencies

3. Read the relevant source file at the error location

4. Use `search_framework` if the error involves framework types

5. Provide:
   - What the error means
   - The specific fix with code
   - Why this fixes the issue

## Run Compiler

To get fresh errors, suggest running:
```bash
movement move compile 2>&1
```
