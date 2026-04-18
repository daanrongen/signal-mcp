import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManagedRuntime } from "effect";
import type { SignalError, SignalRpcError } from "../domain/errors.ts";
import type { SignalClient } from "../domain/SignalClient.ts";
import { registerContactTools } from "./tools/contacts.ts";
import { registerMessagingTools } from "./tools/messaging.ts";

export const createMcpServer = (
  runtime: ManagedRuntime.ManagedRuntime<SignalClient, SignalError | SignalRpcError>,
): McpServer => {
  const server = new McpServer({
    name: "signal-mcp-server",
    version: "1.0.0",
  });

  registerContactTools(server, runtime);
  registerMessagingTools(server, runtime);

  return server;
};
