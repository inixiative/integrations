import { z } from 'zod';
import type { ProviderContext } from '../../contracts';
import { providerResponseLimit } from '../../utils/providerResponseLimit';
import type { ProviderSend } from '../../utils/providerSend';
import { readProviderJson } from '../../utils/readProviderJson';
import { sendProviderRequest } from '../../utils/sendProviderRequest';
import { buildGmailMessageRequest } from './buildGmailMessageRequest';

const gmailConcurrency = 10;
const listSchema = z.object({
  messages: z.array(z.object({ id: z.string() })).default([]),
  nextPageToken: z.string().optional(),
});
const messageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  snippet: z.string().default(''),
  payload: z
    .object({ headers: z.array(z.object({ name: z.string(), value: z.string() })).default([]) })
    .default({ headers: [] }),
});

const projectMessage = (value: unknown) => {
  const message = messageSchema.parse(value);
  const header = (name: string) =>
    message.payload.headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value ??
    null;
  return {
    id: message.id,
    threadId: message.threadId,
    from: header('From'),
    to: header('To'),
    subject: header('Subject'),
    date: header('Date'),
    snippet: message.snippet,
  };
};

export const fetchGmailMessages = async (
  { send }: { send: ProviderSend },
  { listRequest, context }: { listRequest: Request; context: ProviderContext },
) => {
  const budget = { remainingBytes: providerResponseLimit };
  const list = listSchema.parse(
    await readProviderJson(await sendProviderRequest(send, listRequest), budget),
  );
  const ids = list.messages.slice(0, context.limit).map((item) => item.id);
  const batch = new AbortController();
  const signal = AbortSignal.any([listRequest.signal, batch.signal]);
  const fetchGmailMessage = async (id: string) => {
    let deleted = false;
    const response = await sendProviderRequest(
      async (request) => {
        const result = await send(request);
        if (result.status !== 404) return result;
        deleted = true;
        await result.body?.cancel();
        return Response.json(null);
      },
      buildGmailMessageRequest(listRequest, id, signal),
    );
    if (deleted) {
      await response.body?.cancel();
      return [];
    }
    return [projectMessage(await readProviderJson(response, budget))];
  };
  const messages: ReturnType<typeof projectMessage>[] = [];
  for (let start = 0; start < ids.length; start += gmailConcurrency)
    messages.push(
      ...(
        await Promise.all(ids.slice(start, start + gmailConcurrency).map(fetchGmailMessage)).catch(
          (error: unknown) => {
            batch.abort();
            throw error;
          },
        )
      ).flat(),
    );
  return { messages, hasMore: Boolean(list.nextPageToken) || list.messages.length > ids.length };
};
