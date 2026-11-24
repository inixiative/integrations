# Working in @inixiative/integrations

This package says what each integration can do and holds the code that reaches it. It decides nothing about who may use an integration: that is Kingdom's permission system. It is public and MIT, so nothing private to a product goes in it.

Read [docs/ADDING-A-PROVIDER.md](docs/ADDING-A-PROVIDER.md) before adding or changing a provider, and [docs/USING.md](docs/USING.md) for how consumers call it.

## Rules

- **One named export per file**, and the file is named after it (`fetchSlackIdentity.ts`, type `ProviderClient` in `providerClient.ts`). `src/contracts.ts` is the one contract file and `src/index.ts` the one barrel. Private helpers stay unexported in the file that uses them; a helper two files need gets its own file.
- **Every call that reaches a provider is `(client, input, options?)`.**
  - `client` is what every call to that provider needs: `{ token, send? }` (`ProviderClient`), plus whatever that provider adds (`LinearClient` adds `method`, `GithubAppClient` holds the App's signing client).
  - `input` is the request itself: `{ path, method?, query?, body?, headers? }` (`ProviderRequestInput`), or the provider's own request shape (`LinearRequestInput` is `{ query, variables }`). A higher-level call takes the domain values it needs (`{ installationId }`).
  - `options` is only what is not part of the request: pagination keys and caps. Leave it off a call that has none.
- **`send` is never a positional argument.** It lives on the client and defaults to `fetch` at call time, so a stubbed `globalThis.fetch`, a test double or a recording fetch all work with no wrapper.
- **Never walk pages by hand.** A provider declares one pagination config and its lists go through `fetchAll<Provider>Pages`. See the pagination section of the provider guide.
- **A request never leaves its provider's base URL.** Build requests with `providerRequest`, which refuses a path that resolves elsewhere, because the request carries the token.
- **Errors a consumer handles are `ProviderError`** with one of the existing codes. Do not invent a code without a consumer that maps it.
- **The catalog is closed.** `providerSchema` in `contracts.ts` lists every provider, and `operationHandlers` is exhaustive over it, so a new provider without an entry fails to compile. Operation names and resource kinds for our own apps come from `@inixiative/signet/contracts`; reference them, do not restate them.
- **No comments** except a rare one-line `// why:` where the code cannot show a constraint.
- **Flat control flow:** early returns, no nested `if`/`else`.
- **Relative imports**, no `any`, no backwards-compatibility aliases.
- **No product names in behaviour.** A label, user agent or webhook name a consumer cares about is an argument.

## Layout

```
src/
  contracts.ts            provider enum, definition and context types
  catalog/                providers.ts (the ordered list) and the helpers that read it
  operations/             running one declared operation: buildProviderRequest, executeProvider, operationHandlers
  credentials/            code exchange, renewal, minting, credential checks
  resources/              identifier, metadata and configuration schemas per provider
  providers/<provider>/
    <provider>Provider.ts       the definition the catalog lists
    <provider>Pagination.ts     strategy and key names, if it has lists
    request<Provider>.ts        one authenticated request
    fetchAll<Provider>Pages.ts  a walk over one list
    auth/                       identity, installs, authorize URLs, tokens
    events/                     signature checks, normalizers, webhook calls
    models/<model>/             one resource kind: its model object, lists, reads and operation handler
  utils/                  shared request, response, limit and error helpers
  utils/pagination/       page and cursor readers
```

Only `contracts.ts` and `index.ts` sit at the top of `src/`. A provider definition is composed from its model objects (`slackChannel`, `linearTeam`, `githubRepository`).

## Checks

```bash
bun run check:all   # typecheck, lint, tests
```

Tests stub the provider through `send`; nothing in the suite reaches the network. After changing a definition, the serialized `providers` list is the contract Kingdom renders, so say in the PR what changed in it.

## Releases

Published to npm as source (`exports` maps every file under `src/` to a subpath). Moving or renaming a file is a breaking change for consumers that import that path: Kingdom and template import by subpath.
