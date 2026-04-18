import { Data } from "effect";

export class SignalError extends Data.TaggedError("SignalError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export class SignalRpcError extends Data.TaggedError("SignalRpcError")<{
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}> {}
