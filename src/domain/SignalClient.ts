import { Context, type Effect } from "effect";
import type { SignalError, SignalRpcError } from "./errors.ts";
import type { Account, Contact, Group, ReceiveResult, SendResult, UserStatus } from "./models.ts";

export interface SignalClientService {
  readonly listAccounts: () => Effect.Effect<Account[], SignalError | SignalRpcError>;
  readonly listContacts: (
    account: string,
  ) => Effect.Effect<Contact[], SignalError | SignalRpcError>;
  readonly listGroups: (account: string) => Effect.Effect<Group[], SignalError | SignalRpcError>;
  readonly sendMessage: (params: {
    account: string;
    message: string;
    recipients?: string[];
    groupId?: string;
  }) => Effect.Effect<SendResult, SignalError | SignalRpcError>;
  readonly receiveMessages: (
    account: string,
  ) => Effect.Effect<ReceiveResult, SignalError | SignalRpcError>;
  readonly getUserStatus: (params: {
    account: string;
    numbers: string[];
  }) => Effect.Effect<UserStatus[], SignalError | SignalRpcError>;
  readonly sendReaction: (params: {
    account: string;
    recipient: string;
    emoji: string;
    targetAuthor: string;
    targetTimestamp: number;
    remove?: boolean;
  }) => Effect.Effect<void, SignalError | SignalRpcError>;
  readonly sendTyping: (params: {
    account: string;
    recipient: string;
    stop?: boolean;
  }) => Effect.Effect<void, SignalError | SignalRpcError>;
  readonly subscribeMessages: (params: {
    account: string;
    timeoutMs?: number;
  }) => Effect.Effect<ReceiveResult, SignalError | SignalRpcError>;
}

export class SignalClient extends Context.Tag("SignalClient")<
  SignalClient,
  SignalClientService
>() {}
