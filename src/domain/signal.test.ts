import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { MOCK_ACCOUNT, SignalClientTest } from "../infra/SignalClientTest.ts";
import { SignalClient } from "./SignalClient.ts";

describe("listAccounts", () => {
  it("returns an array with the mock account", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.listAccounts();
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].number).toBe(MOCK_ACCOUNT);
  });
});

describe("listContacts", () => {
  it("returns contacts for the given account", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.listContacts(MOCK_ACCOUNT);
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].number).toBeTruthy();
  });
});

describe("listGroups", () => {
  it("returns groups for the given account", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.listGroups(MOCK_ACCOUNT);
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBeTruthy();
    expect(result[0].name).toBeTruthy();
  });
});

describe("sendMessage", () => {
  it("returns a SendResult with a timestamp", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.sendMessage({
          account: MOCK_ACCOUNT,
          message: "Hello, world!",
          recipients: ["+441234567890"],
        });
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(typeof result.timestamp).toBe("number");
    expect(result.timestamp).toBeGreaterThan(0);
  });
});

describe("receiveMessages", () => {
  it("returns a ReceiveResult with envelopes", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.receiveMessages(MOCK_ACCOUNT);
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result.envelopes.length).toBeGreaterThan(0);
    expect(result.envelopes[0].timestamp).toBeGreaterThan(0);
  });
});

describe("getUserStatus", () => {
  it("returns registration status for each number", async () => {
    const numbers = ["+441234567890", "+449876543210"];
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.getUserStatus({ account: MOCK_ACCOUNT, numbers });
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result.length).toBe(2);
    expect(result[0].isRegistered).toBe(true);
    expect(result[0].number).toBe(numbers[0]);
  });
});

describe("sendReaction", () => {
  it("completes without error", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.sendReaction({
          account: MOCK_ACCOUNT,
          recipient: "+441234567890",
          emoji: "👍",
          targetAuthor: "+441234567890",
          targetTimestamp: 1700000000000,
        });
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result).toBeUndefined();
  });
});

describe("sendTyping", () => {
  it("completes without error", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.sendTyping({
          account: MOCK_ACCOUNT,
          recipient: "+441234567890",
        });
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(result).toBeUndefined();
  });
});

describe("subscribeMessages", () => {
  it("returns a ReceiveResult", async () => {
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* SignalClient;
        return yield* client.subscribeMessages({ account: MOCK_ACCOUNT });
      }).pipe(Effect.provide(SignalClientTest)),
    );
    expect(Array.isArray(result.envelopes)).toBe(true);
  });
});
