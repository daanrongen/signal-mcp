import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManagedRuntime } from "effect";
import { Effect } from "effect";
import { z } from "zod";
import type { SignalError, SignalRpcError } from "../../domain/errors.ts";
import { SignalClient } from "../../domain/SignalClient.ts";
import { formatSuccess, runTool } from "../utils.ts";

export const registerContactTools = (
  server: McpServer,
  runtime: ManagedRuntime.ManagedRuntime<SignalClient, SignalError | SignalRpcError>,
) => {
  server.tool(
    "list_accounts",
    "List all Signal accounts registered with the signal-cli daemon.",
    {},
    {
      title: "List Signal Accounts",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async () =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.listAccounts();
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "list_contacts",
    "List all contacts for a Signal account.",
    {
      account: z.string().describe("The Signal account phone number (e.g. +447356051088)"),
    },
    {
      title: "List Signal Contacts",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ account }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.listContacts(account);
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "list_groups",
    "List all Signal groups the account is a member of.",
    {
      account: z.string().describe("The Signal account phone number (e.g. +447356051088)"),
    },
    {
      title: "List Signal Groups",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ account }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.listGroups(account);
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "update_profile",
    "Update the Signal profile display name, about text, or avatar for an account. avatarPath must be an absolute path on the signal-cli server filesystem.",
    {
      account: z.string().describe("The Signal account phone number (e.g. +447356051088)"),
      givenName: z.string().optional().describe("First name to set on the profile"),
      familyName: z.string().optional().describe("Last name to set on the profile"),
      about: z.string().optional().describe("About / bio text to set on the profile"),
      avatarPath: z
        .string()
        .optional()
        .describe("Absolute path to an avatar image on the signal-cli server filesystem"),
    },
    {
      title: "Update Signal Profile",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ account, givenName, familyName, about, avatarPath }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.updateProfile({
            account,
            ...(givenName !== undefined ? { givenName } : {}),
            ...(familyName !== undefined ? { familyName } : {}),
            ...(about !== undefined ? { about } : {}),
            ...(avatarPath !== undefined ? { avatarPath } : {}),
          });
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "get_user_status",
    "Check whether one or more phone numbers are registered on Signal.",
    {
      account: z.string().describe("The Signal account phone number used to query"),
      numbers: z
        .array(z.string())
        .min(1)
        .describe('List of E.164 phone numbers to check (e.g. ["+447700000001"])'),
    },
    {
      title: "Get User Signal Status",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async ({ account, numbers }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.getUserStatus({ account, numbers });
        }),
        formatSuccess,
      ),
  );
};
