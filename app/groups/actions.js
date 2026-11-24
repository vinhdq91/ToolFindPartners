'use server';

// Server actions for the Facebook groups page.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../../lib/supabase';
import { getSettings } from '../../lib/settings';
import { generatePostText, GOALS } from '../../lib/gemini';
import { GROUP_KINDS } from '../../lib/constants';

// https://m.facebook.com/groups/123/?ref=share -> https://www.facebook.com/groups/123
function cleanGroupUrl(raw) {
  let s = String(raw ?? '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (!/(^|\.)facebook\.com$|(^|\.)fb\.com$/i.test(u.hostname)) return null;
  const path = u.pathname.replace(/\/+$/, '');
  return `https://www.facebook.com${path}`;
}

function nameFromUrl(url) {
  const last = url.split('/').filter(Boolean).pop() ?? 'Group';
  return /^\d+$/.test(last) ? `Group ${last}` : decodeURIComponent(last).replace(/[-_.]+/g, ' ');
}

// One group per line: "Name | link | kind | language"  or just "link"
export async function addGroups(formData) {
  const lines = String(formData.get('lines') ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const rows = [];
  const bad = [];
  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim());
    const urlPart = parts.find((p) => /facebook\.com|fb\.com/i.test(p));
    const url = cleanGroupUrl(urlPart);
    if (!url) {
      bad.push(line.slice(0, 40));
      continue;
    }
    const others = parts.filter((p) => p !== urlPart);
    const kind = others.find((p) => GROUP_KINDS.includes(p.toLowerCase()))?.toLowerCase() ?? 'hospitality';
    const language = others.find((p) => ['vi', 'en'].includes(p.toLowerCase()))?.toLowerCase() ?? 'vi';
    const name = others.find((p) => p && !GROUP_KINDS.includes(p.toLowerCase()) && !['vi', 'en'].includes(p.toLowerCase())) || nameFromUrl(url);
    rows.push({ name, url, kind, language });
  }
  let added = 0;
  if (rows.length) {
    const { data, error } = await db()
      .from('fb_groups')
      .upsert(rows, { onConflict: 'url', ignoreDuplicates: true })
      .select('id');
    if (error) throw new Error(error.message);
    added = data?.length ?? 0;
  }
  revalidatePath('/groups');
  const params = new URLSearchParams({ added: String(added), skipped: String(rows.length - added) });
  if (bad.length) params.set('bad', bad.join(' ; '));
  redirect(`/groups?${params}`);
}

export async function updateGroup(formData) {
  const id = Number(formData.get('id'));
  const text = (n) => String(formData.get(n) ?? '').trim() || null;
  const kind = text('kind');
  const update = {
    name: text('name') ?? 'Group',
    kind: GROUP_KINDS.includes(kind) ? kind : 'other',
    language: text('language') === 'en' ? 'en' : 'vi',
    members: Number(text('members')) || null,
    promo_rule: text('promo_rule'),
    notes: text('notes'),
  };
  const { error } = await db().from('fb_groups').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/groups');
}

export async function deleteGroup(formData) {
  const id = Number(formData.get('id'));
  const { error } = await db().from('fb_groups').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/groups');
}

// Called by the "Generate" button. Returns { text } or { error }.
export async function generatePost(groupId, options) {
  try {
    const supabase = db();
    const { data: group, error } = await supabase.from('fb_groups').select('*').eq('id', Number(groupId)).single();
    if (error) return { error: error.message };
    const { data: recent } = await supabase
      .from('fb_posts')
      .select('content')
      .eq('group_id', group.id)
      .order('posted_at', { ascending: false })
      .limit(3);
    const settings = await getSettings();
    const safeOptions = {
      goal: GOALS[options?.goal] ? options.goal : 'partner_both',
      tone: String(options?.tone ?? 'friendly'),
      length: String(options?.length ?? 'medium'),
      language: ['vi', 'en', 'auto'].includes(options?.language) ? options.language : 'auto',
      poster: options?.poster === 'staff' ? 'staff' : 'page',
      posterName: String(options?.posterName ?? '').slice(0, 60),
      extra: String(options?.extra ?? '').slice(0, 500),
    };
    const text = await generatePostText({
      group,
      options: safeOptions,
      settings,
      recentPosts: (recent ?? []).map((r) => r.content),
    });
    return { text };
  } catch (err) {
    return { error: err.message };
  }
}

// Called after the person confirms they posted. Returns { ok } or { error }.
export async function markPosted(groupId, content, options, postedBy) {
  const supabase = db();
  const id = Number(groupId);
  const { data: group, error: readError } = await supabase.from('fb_groups').select('post_count').eq('id', id).single();
  if (readError) return { error: readError.message };

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from('fb_posts').insert({
    group_id: id,
    content: String(content ?? '').slice(0, 10000),
    options: options ?? {},
    posted_by: postedBy || null,
    posted_at: now,
  });
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase
    .from('fb_groups')
    .update({ post_count: (group.post_count ?? 0) + 1, last_posted_at: now, last_posted_by: postedBy || null })
    .eq('id', id);
  if (updateError) return { error: updateError.message };
  revalidatePath('/groups');
  return { ok: true };
}