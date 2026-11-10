import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { Declined, chat, healthify, menuFromImage, menuFromWeb } from './ai.ts';
import { cached } from './cache.ts';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY = 12 * 1024 * 1024; // room for one base64 photo

const User = z.object({
  goal: z.enum(['lose', 'maintain', 'gain']),
  diet: z.string().max(30),
  avoid: z.array(z.string().max(30)).max(10),
  targets: z.object({ calories: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() }),
  remaining: z.object({ calories: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() }),
});

const routes: Record<string, (body: unknown) => Promise<unknown>> = {
  '/api/restaurant': async (body) => {
    const { name, location } = z.object({ name: z.string().trim().min(2).max(80), location: z.string().trim().max(80).default('') }).parse(body);
    // Menus change slowly and lookups are the expensive call, so repeat requests are served from disk.
    return cached(`${name}|${location}`, () => menuFromWeb(name, location));
  },
  '/api/scan': async (body) => {
    const { imageBase64, mediaType } = z
      .object({ imageBase64: z.string().min(100), mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']) })
      .parse(body);
    return menuFromImage(imageBase64, mediaType);
  },
  '/api/healthify': async (body) => {
    const { order, user } = z.object({ order: z.string().trim().min(3).max(1000), user: User }).parse(body);
    return healthify(order, user);
  },
  '/api/chat': async (body) => {
    const { messages, user, menu } = z
      .object({
        messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(4000) })).min(1).max(40),
        user: User,
        menu: z
          .object({
            name: z.string().max(80),
            items: z
              .array(z.object({ name: z.string().max(120), category: z.string().max(40), calories: z.number(), protein: z.number(), carbs: z.number(), fat: z.number() }))
              .max(80),
          })
          .optional(),
      })
      .parse(body);
    // The conversation sent to the model must start with a user turn.
    const start = messages.findIndex((m) => m.role === 'user');
    return { reply: await chat(messages.slice(start), user, menu) };
  },
};

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'That photo is too large. Try a smaller one.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Request body must be JSON.'));
      }
    });
    req.on('error', reject);
  });
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(data));
}

/** Maps a failure to a status and a message that is safe to show in the app. */
function describe(error: unknown): [number, string] {
  if (error instanceof HttpError) return [error.status, error.message];
  if (error instanceof z.ZodError) return [400, 'The request was missing something or malformed.'];
  if (error instanceof Declined) return [422, "The assistant couldn't help with that request."];
  if (error instanceof Anthropic.AuthenticationError) return [500, 'The AI server is not configured with a valid API key.'];
  if (error instanceof Anthropic.RateLimitError) return [429, 'The AI is busy right now. Please try again in a moment.'];
  if (error instanceof Anthropic.BadRequestError) return [400, 'The AI could not process that request.'];
  if (error instanceof Anthropic.APIError) return [502, 'The AI service had a problem. Please try again.'];
  // Thrown before any request is sent, e.g. when no credentials are configured.
  if (error instanceof Anthropic.AnthropicError) return [500, 'The AI server is not configured. Set ANTHROPIC_API_KEY and restart it.'];
  return [500, 'Something went wrong on the server.'];
}

createServer(async (req, res) => {
  const path = (req.url ?? '').split('?')[0];
  if (req.method === 'OPTIONS') return send(res, 204, null);
  if (req.method === 'GET' && path === '/health') return send(res, 200, { ok: true });
  const handler = routes[path];
  if (req.method !== 'POST' || !handler) return send(res, 404, { error: 'Not found' });
  try {
    send(res, 200, await handler(await readBody(req)));
  } catch (error) {
    const [status, message] = describe(error);
    if (status >= 500) console.error(`${path} failed:`, error);
    send(res, status, { error: message });
  }
}).listen(PORT, () => console.log(`Tablewise AI server listening on http://localhost:${PORT}`));
