import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CONTACT_LIMITS } from '../src/lib/contact.js';
import { handleContact, readConfig } from '../src/lib/contact-endpoint.js';

/**
 * The only file in this directory, and deliberately so: Vercel deploys every
 * file under /api as its own serverless function, so anything else living here
 * gets built and shipped too. The decision itself is in src/lib.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('cache-control', 'no-store');

  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    response.status(405).send('Method not allowed');
    return;
  }

  const length = Number(request.headers['content-length'] ?? '0');
  if (length > CONTACT_LIMITS.body) {
    response.status(413).json({ error: 'error.tooLong' });
    return;
  }

  const forwarded = request.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim() ?? null;

  const reply = await handleContact(readConfig(process.env), request.body, ip);
  response.status(reply.status).json(reply.body);
}
