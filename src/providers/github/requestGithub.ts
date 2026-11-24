import type { ProviderClient } from '../../utils/providerClient';
import { providerRequest } from '../../utils/providerRequest';
import type { ProviderRequestInput } from '../../utils/providerRequestInput';
import { requestProviderJson } from '../../utils/requestProviderJson';
import { githubRequestHeaders } from './githubRequestHeaders';

export const requestGithub = async (
  { token, send = fetch }: ProviderClient,
  input: ProviderRequestInput,
) =>
  await requestProviderJson(
    send,
    providerRequest(
      'https://api.github.com',
      input,
      githubRequestHeaders(new Headers(input.headers), token),
    ),
  );
