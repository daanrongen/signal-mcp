# signal-mcp

MCP server for [Signal](https://signal.org/) via signal-cli — send messages, receive messages, manage contacts and groups, react, and more over stdio.

## Installation

```bash
bunx @daanrongen/signal-mcp
```

## Tools (10 total)

| Domain        | Tools                                                                                                     | Coverage                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Contacts**  | `list_accounts`, `list_contacts`, `list_groups`, `get_user_status`                                        | Account listing, contact and group management, registration checks    |
| **Messaging** | `send_message`, `send_attachment`, `receive_messages`, `subscribe_messages`, `send_reaction`, `send_typing`, `mark_as_read` | Send text and files, poll or subscribe for incoming messages, reactions, typing indicators, read receipts |

## Configuration

| Variable     | Required | Description                                                     |
| ------------ | -------- | --------------------------------------------------------------- |
| `SIGNAL_URL` | Yes      | signal-cli base URL (e.g. `http://raspberrypi:30880`)           |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "signal": {
      "command": "bunx",
      "args": ["@daanrongen/signal-mcp"],
      "env": {
        "SIGNAL_URL": "http://raspberrypi:30880"
      }
    }
  }
}
```

### Claude Code CLI

```bash
claude mcp add signal -e SIGNAL_URL=http://raspberrypi:30880 -- bunx @daanrongen/signal-mcp
```

## Development

```bash
bun install
bun run dev        # watch mode
bun test           # run tests
bun run typecheck  # tsc type check
bun run lint       # biome check
bun run build      # bundle to dist/main.js
```

## Architecture

```
src/
  config.ts              # SIGNAL_URL env var config
  errors.ts              # SignalError, SignalRpcError tagged errors
  main.ts                # stdio entry point, ManagedRuntime setup
  domain/
    SignalClient.ts       # port interface (Context.Tag)
    models.ts             # Schema.Class domain models
    signal.test.ts        # unit tests against test adapter
  infra/
    SignalClientLive.ts   # HTTP JSON-RPC adapter (signal-cli)
    SignalClientTest.ts   # in-memory test adapter
  mcp/
    server.ts             # McpServer factory, tool registration
    utils.ts              # runTool, formatSuccess helpers
    tools/
      contacts.ts         # list_accounts, list_contacts, list_groups, get_user_status
      messaging.ts        # send_message, send_attachment, receive_messages, subscribe_messages, send_reaction, send_typing, mark_as_read
```

Hexagonal architecture: domain port (`SignalClient`) is injected via Effect `Layer`. The live adapter calls the signal-cli JSON-RPC HTTP API; the test adapter returns predictable in-memory values.

## License

MIT
