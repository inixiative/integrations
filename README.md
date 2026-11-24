# @inixiative/integrations

The provider catalog behind Kingdom integrations. For each provider it declares the operations and events it offers, the resource kind each one acts on, and the scopes it needs. Beside the catalog sits the code that reaches each provider: requests, webhook signature checks, event normalizers and credential renewal.

Kingdom is the permissions hub that decides who may use an integration. This package only says what an integration can do.

## Install

```bash
bun add @inixiative/integrations zod
```

## Use

Every file under `src/` holds one export and is importable by its path.

```ts
import { findProvider } from '@inixiative/integrations/catalog/findProvider';
import { operationLeaves } from '@inixiative/integrations/catalog/operationLeaves';

findProvider('slack')?.operations;
operationLeaves('githubOrganization', 'repository');
```

## Shape

Each provider has a folder under `src/providers/`, with `auth/`, `events/` and `models/<model>/` inside it where it has that code, and a `<provider>Provider.ts` definition that `src/catalog/providers.ts` lists.

A call that reaches a provider takes the client first, then the request, then anything that is not part of the request:

```ts
import { fetchAllGithubPages } from '@inixiative/integrations/providers/github/fetchAllGithubPages';

await fetchAllGithubPages(
  { token, send },
  { path: '/notifications', query: { since, per_page: 50 } },
  { maxPages: 10 },
);
```

- **Client:** `{ token, send? }`. `send` is any `fetch`, so a recording or stubbed fetch drops in.
- **Input:** `{ path, method?, query?, body?, headers? }`.
- **Options:** pagination keys and caps.

## Pagination

`src/utils/pagination/` reads page-numbered and cursor lists. A provider declares its strategy, its parameter names and where its responses keep the list (`githubPagination`, `slackPagination`, `linearPagination`); a call may replace any key in its options.

## License

MIT
