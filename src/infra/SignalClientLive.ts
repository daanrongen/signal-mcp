import { Effect, Layer } from "effect";
import { SignalAccountConfig, SignalCliConfig } from "../config.ts";
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
    yield* Effect.orDie(SignalAccountConfig);

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

      sendMessage: ({ account, message, recipients, groupId }) =>
        rpcCall<SendResult>("send", {
          account,
          message,
          ...(recipients ? { recipient: recipients } : {}),
          ...(groupId ? { groupId } : {}),
        }).pipe(Effect.map((r) => new SendResult(r))),

      receiveMessages: (account) =>
        rpcCall<{ envelopes?: unknown[] }>("receive", { account }).pipe(
          Effect.map((r) => {
            const envelopes = (r?.envelopes ?? []).map(
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

      subscribeMessages: ({ account: _account, timeoutMs = 10000 }) =>
        Effect.tryPromise({
          try: async () => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 30000));
            const envelopes: Envelope[] = [];

            try {
              const response = await fetch(`${baseHost}/api/v1/events`, {
                headers: { Accept: "text/event-stream" },
                signal: controller.signal,
              });

              const reader = response.body?.getReader();
              if (!reader) return new ReceiveResult({ envelopes });
              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  try {
                    const json = JSON.parse(line.slice(6)) as {
                      method?: string;
                      params?: { envelope?: unknown; account?: string };
                    };
                    if (json.method === "receive" && json.params?.envelope) {
                      envelopes.push(
                        new Envelope(
                          json.params.envelope as ConstructorParameters<typeof Envelope>[0],
                        ),
                      );
                    }
                  } catch {
                    // skip malformed SSE line
                  }
                }
              }
            } catch (e) {
              if (e instanceof Error && e.name === "AbortError") {
                // timeout — return what we have
                return new ReceiveResult({ envelopes });
              }
              throw e;
            } finally {
              clearTimeout(timer);
            }

            return new ReceiveResult({ envelopes });
          },
          catch: (e) => {
            if (e instanceof SignalError) return e;
            return new SignalError({ message: "SSE stream failed", cause: e });
          },
        }),
    });
  }),
);
