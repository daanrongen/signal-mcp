import { Schema } from "effect";

export class Account extends Schema.Class<Account>("Account")({
  number: Schema.String,
  uuid: Schema.optional(Schema.String),
}) {}

export class Contact extends Schema.Class<Contact>("Contact")({
  number: Schema.String,
  name: Schema.optional(Schema.String),
  uuid: Schema.optional(Schema.String),
  blocked: Schema.optional(Schema.Boolean),
}) {}

export class Group extends Schema.Class<Group>("Group")({
  id: Schema.String,
  name: Schema.String,
  isMember: Schema.optional(Schema.Boolean),
  isBlocked: Schema.optional(Schema.Boolean),
  memberCount: Schema.optional(Schema.Number),
}) {}

export class Envelope extends Schema.Class<Envelope>("Envelope")({
  source: Schema.optional(Schema.String),
  sourceNumber: Schema.optional(Schema.String),
  sourceName: Schema.optional(Schema.String),
  timestamp: Schema.Number,
  dataMessage: Schema.optional(Schema.Unknown),
}) {}

export class ReceiveResult extends Schema.Class<ReceiveResult>("ReceiveResult")({
  envelopes: Schema.Array(Envelope),
}) {}

export class UserStatus extends Schema.Class<UserStatus>("UserStatus")({
  number: Schema.String,
  isRegistered: Schema.Boolean,
}) {}

export class SendResult extends Schema.Class<SendResult>("SendResult")({
  timestamp: Schema.Number,
  results: Schema.optional(Schema.Array(Schema.Unknown)),
}) {}
