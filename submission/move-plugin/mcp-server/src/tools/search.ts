import * as fs from "fs";
import * as path from "path";

const FRAMEWORK_MODULES: Record<string, string[]> = {
  "aptos_framework": [
    "account", "aptos_account", "aptos_coin", "code", "coin", "event",
    "fungible_asset", "object", "primary_fungible_store", "resource_account",
    "timestamp", "transaction_context", "util", "voting"
  ],
  "aptos_token_objects": [
    "collection", "token", "aptos_token", "property_map", "royalty"
  ],
  "aptos_stdlib": [
    "simple_map", "smart_table", "smart_vector", "table", "type_info",
    "math64", "math128", "comparator", "pool_u64"
  ],
  "std": [
    "bcs", "error", "option", "signer", "string", "vector", "hash"
  ]
};

const COMMON_PATTERNS: Record<string, string> = {
  "fungible_asset": `// Fungible Asset Pattern
use aptos_framework::fungible_asset::{Self, MintRef, BurnRef, TransferRef, Metadata};
use aptos_framework::primary_fungible_store;
use aptos_framework::object::{Self, Object};

// Create FA with primary store
let constructor_ref = object::create_sticky_object(@my_addr);
primary_fungible_store::create_primary_store_enabled_fungible_asset(
    &constructor_ref,
    option::some(max_supply),
    name, symbol, decimals, icon_uri, project_uri
);

// Generate refs (must be at creation)
let mint_ref = fungible_asset::generate_mint_ref(&constructor_ref);
let burn_ref = fungible_asset::generate_burn_ref(&constructor_ref);
let transfer_ref = fungible_asset::generate_transfer_ref(&constructor_ref);

// Mint tokens
let fa = fungible_asset::mint(&mint_ref, amount);
primary_fungible_store::deposit(recipient, fa);

// Check balance
primary_fungible_store::balance(owner, metadata)`,

  "object": `// Object Model Pattern
use aptos_framework::object::{Self, Object, ConstructorRef, ExtendRef};

// Create named object (deterministic address)
let constructor_ref = object::create_named_object(creator, b"seed");

// Create random object
let constructor_ref = object::create_object(creator_addr);

// Get object signer for storing resources
let obj_signer = object::generate_signer(&constructor_ref);
move_to(&obj_signer, MyResource { ... });

// Generate refs at creation time
let extend_ref = object::generate_extend_ref(&constructor_ref);
let transfer_ref = object::generate_transfer_ref(&constructor_ref);
let delete_ref = object::generate_delete_ref(&constructor_ref);

// Get object address
let obj_addr = object::object_address(&obj);

// Transfer object
object::transfer(owner, obj, recipient);`,

  "token": `// NFT Token Pattern
use aptos_token_objects::collection;
use aptos_token_objects::token;

// Create collection
collection::create_unlimited_collection(
    creator,
    description,
    name,
    option::none(), // royalty
    uri
);

// Mint token
let constructor_ref = token::create(
    creator,
    collection_name,
    description,
    token_name,
    option::none(), // royalty
    uri
);

// Add custom data
let token_signer = object::generate_signer(&constructor_ref);
move_to(&token_signer, MyTokenData { ... });

// Transfer to recipient
let token_obj = object::object_from_constructor_ref(&constructor_ref);
object::transfer(creator, token_obj, recipient);`,

  "collection": `// Collection Pattern
use aptos_token_objects::collection;

// Unlimited collection
collection::create_unlimited_collection(
    creator, description, name, royalty, uri
);

// Fixed supply collection
collection::create_fixed_collection(
    creator, description, max_supply, name, royalty, uri
);`,

  "event": `// Event Pattern
use aptos_framework::event;

#[event]
struct MyEvent has drop, store {
    field1: u64,
    field2: address,
}

// Emit event
event::emit(MyEvent { field1: 100, field2: @0x1 });`,

  "signer": `// Signer Pattern
use std::signer;

// Get address from signer
let addr = signer::address_of(signer);

// Signer proves account ownership
// Cannot be forged or transferred`,

  "borrow_global": `// Global Storage Pattern
// Store resource
move_to(signer, MyResource { ... });

// Check existence
exists<MyResource>(addr)

// Immutable borrow
let ref = borrow_global<MyResource>(addr);

// Mutable borrow (Move 2.1 syntax)
let ref = borrow_global_mut<MyResource>(addr);

// Remove resource
let resource = move_from<MyResource>(addr);

// IMPORTANT: Add acquires annotation
fun my_func() acquires MyResource { ... }`,

  "primary_fungible_store": `// Primary Fungible Store Pattern
use aptos_framework::primary_fungible_store;

// Create store-enabled FA (during init)
primary_fungible_store::create_primary_store_enabled_fungible_asset(
    &constructor_ref, max_supply, name, symbol, decimals, icon, project
);

// Deposit
primary_fungible_store::deposit(recipient, fa);

// Withdraw
let fa = primary_fungible_store::withdraw(sender, metadata, amount);

// Transfer
primary_fungible_store::transfer(sender, metadata, recipient, amount);

// Balance
primary_fungible_store::balance(owner, metadata)

// Get/ensure store
let store = primary_fungible_store::primary_store(owner, metadata);
let store = primary_fungible_store::ensure_primary_store_exists(owner, metadata);`,

  "coin": `// Legacy Coin Pattern (prefer FA for new code)
use aptos_framework::coin;

// Register to receive coin
coin::register<CoinType>(account);

// Transfer
coin::transfer<CoinType>(from, to, amount);

// Balance
coin::balance<CoinType>(addr)

// Withdraw/Deposit
let coins = coin::withdraw<CoinType>(account, amount);
coin::deposit(recipient, coins);`,

  "ability": `// Move Abilities
// key - Can be stored as top-level resource (move_to, borrow_global, etc.)
// store - Can be stored inside other structs
// copy - Can be duplicated
// drop - Can be discarded

// Common patterns:
struct Resource has key { ... }                    // Top-level only
struct Data has key, store { ... }                 // Top-level + nested
struct Value has store, copy, drop { ... }         // Value type
struct Event has drop { ... }                      // Events

// Without abilities:
struct LinearAsset { ... }  // Must be explicitly consumed`,
};

export async function searchFramework(query: string): Promise<string> {
  const lowerQuery = query.toLowerCase();
  const results: string[] = [];

  // Check for common patterns first
  for (const [pattern, code] of Object.entries(COMMON_PATTERNS)) {
    if (lowerQuery.includes(pattern) || pattern.includes(lowerQuery)) {
      results.push(`## ${pattern}\n\n\`\`\`move\n${code}\n\`\`\``);
    }
  }

  // Search framework modules
  const matchingModules: string[] = [];
  for (const [framework, modules] of Object.entries(FRAMEWORK_MODULES)) {
    for (const mod of modules) {
      if (mod.includes(lowerQuery) || lowerQuery.includes(mod)) {
        matchingModules.push(`${framework}::${mod}`);
      }
    }
  }

  if (matchingModules.length > 0) {
    results.push(`## Related Framework Modules\n\n${matchingModules.map(m => `- \`${m}\``).join("\n")}`);
  }

  // Search for error patterns
  if (lowerQuery.includes("error") || lowerQuery.includes("abort")) {
    results.push(`## Error Handling

\`\`\`move
// Define error constants
const E_NOT_FOUND: u64 = 1;
const E_NOT_AUTHORIZED: u64 = 2;

// Assert pattern
assert!(condition, E_NOT_FOUND);

// Using std::error module
use std::error;
abort error::not_found(E_NOT_FOUND)
abort error::permission_denied(E_NOT_AUTHORIZED)
\`\`\``);
  }

  // Search for view functions
  if (lowerQuery.includes("view") || lowerQuery.includes("read")) {
    results.push(`## View Functions

\`\`\`move
#[view]
public fun get_value(addr: address): u64 acquires MyResource {
    borrow_global<MyResource>(addr).value
}
\`\`\`

View functions:
- Marked with #[view]
- No gas cost when called via RPC
- Cannot modify state
- Can read global storage (add acquires)`);
  }

  if (results.length === 0) {
    return `No results found for "${query}".

Try searching for:
- Module names: fungible_asset, object, token, collection, coin
- Patterns: borrow_global, event, signer, ability
- Concepts: view, error`;
  }

  return results.join("\n\n---\n\n");
}
