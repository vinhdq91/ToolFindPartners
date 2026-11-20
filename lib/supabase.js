// Supabase connection. Used only in server code (pages and server actions),
// so the secret key never reaches the browser.
import { createClient } from '@supabase/supabase-js';

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// A stable ID for partners added by hand, so the same partner is not added twice
export function manualId({ website, facebook_url, name }) {
  const key = (website || facebook_url || name)
    .toLowerCase()
    .replace(/^https?:\/\/(www\.|m\.|web\.)?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');
  return 'manual:' + key;
}

export function cleanUrl(url) {
  if (!url) return null;
  let u = String(url).trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u.replace(/\/+$/, '');
}