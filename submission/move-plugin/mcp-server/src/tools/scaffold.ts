import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { resolveCli, getCliBinary, getInstallInstructions } from "./cli-detect.js";

const execAsync = promisify(exec);

const GITIGNORE = `build/
.aptos/
.movement/
`;

const NFT_TOML_DEPENDENCY = `
[dependencies.AptosTokenObjects]
git = "https://github.com/movementlabsxyz/aptos-core.git"
rev = "m1"
subdir = "aptos-move/framework/aptos-token-objects"
`;

const BASIC_MODULE = `module {{NAME}}::{{NAME}} {
    use std::signer;

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;

    struct Config has key {
        admin: address,
        value: u64,
    }

    fun init_module(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        assert!(!exists<Config>(deployer_addr), E_ALREADY_INITIALIZED);

        move_to(deployer, Config {
            admin: deployer_addr,
            value: 0,
        });
    }

    public entry fun set_value(admin: &signer, new_value: u64) acquires Config {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<Config>(admin_addr);
        assert!(config.admin == admin_addr, E_NOT_INITIALIZED);
        config.value = new_value;
    }

    #[view]
    public fun get_value(addr: address): u64 acquires Config {
        borrow_global<Config>(addr).value
    }
}
`;

const BASIC_TEST = `#[test_only]
module {{NAME}}::{{NAME}}_tests {
    use std::signer;
    use {{NAME}}::{{NAME}};

    #[test(admin = @{{NAME}})]
    fun test_init_and_set(admin: &signer) {
        {{NAME}}::set_value(admin, 42);
        let value = {{NAME}}::get_value(signer::address_of(admin));
        assert!(value == 42, 0);
    }
}
`;

const FA_MODULE = `module {{NAME}}::{{NAME}} {
    use std::string::{Self, String};
    use std::option;
    use std::signer;
    use aptos_framework::fungible_asset::{Self, MintRef, BurnRef, TransferRef, Metadata};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    const E_NOT_ADMIN: u64 = 1;
    const E_INVALID_METADATA: u64 = 2;

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct FAController has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
        admin: address,
    }

    fun init_module(deployer: &signer) {
        let constructor_ref = object::create_sticky_object(@{{NAME}});

        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            option::some(1_000_000_000_000_000), // max supply: 1B with 8 decimals
            string::utf8(b"{{NAME}} Token"),
            string::utf8(b"{{SYMBOL}}"),
            8,
            string::utf8(b""),
            string::utf8(b""),
        );

        let obj_signer = object::generate_signer(&constructor_ref);
        move_to(&obj_signer, FAController {
            mint_ref: fungible_asset::generate_mint_ref(&constructor_ref),
            burn_ref: fungible_asset::generate_burn_ref(&constructor_ref),
            transfer_ref: fungible_asset::generate_transfer_ref(&constructor_ref),
            admin: signer::address_of(deployer),
        });
    }

    public entry fun mint(
        admin: &signer,
        recipient: address,
        amount: u64
    ) acquires FAController {
        let metadata = get_metadata();
        let controller = borrow_global<FAController>(object::object_address(&metadata));
        assert!(signer::address_of(admin) == controller.admin, E_NOT_ADMIN);

        let fa = fungible_asset::mint(&controller.mint_ref, amount);
        primary_fungible_store::deposit(recipient, fa);
    }

    public entry fun burn(
        admin: &signer,
        from: address,
        amount: u64
    ) acquires FAController {
        let metadata = get_metadata();
        let controller = borrow_global<FAController>(object::object_address(&metadata));
        assert!(signer::address_of(admin) == controller.admin, E_NOT_ADMIN);

        let from_store = primary_fungible_store::primary_store(from, metadata);
        fungible_asset::burn_from(&controller.burn_ref, from_store, amount);
    }

    public entry fun transfer(
        sender: &signer,
        recipient: address,
        amount: u64
    ) {
        let metadata = get_metadata();
        primary_fungible_store::transfer(sender, metadata, recipient, amount);
    }

    #[view]
    public fun balance(owner: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(owner, metadata)
    }

    #[view]
    public fun get_metadata(): Object<Metadata> {
        let metadata_addr = object::create_object_address(&@{{NAME}}, b"");
        object::address_to_object<Metadata>(metadata_addr)
    }
}
`;

const FA_TEST = `#[test_only]
module {{NAME}}::{{NAME}}_tests {
    use std::signer;
    use {{NAME}}::{{NAME}};

    #[test(admin = @{{NAME}}, user = @0x123)]
    fun test_mint_and_transfer(admin: &signer, user: &signer) {
        let user_addr = signer::address_of(user);

        {{NAME}}::mint(admin, signer::address_of(admin), 1000);
        {{NAME}}::transfer(admin, user_addr, 500);

        assert!({{NAME}}::balance(user_addr) == 500, 0);
    }
}
`;

const NFT_MODULE = `module {{NAME}}::{{NAME}} {
    use std::string::{Self, String};
    use std::option;
    use std::signer;
    use aptos_framework::object::{Self, Object};
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_OWNER: u64 = 2;

    const COLLECTION_NAME: vector<u8> = b"{{NAME}} Collection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A collection of {{NAME}} NFTs";
    const COLLECTION_URI: vector<u8> = b"https://example.com/collection";

    struct CollectionConfig has key {
        admin: address,
        minted: u64,
    }

    struct TokenData has key {
        name: String,
        token_id: u64,
    }

    fun init_module(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);

        collection::create_unlimited_collection(
            deployer,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI),
        );

        move_to(deployer, CollectionConfig {
            admin: deployer_addr,
            minted: 0,
        });
    }

    public entry fun mint(
        admin: &signer,
        recipient: address,
        token_name: String,
        token_uri: String,
    ) acquires CollectionConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<CollectionConfig>(@{{NAME}});
        assert!(admin_addr == config.admin, E_NOT_ADMIN);

        config.minted = config.minted + 1;
        let token_id = config.minted;

        let constructor_ref = token::create(
            admin,
            string::utf8(COLLECTION_NAME),
            string::utf8(b""),
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&constructor_ref);
        move_to(&token_signer, TokenData {
            name: token_name,
            token_id,
        });

        let token_obj = object::object_from_constructor_ref<token::Token>(&constructor_ref);
        object::transfer(admin, token_obj, recipient);
    }

    public entry fun transfer(
        owner: &signer,
        token: Object<token::Token>,
        recipient: address,
    ) {
        assert!(object::is_owner(token, signer::address_of(owner)), E_NOT_OWNER);
        object::transfer(owner, token, recipient);
    }

    #[view]
    public fun total_minted(): u64 acquires CollectionConfig {
        borrow_global<CollectionConfig>(@{{NAME}}).minted
    }
}
`;

const NFT_TEST = `#[test_only]
module {{NAME}}::{{NAME}}_tests {
    use std::string;
    use std::signer;
    use {{NAME}}::{{NAME}};

    #[test(admin = @{{NAME}}, user = @0x123)]
    fun test_mint(admin: &signer, user: &signer) {
        let user_addr = signer::address_of(user);

        {{NAME}}::mint(
            admin,
            user_addr,
            string::utf8(b"Token #1"),
            string::utf8(b"https://example.com/token/1"),
        );

        assert!({{NAME}}::total_minted() == 1, 0);
    }
}
`;

function replaceTemplateVars(content: string, name: string): string {
  const symbol = name.substring(0, 4).toUpperCase();
  return content
    .replace(/\{\{NAME\}\}/g, name)
    .replace(/\{\{SYMBOL\}\}/g, symbol);
}

async function runCliInit(
  binary: string,
  name: string,
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await execAsync(`${binary} move init --name ${name} --assume-yes`, {
      cwd: projectPath,
      timeout: 60000,
    });
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}

function appendNftDependency(projectPath: string): void {
  const tomlPath = path.join(projectPath, "Move.toml");
  const content = fs.readFileSync(tomlPath, "utf-8");
  if (!content.includes("AptosTokenObjects")) {
    fs.appendFileSync(tomlPath, NFT_TOML_DEPENDENCY);
  }
}

function fixTomlRev(projectPath: string): void {
  const tomlPath = path.join(projectPath, "Move.toml");
  if (!fs.existsSync(tomlPath)) return;
  let content = fs.readFileSync(tomlPath, "utf-8");
  content = content.replace(/rev\s*=\s*"[^"]*"/g, 'rev = "m1"');
  fs.writeFileSync(tomlPath, content);
}

function ensureAddress(projectPath: string, name: string): void {
  const tomlPath = path.join(projectPath, "Move.toml");
  if (!fs.existsSync(tomlPath)) return;
  let content = fs.readFileSync(tomlPath, "utf-8");
  const addrPattern = new RegExp(`^${name}\\s*=`, "m");
  if (!addrPattern.test(content)) {
    content = content.replace(
      /\[addresses\]\s*\n/,
      `[addresses]\n${name} = "_"\n`
    );
    fs.writeFileSync(tomlPath, content);
  }
}

export async function scaffoldModule(
  template: string,
  name: string,
  outputPath?: string
): Promise<string> {
  const projectPath = path.join(outputPath || process.cwd(), name);

  if (fs.existsSync(projectPath)) {
    return `Error: Directory ${projectPath} already exists`;
  }

  const validTemplates = ["basic", "fa", "nft"];
  if (!validTemplates.includes(template)) {
    return `Error: Unknown template "${template}". Use: basic, fa, or nft`;
  }

  const cliInfo = await resolveCli();
  const binary = getCliBinary(cliInfo);

  if (!binary) {
    return `Error: No Movement or Aptos CLI found. CLI is required for project scaffolding.

${getInstallInstructions()}`;
  }

  fs.mkdirSync(projectPath, { recursive: true });

  const initResult = await runCliInit(binary, name, projectPath);

  if (!initResult.success) {
    fs.rmSync(projectPath, { recursive: true, force: true });
    return `Error: CLI init failed: ${initResult.error}

Make sure ${cliInfo.cli} CLI is properly installed and working.
${getInstallInstructions()}`;
  }

  fixTomlRev(projectPath);
  ensureAddress(projectPath, name);

  if (!fs.existsSync(path.join(projectPath, "tests"))) {
    fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true });
  }

  let moduleContent: string;
  let testContent: string;

  switch (template) {
    case "basic":
      moduleContent = BASIC_MODULE;
      testContent = BASIC_TEST;
      break;
    case "fa":
      moduleContent = FA_MODULE;
      testContent = FA_TEST;
      break;
    case "nft":
      moduleContent = NFT_MODULE;
      testContent = NFT_TEST;
      appendNftDependency(projectPath);
      break;
    default:
      moduleContent = BASIC_MODULE;
      testContent = BASIC_TEST;
  }

  fs.writeFileSync(
    path.join(projectPath, "sources", `${name}.move`),
    replaceTemplateVars(moduleContent, name)
  );

  fs.writeFileSync(
    path.join(projectPath, "tests", `${name}_tests.move`),
    replaceTemplateVars(testContent, name)
  );

  fs.writeFileSync(path.join(projectPath, ".gitignore"), GITIGNORE);

  const cliName = cliInfo.cli || "movement";
  const readme = `# ${name}

A Move smart contract for Movement blockchain.

## Prerequisites

Install the Movement CLI:
\`\`\`bash
brew install movementlabsxyz/tap/movement
\`\`\`

Or if needed, Aptos CLI v7.4.0 as alternative:
\`\`\`bash
brew install aptos
\`\`\`

## Build

\`\`\`bash
${cliName} move compile --named-addresses ${name}=default
\`\`\`

## Test

\`\`\`bash
${cliName} move test --named-addresses ${name}=default
\`\`\`

## Deploy

\`\`\`bash
# Initialize account (first time)
${cliName} init --network testnet

# Fund account
# Visit: https://faucet.movementnetwork.xyz/

# Publish
${cliName} move publish --named-addresses ${name}=default
\`\`\`
`;

  fs.writeFileSync(path.join(projectPath, "README.md"), readme);

  return `Created ${template} project at ${projectPath}

Structure:
├── Move.toml (generated by ${cliInfo.cli} CLI, rev = "m1")
├── sources/${name}.move
├── tests/${name}_tests.move
├── .gitignore
└── README.md

CLI: ${cliInfo.cli} v${cliInfo.version} ${cliInfo.versionValid ? "(compatible)" : "(version may be incompatible)"}

Next steps:
1. cd ${name}
2. ${cliName} move compile --named-addresses ${name}=default
3. ${cliName} move test --named-addresses ${name}=default`;
}
