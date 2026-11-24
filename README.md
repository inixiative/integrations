# @inixiative/integrations

The provider catalog behind Kingdom integrations. For each provider it declares the operations and events it offers, the resource kind each one acts on, and the scopes it needs. Beside the catalog sits the code that reaches each provider: request builders, webhook signature checks, event normalizers and credential renewal.

Kingdom is the permissions hub that decides who may use an integration. This package only says what an integration can do.

## Install

```bash
bun add @inixiative/integrations zod
```

## Use

```ts
import { findProvider, operationLeaves } from '@inixiative/integrations/catalog';

findProvider('slack')?.operations;
operationLeaves('githubOrganization', 'repository');
```

Every file under `src/` is importable by its path, for example `@inixiative/integrations/github/verifyGithubSignature`.

## License

MIT
