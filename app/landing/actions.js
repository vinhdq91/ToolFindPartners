'use server';

// Server actions for landing pages: create, save settings, duplicate, delete.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../../lib/supabase';
import { slugify, defaultBlocks, COLORS, FONTS, BLOCK_LABELS } from '../../lib/landing';

const IMAGE_BUCKET = 'landing-images';
const MAX_IMAGE_MB = 8;

function text(formData, name) {
  const v = String(formData.get(name) ?? '').trim();
  return v || null;
}

// Makes sure the link name is not used by another page: "my-page", "my-page-2", ...
async function uniqueSlug(base, excludeId = null) {
  const supabase = db();
  const root = slugify(base);
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    let query = supabase.from('landing_pages').select('id').eq('slug', candidate);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query.limit(1);
    if (error) throw new Error(error.message);
    if (data.length === 0) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

function cleanTheme(formData) {
  const color = text(formData, 'color');
  const font = text(formData, 'font');
  return {
    color: COLORS.some((c) => c.value === color) ? color : COLORS[0].value,
    font: FONTS.some((f) => f.value === font) ? font : FONTS[0].value,
  };
}

export async function createLandingPage(formData) {
  const title = text(formData, 'title');
  if (!title) redirect('/landing/new?error=title');
  const language = text(formData, 'language') === 'vi' ? 'vi' : 'en';
  const partnerId = Number(text(formData, 'partner_id')) || null;

  const page = {
    title,
    slug: await uniqueSlug(text(formData, 'slug') || title),
    language,
    theme: cleanTheme(formData),
    blocks: defaultBlocks(language),
    partner_id: partnerId,
  };
  const { data, error } = await db().from('landing_pages').insert(page).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/landing');
  redirect(`/landing/${data.id}?created=1`);
}

export async function saveLandingSettings(formData) {
  const id = Number(formData.get('id'));
  const title = text(formData, 'title');
  if (!title) redirect(`/landing/${id}?error=title`);

  const update = {
    title,
    slug: await uniqueSlug(text(formData, 'slug') || title, id),
    language: text(formData, 'language') === 'vi' ? 'vi' : 'en',
    status: text(formData, 'status') === 'published' ? 'published' : 'draft',
    partner_id: Number(text(formData, 'partner_id')) || null,
    theme: cleanTheme(formData),
    updated_at: new Date().toISOString(),
  };
  const { error } = await db().from('landing_pages').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/landing');
  revalidatePath(`/landing/${id}`);
  redirect(`/landing/${id}?saved=1`);
}

// Called by the editor with the whole list of sections. Returns { ok } or { error }.
export async function saveLandingBlocks(id, blocks) {
  if (!Array.isArray(blocks)) return { error: 'Sections are missing.' };
  const clean = [];
  for (const b of blocks) {
    if (!b || typeof b !== 'object' || !BLOCK_LABELS[b.type]) continue;
    clean.push({
      id: String(b.id ?? '').slice(0, 40) || Math.random().toString(36).slice(2),
      type: b.type,
      visible: b.visible !== false,
      data: b.data && typeof b.data === 'object' ? b.data : {},
    });
  }
  if (JSON.stringify(clean).length > 500_000) return { error: 'The page is too large to save.' };

  const { error } = await db()
    .from('landing_pages')
    .update({ blocks: clean, updated_at: new Date().toISOString() })
    .eq('id', Number(id));
  if (error) return { error: error.message };
  revalidatePath('/landing');
  return { ok: true };
}

// Called by the editor for each photo. Returns { url } or { error }.
export async function uploadLandingImage(formData) {
  const pageId = Number(formData.get('page_id'));
  const file = formData.get('file');
  if (!file || typeof file !== 'object' || !file.size) return { error: 'No file.' };
  if (!file.type?.startsWith('image/')) return { error: 'Please choose an image file.' };
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return { error: `Photo is larger than ${MAX_IMAGE_MB} MB.` };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${pageId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = db();
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) return { error: 'Upload failed: ' + error.message };
  return { url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl };
}

export async function duplicateLandingPage(formData) {
  const id = Number(formData.get('id'));
  const supabase = db();
  const { data: page, error } = await supabase.from('landing_pages').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);

  const copy = {
    title: `${page.title} (copy)`,
    slug: await uniqueSlug(`${page.slug}-copy`),
    language: page.language,
    theme: page.theme,
    blocks: page.blocks,
    partner_id: page.partner_id,
    status: 'draft',
  };
  const { data, error: insertError } = await supabase.from('landing_pages').insert(copy).select('id').single();
  if (insertError) throw new Error(insertError.message);
  revalidatePath('/landing');
  redirect(`/landing/${data.id}?created=1`);
}

export async function deleteLandingPage(formData) {
  const id = Number(formData.get('id'));
  const { error } = await db().from('landing_pages').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/landing');
  redirect('/landing?deleted=1');
}