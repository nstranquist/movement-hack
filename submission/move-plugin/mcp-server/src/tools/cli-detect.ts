import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execAsync = promisify(exec);

export interface CliInfo {
  cli: "movement" | "aptos" | null;
  version: string | null;
  versionValid: boolean;
  path: string | null;
}

const REQUIRED_APTOS_VERSION = "7.4.0";
const COMMON_PATHS = ["/opt/homebrew/bin", "/usr/local/bin", "/usr/bin"];

let cachedCli: CliInfo | null = null;

export function parseVersion(output: string): string | null {
  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

function isVersionValid(cli: "movement" | "aptos", version: string): boolean {
  if (cli === "movement") return true;
  return version === REQUIRED_APTOS_VERSION;
}

async function tryCliVersion(
  binary: string
): Promise<{ version: string | null; path: string | null }> {
  try {
    const { stdout } = await execAsync(`${binary} --version`, { timeout: 10000 });
    const version = parseVersion(stdout);
    if (version) {
      const { stdout: whichOut } = await execAsync(
        process.platform === "win32" ? `where ${binary}` : `which ${binary}`,
        { timeout: 5000 }
      ).catch(() => ({ stdout: binary }));
      return { version, path: whichOut.trim().split("\n")[0] };
    }
  } catch {}

  for (const dir of COMMON_PATHS) {
    const fullPath = `${dir}/${binary}`;
    if (fs.existsSync(fullPath)) {
      try {
        const { stdout } = await execAsync(`${fullPath} --version`, { timeout: 10000 });
        const version = parseVersion(stdout);
        if (version) return { version, path: fullPath };
      } catch {}
    }
  }

  return { version: null, path: null };
}

export async function resolveCli(forceRefresh = false): Promise<CliInfo> {
  if (cachedCli && !forceRefresh) return cachedCli;

  const movement = await tryCliVersion("movement");
  if (movement.version) {
    cachedCli = {
      cli: "movement",
      version: movement.version,
      versionValid: isVersionValid("movement", movement.version),
      path: movement.path,
    };
    return cachedCli;
  }

  const aptos = await tryCliVersion("aptos");
  if (aptos.version) {
    cachedCli = {
      cli: "aptos",
      version: aptos.version,
      versionValid: isVersionValid("aptos", aptos.version),
      path: aptos.path,
    };
    return cachedCli;
  }

  cachedCli = { cli: null, version: null, versionValid: false, path: null };
  return cachedCli;
}

export function getCliBinary(info: CliInfo): string | null {
  if (!info.cli) return null;
  return info.path || info.cli;
}

export function getInstallInstructions(platform?: string): string {
  const os = platform || process.platform;

  if (os === "darwin" || os === "linux") {
    return `## Install Movement CLI

\`\`\`bash
brew install movementlabsxyz/tap/movement
\`\`\`

Verify:
\`\`\`bash
movement --version
\`\`\`

### Alternative: Aptos CLI (v7.4.0 only)
\`\`\`bash
brew install aptos
\`\`\``;
  }

  return `## Install Movement CLI

Movement CLI is not yet available via native Windows package managers.

### Option 1: Use WSL (recommended)
\`\`\`bash
# In WSL:
brew install movementlabsxyz/tap/movement
\`\`\`

### Option 2: Aptos CLI (v7.4.0 only)
Download from: https://github.com/aptos-labs/aptos-core/releases
\`\`\`bash
aptos --version
\`\`\``;
}

export function resetCliCache(): void {
  cachedCli = null;
}
