import { Effect, Layer, Ref } from "effect";
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

export const MOCK_ACCOUNT = "+447356051088";

export const SignalClientTest = Layer.effect(
  SignalClient,
  Effect.gen(function* () {
    const sentMessagesRef = yield* Ref.make<SendResult[]>([]);

    return SignalClient.of({
      listAccounts: () =>
        Effect.succeed([new Account({ number: MOCK_ACCOUNT, uuid: "test-uuid-1234" })]),

      listContacts: (_account) =>
        Effect.succeed([
          new Contact({ number: "+441234567890", name: "Alice", uuid: "contact-uuid-1" }),
          new Contact({ number: "+449876543210", name: "Bob", blocked: false }),
        ]),

      listGroups: (_account) =>
        Effect.succeed([
          new Group({ id: "group-id-1", name: "Test Group", isMember: true, memberCount: 3 }),
        ]),

      sendMessage: ({ message: _message, recipients: _recipients, groupId: _groupId }) =>
        Effect.gen(function* () {
          const result = new SendResult({ timestamp: Date.now() });
          yield* Ref.update(sentMessagesRef, (prev) => [...prev, result]);
          return result;
        }),

      receiveMessages: (_account) =>
        Effect.succeed(
          new ReceiveResult({
            envelopes: [
              new Envelope({
                source: MOCK_ACCOUNT,
                sourceNumber: MOCK_ACCOUNT,
                sourceName: "Test User",
                timestamp: 1700000000000,
              }),
            ],
          }),
        ),

      getUserStatus: ({ numbers }) =>
        Effect.succeed(numbers.map((number) => new UserStatus({ number, isRegistered: true }))),

      sendReaction: (_params) => Effect.void,

      sendTyping: (_params) => Effect.void,

      subscribeMessages: (_params) => Effect.succeed(new ReceiveResult({ envelopes: [] })),
    });
  }),
);
