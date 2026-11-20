'use server';

// Dashboard button: get website images for every partner that has none yet.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../lib/supabase';
import { findImages, runInGroups } from '../lib/images';

export async function fetchMissingImages() {
  const supabase = db();
  const { data: partners, error } = await supabase
    .from('partners')
    .select('id, website, image_urls')
    .not('website', 'is', null)
    .eq('image_urls', '{}');
  if (error) throw new Error(error.message);

  let found = 0;
  await runInGroups(partners, 5, async (p) => {
    const image_urls = await findImages(p.website);
    if (image_urls.length === 0) return;
    const { error: saveError } = await supabase.from('partners').update({ image_urls }).eq('id', p.id);
    if (!saveError) found++;
  });

  revalidatePath('/');
  redirect(`/?images=${found}-${partners.length}`);
}