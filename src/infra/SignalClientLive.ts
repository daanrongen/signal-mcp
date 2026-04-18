import { Effect, Layer } from "effect";
import { SignalCliConfig } from "../config.ts";
import { SignalError, SignalRpcError } from "../domain/errors.ts";
import {
  Account,
  Contact,
  Envelope,
  Group,
  ReceiveResult,
  SendResult,
  UserStatus,
} from "../domain/models.ts";
import { SignalClient } from "../domain/SignalClient.ts";

export const SignalClientLive = Layer.effect(
  SignalClient,
  Effect.gen(function* () {
    const baseHost = yield* Effect.orDie(SignalCliConfig);
    const url = `${baseHost}/api/v1/rpc`;

    const rpcCall = <T>(
      method: string,
      params: Record<string, unknown>,
    ): Effect.Effect<T, SignalError | SignalRpcError> =>
      Effect.tryPromise({
        try: async () => {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method,
              params,
              id: crypto.randomUUID(),
            }),
          });

          if (!response.ok) {
            throw new SignalError({
              message: `HTTP ${response.status}: ${response.statusText}`,
            });
          }

          const json = (await response.json()) as {
            result?: T;
            error?: { code: number; message: string; data?: unknown };
          };

          if (json.error) {
            throw new SignalRpcError({
              code: json.error.code,
              message: json.error.message,
              data: json.error.data,
            });
          }

          return json.result as T;
        },
        catch: (e) => {
          if (e instanceof SignalError || e instanceof SignalRpcError) return e;
          return new SignalError({ message: "RPC call failed", cause: e });
        },
      });

    return SignalClient.of({
      listAccounts: () =>
        rpcCall<Account[]>("listAccounts", {}).pipe(
          Effect.map((items) => (items ?? []).map((i) => new Account(i))),
        ),

      listContacts: (account) =>
        rpcCall<Contact[]>("listContacts", { account }).pipe(
          Effect.map((items) => (items ?? []).map((i) => new Contact(i))),
        ),

      listGroups: (account) =>
        rpcCall<Group[]>("listGroups", { account }).pipe(
          Effect.map((items) => (items ?? []).map((i) => new Group(i))),
        ),

      sendMessage: ({
        account,
        message,
        recipients,
        groupId,
        quoteTimestamp,
        quoteAuthor,
        quoteMessage,
      }) =>
        rpcCall<SendResult>("send", {
          account,
          message,
          ...(recipients ? { recipient: recipients } : {}),
          ...(groupId ? { groupId } : {}),
          ...(quoteTimestamp !== undefined ? { quoteTimestamp } : {}),
          ...(quoteAuthor !== undefined ? { quoteAuthor } : {}),
          ...(quoteMessage !== undefined ? { quoteMessage } : {}),
        }).pipe(Effect.map((r) => new SendResult(r))),

      receiveMessages: (account) =>
        rpcCall<unknown[]>("receive", { account }).pipe(
          Effect.map((items) => {
            const envelopes = (items ?? []).map(
              (e) => new Envelope(e as ConstructorParameters<typeof Envelope>[0]),
            );
            return new ReceiveResult({ envelopes });
          }),
        ),

      getUserStatus: ({ account, numbers }) =>
        rpcCall<UserStatus[]>("getUserStatus", { account, recipient: numbers }).pipe(
          Effect.map((items) => (items ?? []).map((i) => new UserStatus(i))),
        ),

      sendReaction: ({ account, recipient, emoji, targetAuthor, targetTimestamp, remove }) =>
        rpcCall<void>("sendReaction", {
          account,
          recipient,
          emoji,
          targetAuthor,
          targetTimestamp,
          ...(remove !== undefined ? { remove } : {}),
        }).pipe(Effect.asVoid),

      sendTyping: ({ account, recipient, stop }) =>
        rpcCall<void>("sendTyping", {
          account,
          recipient,
          ...(stop !== undefined ? { stop } : {}),
        }).pipe(Effect.asVoid),

      markAsRead: ({ account, recipient, targetTimestamps }) =>
        rpcCall<void>("sendReceipt", {
          account,
          recipient,
          targetTimestamps,
          type: "read",
        }).pipe(Effect.asVoid),

      subscribeMessages: ({ account, timeoutMs = 10000 }) =>
        Effect.gen(function* () {
          const limit = Math.min(timeoutMs, 30000);
          const deadline = Date.now() + limit;
          const all: Envelope[] = [];

          while (Date.now() < deadline) {
            const batch = yield* rpcCall<unknown[]>("receive", { account }).pipe(
              Effect.map((items) =>
                (items ?? []).map(
                  (e) => new Envelope(e as ConstructorParameters<typeof Envelope>[0]),
                ),
              ),
            );
            all.push(...batch);
            if (all.length > 0) break;
            yield* Effect.sleep(500);
          }

          return new ReceiveResult({ envelopes: all });
        }),
    });
  }),
);
