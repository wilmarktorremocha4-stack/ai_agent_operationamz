import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

export async function getOrCreateDifyUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get('amz_navigator_uid')?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set('amz_navigator_uid', id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  });
  return id;
}
