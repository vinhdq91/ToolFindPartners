'use server';

// Server actions for partner images: get from website, upload, remove.

import { revalidatePath } from 'next/cache';
import { db } from '../../../lib/supabase';
import { findImages } from '../../../lib/images';

const BUCKET = 'partner-photos';
const MAX_FILE_MB = 8;

function refresh(id) {
  revalidatePath('/');
  revalidatePath(`/partners/${id}`);
}

async function getPartner(id) {
  const { data, error } = await db().from('partners').select('id, website, image_urls').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

function isUploaded(url) {
  return url.includes(`/storage/v1/object/public/${BUCKET}/`);
}

// Keep the photos you uploaded, replace the ones from the website
export async function fetchWebsiteImages(formData) {
  const id = Number(formData.get('id'));
  const p = await getPartner(id);
  const fromSite = await findImages(p.website);
  const uploaded = (p.image_urls ?? []).filter(isUploaded);
  const image_urls = [...uploaded, ...fromSite.filter((u) => !uploaded.includes(u))];
  const { error } = await db().from('partners').update({ image_urls }).eq('id', id);
  if (error) throw new Error(error.message);
  refresh(id);
}

export async function uploadPhotos(formData) {
  const id = Number(formData.get('id'));
  const files = formData.getAll('photos').filter((f) => f && typeof f === 'object' && f.size > 0);
  if (files.length === 0) return;

  const supabase = db();
  const added = [];
  for (const file of files) {
    if (!file.type?.startsWith('image/')) continue;
    if (file.size > MAX_FILE_MB * 1024 * 1024) continue;
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error('Upload failed: ' + error.message);
    added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const p = await getPartner(id);
  const { error } = await supabase
    .from('partners')
    .update({ image_urls: [...added, ...(p.image_urls ?? [])] })
    .eq('id', id);
  if (error) throw new Error(error.message);
  refresh(id);
}

export async function removeImage(formData) {
  const id = Number(formData.get('id'));
  const url = String(formData.get('url'));
  const supabase = db();
  const p = await getPartner(id);

  if (isUploaded(url)) {
    const path = decodeURIComponent(url.split(`/storage/v1/object/public/${BUCKET}/`)[1] ?? '');
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  const { error } = await supabase
    .from('partners')
    .update({ image_urls: (p.image_urls ?? []).filter((u) => u !== url) })
    .eq('id', id);
  if (error) throw new Error(error.message);
  refresh(id);
}