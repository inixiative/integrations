import { ProviderError } from './providerError';

export const providerResponseLimit = 1024 * 1024;

export type ResponseBudget = { remainingBytes: number };

export const readProviderJson = async (
  response: Response,
  budget: ResponseBudget,
): Promise<unknown> => {
  if (!response.body) throw new ProviderError('provider_empty_response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      budget.remainingBytes -= value.byteLength;
      if (budget.remainingBytes < 0) {
        await reader.cancel();
        throw new ProviderError('provider_response_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ProviderError('provider_invalid_response');
  }
};
