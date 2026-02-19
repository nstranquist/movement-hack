const NETWORKS: Record<string, string> = {
  testnet: "https://testnet.movementnetwork.xyz/v1",
  mainnet: "https://mainnet.movementnetwork.xyz/v1",
};

async function fetchRpc(endpoint: string, network: string = "testnet"): Promise<unknown> {
  const baseUrl = NETWORKS[network] || NETWORKS.testnet;
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`RPC error ${response.status}: ${text}`);
  }

  return response.json();
}

export async function queryRpc(
  method: string,
  address: string,
  resourceType?: string,
  moduleName?: string,
  network?: string
): Promise<string> {
  const net = network || "testnet";

  try {
    switch (method) {
      case "account": {
        const data = await fetchRpc(`/accounts/${address}`, net);
        return `Account: ${address}\nNetwork: ${net}\n\n${JSON.stringify(data, null, 2)}`;
      }

      case "resource": {
        if (!resourceType) {
          // List all resources
          const data = await fetchRpc(`/accounts/${address}/resources`, net);
          const resources = data as Array<{ type: string }>;
          return `Resources for ${address} (${net}):\n\n${resources.map(r => `- ${r.type}`).join("\n")}`;
        }
        const data = await fetchRpc(`/accounts/${address}/resource/${resourceType}`, net);
        return `Resource: ${resourceType}\nAddress: ${address}\nNetwork: ${net}\n\n${JSON.stringify(data, null, 2)}`;
      }

      case "module": {
        if (!moduleName) {
          // List all modules
          const data = await fetchRpc(`/accounts/${address}/modules`, net);
          const modules = data as Array<{ abi?: { name: string } }>;
          return `Modules for ${address} (${net}):\n\n${modules.map(m => `- ${m.abi?.name || "unknown"}`).join("\n")}`;
        }
        const data = await fetchRpc(`/accounts/${address}/module/${moduleName}`, net);
        return `Module: ${moduleName}\nAddress: ${address}\nNetwork: ${net}\n\n${JSON.stringify(data, null, 2)}`;
      }

      case "events": {
        if (!resourceType) {
          return "Error: resource_type required for events query (e.g., 0x1::account::CoinRegisterEvent)";
        }
        const data = await fetchRpc(`/accounts/${address}/events/${resourceType}`, net);
        return `Events: ${resourceType}\nAddress: ${address}\nNetwork: ${net}\n\n${JSON.stringify(data, null, 2)}`;
      }

      default:
        return `Unknown method: ${method}. Use: account, resource, module, or events`;
    }
  } catch (error) {
    return `Error querying ${net}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
