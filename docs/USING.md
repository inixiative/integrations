# Using @inixiative/integrations

```bash
bun add @inixiative/integrations zod
```

The package ships TypeScript source. Every file under `src/` holds one export and is importable by its path: `@inixiative/integrations/<path under src, without .ts>`. The root import gives the catalog list, the contract types and `ProviderError`.

## Read the catalog

```ts
import { providers } from '@inixiative/integrations/catalog/providers';
import { findProvider } from '@inixiative/integrations/catalog/findProvider';
import { operationLeaves } from '@inixiative/integrations/catalog/operationLeaves';
import { eventLeaves } from '@inixiative/integrations/catalog/eventLeaves';

findProvider('slack')?.operations;                 // every operation and event Slack declares
operationLeaves('githubOrganization', 'repository'); // keys that act on a repository
eventLeaves('linear', 'team');                       // only the event keys
```

A `ProviderDefinition` carries `key`, `name`, `documentationUrl`, `authMethods` and `operations`. Each operation has a `key`, a `name`, the `resourceKind` it acts on and its `requiredScopes`. A key starting `events.` is an event (`isEventLeaf`).

## Integration families and auth methods

An integration family (`google`, `github`, `atlassian`, `inixiative`) is one consent shared by several products. Families are their own catalog entries (`integrationFamilies`, `findIntegrationFamily`), never providers, and carry their own `authMethods` and OAuth endpoints. A product names its family in `integrationFamily`; `integrationFamilyProducts('google')` lists Gmail and Drive.

`authMethods` lists the ways something can authenticate. On a product it may include `integrationFamily`, meaning "through the family's auth", beside methods of its own: `githubUser` is `['integrationFamily', 'bearer']`. A stored credential's method is always a real one, so `authMethods` is a superset of `CredentialMethod`.

```ts
import { acceptedCredentialMethods } from '@inixiative/integrations/catalog/acceptedCredentialMethods';

acceptedCredentialMethods('drive');      // ['oauth2'], from the google family
acceptedCredentialMethods('githubUser'); // ['bearer', 'oauth2']
```

Check a credential against `acceptedCredentialMethods`, not `authMethods`. A credential entered on a product belongs to that integration; one obtained through the family belongs to the family, and any product listing `integrationFamily` may use it.

## Check a resource before storing it

```ts
import { resourceExternalIdSchemas } from '@inixiative/integrations/resources/resourceExternalIdSchemas';
import { resourceMetadataSchemas } from '@inixiative/integrations/resources/resourceMetadataSchemas';

resourceExternalIdSchemas.githubOrganization.parse('123456');
resourceMetadataSchemas.teams.parse({ teamId });
```

## Call a provider

Every call takes the client first, then the request or the values it needs, then options.

```ts
import { fetchGithubUser } from '@inixiative/integrations/providers/github/auth/fetchGithubUser';
import { listSlackChannels } from '@inixiative/integrations/providers/slack/models/channel/listSlackChannels';
import { fetchAllGithubPages } from '@inixiative/integrations/providers/github/fetchAllGithubPages';

await fetchGithubUser({ token });
await listSlackChannels({ token });                       // { channels, truncated }
await fetchAllGithubPages(
  { token },
  { path: '/notifications', query: { since, per_page: 50 } },
  { maxPages: 10, onCapped: () => {} },
);
```

- **Client:** `{ token, send? }`. `send` is any `fetch`-shaped function and defaults to `fetch`.
- **Input:** `{ path, method?, query?, body?, headers? }` for a raw request. `path` must stay under the provider's base URL.
- **Options:** `keys` (replace any of the provider's pagination key names, usually `data`), `maxPages`, `maxRows`, `onCapped`, `onResponse`.

### Testing and recording

Pass your own `send`:

```ts
await listSlackChannels({ token: 'test', send: async () => Response.json({ ok: true, channels: [] }) });
```

A recording fetch such as `@inixiative/vcr`'s `createVcrFetch` fits `send` as it is.

## Run a declared operation

`executeProvider` runs one catalog operation against one resource: it checks the operation against the catalog, builds the request, sends it and returns the provider's answer in the package's shape.

```ts
import { executeProvider } from '@inixiative/integrations/operations/executeProvider';

await executeProvider({ send }, {
  provider: 'slack',
  operation: 'messages.read',
  resource: { kind: 'channel', externalId: 'C123', metadata: {} },
  configuration: {},
  input: {},
  limit: 15,
  method: 'bearer',
  secret: { token },
});
```

## Credentials

```ts
import { exchangeOauthCode } from '@inixiative/integrations/credentials/exchangeOauthCode';
import { refreshProviderCredential } from '@inixiative/integrations/credentials/refreshProviderCredential';

await exchangeOauthCode({ app }, { integrationFamily: 'google', code, codeVerifier, redirectUri });
await refreshProviderCredential({ app }, { provider: 'githubOrganization', secret });
```

`app` is your OAuth client (`{ clientId, clientSecret }`), or for a GitHub App the signing client (`appId` and `privateKey` as well).

## Webhooks

Each provider with events has a signature check and a normalizer under `providers/<provider>/events/`: `verifyGithubSignature`, `verifySlackSignature`, `verifyLinearSignature`, and `normalizeGithubEvent`, `normalizeSlackEvent`, `normalizeLinearEvent`. Verify over the raw request bytes, then normalize.

## Pagination readers on their own

```ts
import { fetchAllByPage } from '@inixiative/integrations/utils/pagination/fetchAllByPage';
import { fetchAllByCursor } from '@inixiative/integrations/utils/pagination/fetchAllByCursor';

await fetchAllByPage({
  keys: { page: 'page', pageSize: 'pageSize', data: 'data', totalPages: 'pagination.totalPages' },
  pageSize: 100,
  fetchPage: (request) => api.list(request),
});
await fetchAllByCursor({
  keys: { cursor: 'cursor', pageSize: 'limit', data: 'data', nextCursor: 'pagination.nextCursor' },
  fetchPage: (request) => api.list(request),
});
```

`keys` maps the reader's names to yours: request parameter names (`page`, `cursor`, `pageSize`) and dotted paths into the response (`data`, `total`, `totalPages`, `nextCursor`, `hasMore`). An empty `data` path means the response is the list. `iterateByPage` and `iterateByCursor` yield a page at a time for a search that can stop early.

## Errors

A failure the caller should handle is a `ProviderError` (`@inixiative/integrations/utils/providerError`) whose message is a code: `provider_authentication_expired`, `provider_access_denied`, `provider_rate_limited`, `provider_invalid_response`, `provider_unreachable`, `unsupported_operation`, and the renewal codes `renewal_rejected`, `renewal_temporarily_unavailable`, `renewal_outcome_unknown`, `renewal_unsupported`.
