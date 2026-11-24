# Adding or changing a provider

Start from the provider's own API documentation, and write down its models first: which resources it has, what can be read on each, which events it emits for each, and the scopes each one needs. The folder layout follows that list.

## 1. Declare it

1. Add the key to `providerSchema` in `src/contracts.ts`. The compiler now points at every exhaustive record that needs an entry.
2. Add `src/providers/<provider>/<provider>Provider.ts` exporting a `ProviderDefinition`, and list it in `src/catalog/providers.ts`. The catalog's order is the order consumers render.
3. Add an entry to `operationHandlers` (`src/operations/operationHandlers.ts`): a handler, or `null` when nothing reaches the provider through the generic operation path.

An operation is `{ key, name, resourceKind, requiredScopes }`. Events are operations whose key starts `events.`. For several operations on one kind with the same scopes, use `declaredOperations(names, resourceKind, requiredScopes)`.

For our own apps (Archive, Foundry, Chorus), operation names and kinds come from `@inixiative/signet/contracts`.

## 2. Give each model a folder

`src/providers/<provider>/models/<model>/` holds one resource kind. When a provider has more than one kind, or several definitions share a kind (GitHub's organization and user providers both act on repositories), describe the model once as a `ProviderModel` and compose definitions from it:

```ts
export const githubRepository = {
  kind: repositoryResourceKind,
  externalIdSchema: githubRepositoryIdSchema,
  metadataSchema: githubRepositoryMetadataSchema,
  operations: declaredOperations(githubOperationNames, repositoryResourceKind, ['contents:read']),
  events: [...],
  externalIdOfEvent: githubEventRepositoryId,
} satisfies ProviderModel;
```

```ts
operations: [...githubRepository.operations, ...githubRepository.events],
```

If the kind's identifier or metadata has its own shape, register it in `resourceExternalIdSchemas` and `resourceMetadataSchemas`.

## 3. One request function

`request<Provider>.ts` is the only place that knows the base URL, the auth header and how the provider reports an error:

```ts
export const requestSlack = async ({ token, send = fetch }: ProviderClient, input: ProviderRequestInput) => {
  const headers = new Headers(input.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const body = slackResultSchema.parse(
    await requestProviderJson(send, providerRequest('https://slack.com/api/', input, headers)),
  );
  if (!body.ok) throw slackProviderError(body.error);
  return body;
};
```

`providerRequest` builds the `Request` (15 s timeout, no redirects, JSON body, and a refusal of any path outside the base). `requestProviderJson` sends it, maps transport and status failures to `ProviderError`, and reads at most 1 MiB.

Everything else in the provider calls this function. A provider whose request is not path-and-query declares its own input type (`LinearRequestInput`).

## 4. Pagination

Declare the provider's pagination once:

```ts
export const githubPagination = {
  strategy: 'page',
  keys: { page: 'page', pageSize: 'per_page', data: '', total: 'total_count' },
  pageSize: 100,
} satisfies ProviderPagination;
```

- `strategy` is `page` or `cursor`.
- `keys` maps the reader's names to the provider's: request parameter names, and dotted paths into the response. `data: ''` means the response is the list.
- `pageSize` is the default sent when a call names none.

Then one thin walker:

```ts
export const fetchAllGithubPages = (client: ProviderClient, input: ProviderRequestInput, options?: ProviderPagesOptions) =>
  fetchAllRequestPages(githubPagination, (page) => requestGithub(client, page), input, options);
```

A list call passes the request as input, a different page size in the query, and anything else in options:

```ts
await fetchAllSlackPages(
  client,
  { path: 'users.conversations', query: { types: 'public_channel,private_channel' } },
  { keys: { data: 'channels' }, maxPages: 20, onCapped: () => { truncated = true; } },
);
```

Decide what a capped walk means for each list and keep it: return a `truncated` flag, or throw from `onCapped`. A list with no array where the keys say, or a cursor that repeats, answers `provider_invalid_response`.

How a walk ends:
- **page:** on `totalPages` when the key is set; otherwise when rows read reach `total`; otherwise on a page shorter than the page size.
- **cursor:** when the next cursor is empty, or when `hasMore` is set and false.

Validate the items after the walk with a Zod array schema.

## 5. Auth and events

- `auth/`: the caller's identity (`fetch<Provider>Identity`), authorize or install URLs, and anything that mints a token.
- `events/`: `verify<Provider>Signature` over the raw bytes in constant time (`matchesHmacSha256`), `normalize<Provider>Event` returning a `ProviderEvent`, and calls that manage the provider's webhooks.

If a credential renews, add its case to `refreshProviderCredential` or `mintProviderCredential`.

## 6. Tests

One test file per concern under `tests/`, driving the real functions with a `send` double. Assert the request (URL, query, headers, body) and the mapped result, and cover: the provider's error shape, a multi-page list, a capped list, and a response missing its list.

## Checklist

- [ ] Key in `providerSchema`, definition listed in `catalog/providers.ts`, entry in `operationHandlers`
- [ ] One `request<Provider>` and, if it lists anything, one pagination config and walker
- [ ] Every call is `(client, input, options?)`; no positional `send`
- [ ] One export per file, no comments, no product names
- [ ] Tests stub `send`; `bun run check:all` passes
- [ ] The PR says what changed in the serialized catalog
