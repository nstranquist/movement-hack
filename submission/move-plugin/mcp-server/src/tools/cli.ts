import { exec } from "child_process";
import { promisify } from "util";
import { resolveCli, getCliBinary, getInstallInstructions } from "./cli-detect.js";

const execAsync = promisify(exec);

const MOVE_COMMANDS = [
  "move compile",
  "move test",
  "move publish",
  "move run",
  "move run-script",
  "move prove",
  "move coverage",
  "move clean",
  "move disassemble",
  "move decompile",
  "move document",
  "move download",
  "move init",
  "move lint",
  "move list",
  "move view",
  "move fmt",
  "move simulate",
  "move verify-package",
  "move deploy-object",
  "move upgrade-object",
  "move create-object-and-publish-package",
  "move upgrade-object-package",
  "move create-resource-account-and-publish-package",
  "move build-publish-payload",
];

const ACCOUNT_COMMANDS = [
  "account create",
  "account create-resource-account",
  "account derive-resource-account-address",
  "account fund-with-faucet",
  "account balance",
  "account list",
  "account lookup-address",
  "account transfer",
];

const OTHER_COMMANDS = [
  "init",
  "info",
  "key generate",
  "key extract-peer",
  "--version",
  "--help",
];

const ALLOWED_COMMANDS = [...MOVE_COMMANDS, ...ACCOUNT_COMMANDS, ...OTHER_COMMANDS];

function isAllowedCommand(command: string): boolean {
  return ALLOWED_COMMANDS.some((allowed) => command.startsWith(allowed));
}

export async function runCli(
  command: string,
  cwd?: string
): Promise<string> {
  if (!isAllowedCommand(command)) {
    return `Error: Command not allowed.

Allowed move commands:
  ${MOVE_COMMANDS.join("\n  ")}

Allowed account commands:
  ${ACCOUNT_COMMANDS.join("\n  ")}

Other commands:
  ${OTHER_COMMANDS.join("\n  ")}

Usage: Pass command without CLI prefix (e.g., "move compile" not "movement move compile")`;
  }

  const cliInfo = await resolveCli();
  const binary = getCliBinary(cliInfo);

  if (!binary) {
    return `Error: No Movement or Aptos CLI found.

${getInstallInstructions()}`;
  }

  let warning = "";
  if (!cliInfo.versionValid) {
    warning = cliInfo.cli === "aptos"
      ? `Warning: Aptos CLI version ${cliInfo.version} is not supported. Only v7.4.0 is compatible.\n\n`
      : `Warning: ${cliInfo.cli} CLI version ${cliInfo.version} may be incompatible.\n\n`;
  }

  const fullCommand = `${binary} ${command}`;
  const options = cwd ? { cwd } : {};

  try {
    const { stdout, stderr } = await execAsync(fullCommand, {
      ...options,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const output = stdout + (stderr ? `\n${stderr}` : "");
    return warning + (output || "Command completed successfully (no output)");
  } catch (error: unknown) {
    if (error && typeof error === "object" && "stderr" in error) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      return `${warning}Error:\n${execError.stderr || execError.message || "Unknown error"}`;
    }
    return `${warning}Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
