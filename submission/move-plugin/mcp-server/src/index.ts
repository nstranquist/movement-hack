#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { scaffoldModule } from "./tools/scaffold.js";
import { runCli } from "./tools/cli.js";
import { searchFramework } from "./tools/search.js";
import { queryRpc } from "./tools/rpc.js";
import {
  resolveCli,
  getCliBinary,
  getInstallInstructions,
  resetCliCache,
} from "./tools/cli-detect.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const server = new Server(
  {
    name: "move-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scaffold_module",
        description: "Generate a new Move project from a template (basic, fa, nft). Uses CLI to initialize Move.toml with correct dependencies.",
        inputSchema: {
          type: "object",
          properties: {
            template: {
              type: "string",
              description: "Template type: basic, fa, or nft",
              enum: ["basic", "fa", "nft"],
            },
            name: {
              type: "string",
              description: "Project name (lowercase, underscores allowed)",
            },
            path: {
              type: "string",
              description: "Output directory path (defaults to current directory)",
            },
          },
          required: ["template", "name"],
        },
      },
      {
        name: "run_cli",
        description: "Execute a Movement CLI command (move compile, test, publish, etc.). Auto-detects installed CLI, falls back to Aptos CLI v7.4.0.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description: "The CLI command to run (e.g., 'move compile', 'move test')",
            },
            cwd: {
              type: "string",
              description: "Working directory for the command",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "search_framework",
        description: "Search the Move framework code for patterns, functions, or modules",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'fungible_asset', 'object::create')",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "query_rpc",
        description: "Query Movement chain via RPC (account resources, module info, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            method: {
              type: "string",
              description: "RPC method: account, resource, module, events",
              enum: ["account", "resource", "module", "events"],
            },
            address: {
              type: "string",
              description: "Account address to query",
            },
            resource_type: {
              type: "string",
              description: "Resource type (for resource method)",
            },
            module_name: {
              type: "string",
              description: "Module name (for module method)",
            },
            network: {
              type: "string",
              description: "Network: testnet or mainnet (defaults to testnet)",
              enum: ["testnet", "mainnet"],
            },
          },
          required: ["method", "address"],
        },
      },
      {
        name: "setup_cli",
        description: "Check, install, or initialize the Movement CLI (or Aptos CLI v7.4.0 fallback). Use 'check' to verify installation, 'install' for instructions, 'init' to set up account.",
        inputSchema: {
          type: "object",
          properties: {
            action: {
              type: "string",
              description: "Action: check (verify CLI), install (get instructions), init (setup account)",
              enum: ["check", "install", "init"],
            },
            network: {
              type: "string",
              description: "Network for init action: testnet or mainnet",
              enum: ["testnet", "mainnet"],
            },
            private_key: {
              type: "string",
              description: "Optional private key for init (to restore existing account)",
            },
          },
          required: ["action"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "scaffold_module": {
        const result = await scaffoldModule(
          args?.template as string,
          args?.name as string,
          args?.path as string | undefined
        );
        return { content: [{ type: "text", text: result }] };
      }
      case "run_cli": {
        const result = await runCli(
          args?.command as string,
          args?.cwd as string | undefined
        );
        return { content: [{ type: "text", text: result }] };
      }
      case "search_framework": {
        const result = await searchFramework(args?.query as string);
        return { content: [{ type: "text", text: result }] };
      }
      case "query_rpc": {
        const result = await queryRpc(
          args?.method as string,
          args?.address as string,
          args?.resource_type as string | undefined,
          args?.module_name as string | undefined,
          args?.network as string | undefined
        );
        return { content: [{ type: "text", text: result }] };
      }
      case "setup_cli": {
        const result = await handleSetupCli(
          args?.action as string,
          args?.network as string | undefined,
          args?.private_key as string | undefined
        );
        return { content: [{ type: "text", text: result }] };
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: `Error: ${errorMessage}` }] };
  }
});

async function handleSetupCli(
  action: string,
  network?: string,
  privateKey?: string
): Promise<string> {
  switch (action) {
    case "check": {
      resetCliCache();
      const info = await resolveCli(true);

      if (!info.cli) {
        return `CLI Status: NOT INSTALLED

No Movement or Aptos CLI detected.

${getInstallInstructions()}`;
      }

      const incompatMsg = info.cli === "aptos" ? "INCOMPATIBLE (must be exactly 7.4.0)" : "INCOMPATIBLE";
      const status = info.versionValid ? "COMPATIBLE" : incompatMsg;
      return `CLI Status: INSTALLED

CLI: ${info.cli}
Version: ${info.version} (${status})
Path: ${info.path}`;
    }

    case "install": {
      return getInstallInstructions();
    }

    case "init": {
      const info = await resolveCli();
      const binary = getCliBinary(info);

      if (!binary) {
        return `Error: No CLI found. Install first.

${getInstallInstructions()}`;
      }

      const net = network || "testnet";
      let cmd = `${binary} init --network ${net} --assume-yes`;
      if (privateKey) {
        cmd += ` --private-key ${privateKey}`;
      }

      try {
        const { stdout, stderr } = await execAsync(cmd, {
          timeout: 180000,
          maxBuffer: 10 * 1024 * 1024,
        });

        const output = stdout + (stderr ? `\n${stderr}` : "");
        return `Account initialized on ${net}.\n\n${output || "Success (no output)"}`;
      } catch (error: unknown) {
        if (error && typeof error === "object" && "stderr" in error) {
          const execError = error as { stdout?: string; stderr?: string; message?: string };
          return `Error initializing account:\n${execError.stderr || execError.stdout || execError.message || "Unknown error"}`;
        }
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    default:
      return `Unknown action "${action}". Use: check, install, or init`;
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Move MCP Server running on stdio");
}

main().catch(console.error);
