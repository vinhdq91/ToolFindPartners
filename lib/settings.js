// Read and write simple app settings (stored in the app_settings table).
import { db } from './supabase';

export const SETTING_KEYS = {
  workshopInfo: 'workshop_info', // facts the AI may use in posts
  landingUrl: 'landing_url',     // main landing page link, added to posts
  staffNames: 'staff_names',     // who can post, one per line
};

export async function getSettings() {
  const { data, error } = await db().from('app_settings').select('key, value');
  if (error) throw new Error(error.message);
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? '']));
  return {
    workshopInfo: map[SETTING_KEYS.workshopInfo] ?? '',
    landingUrl: map[SETTING_KEYS.landingUrl] ?? '',
    staffNames: (map[SETTING_KEYS.staffNames] ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export async function saveSettings(values) {
  const now = new Date().toISOString();
  const rows = Object.entries(values).map(([key, value]) => ({ key, value, updated_at: now }));
  const { error } = await db().from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}