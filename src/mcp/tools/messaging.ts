import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ManagedRuntime } from "effect";
import { Effect } from "effect";
import { z } from "zod";
import type { SignalError, SignalRpcError } from "../../domain/errors.ts";
import { SignalClient } from "../../domain/SignalClient.ts";
import { formatSuccess, runTool } from "../utils.ts";

export const registerMessagingTools = (
  server: McpServer,
  runtime: ManagedRuntime.ManagedRuntime<SignalClient, SignalError | SignalRpcError>,
) => {
  server.tool(
    "send_message",
    "Send a Signal message to one or more recipients or to a group. Provide either `recipients` (array of E.164 numbers) or `groupId`, not both.",
    {
      account: z.string().describe("The Signal account phone number to send from"),
      message: z.string().min(1).describe("The text body of the message"),
      recipients: z.array(z.string()).optional().describe("List of E.164 recipient phone numbers"),
      groupId: z.string().optional().describe("Base64-encoded Signal group ID to send to a group"),
    },
    {
      title: "Send Signal Message",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async ({ account, message, recipients, groupId }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.sendMessage({
            account,
            message,
            ...(recipients !== undefined ? { recipients } : {}),
            ...(groupId !== undefined ? { groupId } : {}),
          });
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "receive_messages",
    "Poll signal-cli for any pending incoming messages. Returns all envelopes received since the last poll.",
    {
      account: z.string().describe("The Signal account phone number to receive messages for"),
    },
    {
      title: "Receive Signal Messages",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async ({ account }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.receiveMessages(account);
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "subscribe_messages",
    "Subscribe to the signal-cli SSE event stream and collect incoming messages for up to `timeoutMs` milliseconds (default 10s, max 30s). Returns all message envelopes received during that window. Use this for real-time message polling.",
    {
      account: z.string().describe("The Signal account phone number to subscribe for"),
      timeoutMs: z
        .number()
        .int()
        .min(1000)
        .max(30000)
        .optional()
        .describe("How long to listen for messages in milliseconds (default: 10000, max: 30000)"),
    },
    {
      title: "Subscribe to Signal Messages",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    async ({ account, timeoutMs }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          return yield* client.subscribeMessages({
            account,
            ...(timeoutMs !== undefined ? { timeoutMs } : {}),
          });
        }),
        formatSuccess,
      ),
  );

  server.tool(
    "send_reaction",
    "React to a specific Signal message with an emoji. Use `remove: true` to remove a previously sent reaction.",
    {
      account: z.string().describe("The Signal account phone number to react from"),
      recipient: z
        .string()
        .describe("E.164 phone number of the conversation recipient (or group ID)"),
      emoji: z.string().describe('The emoji character to react with (e.g. "👍")'),
      targetAuthor: z
        .string()
        .describe("E.164 phone number of the author of the message being reacted to"),
      targetTimestamp: z
        .number()
        .int()
        .describe("Unix millisecond timestamp of the message being reacted to"),
      remove: z
        .boolean()
        .optional()
        .describe("Set to true to remove a previously sent reaction (default: false)"),
    },
    {
      title: "Send Signal Reaction",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ account, recipient, emoji, targetAuthor, targetTimestamp, remove }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          yield* client.sendReaction({
            account,
            recipient,
            emoji,
            targetAuthor,
            targetTimestamp,
            ...(remove !== undefined ? { remove } : {}),
          });
        }),
        () => formatSuccess({ ok: true }),
      ),
  );

  server.tool(
    "send_typing",
    "Send a typing indicator to a Signal recipient. Typing indicators are ephemeral and expire automatically.",
    {
      account: z.string().describe("The Signal account phone number sending the typing indicator"),
      recipient: z.string().describe("E.164 phone number of the recipient"),
      stop: z
        .boolean()
        .optional()
        .describe("Set to true to send a stop-typing indicator (default: false = start typing)"),
    },
    {
      title: "Send Typing Indicator",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ account, recipient, stop }) =>
      runTool(
        runtime,
        Effect.gen(function* () {
          const client = yield* SignalClient;
          yield* client.sendTyping({
            account,
            recipient,
            ...(stop !== undefined ? { stop } : {}),
          });
        }),
        () => formatSuccess({ ok: true }),
      ),
  );
};
