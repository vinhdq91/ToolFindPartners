// The public landing page that partners open: /p/<link-name>
//
// - Only "Published" pages are shown to everyone.
// - Add ?preview=1 to see a Draft page (used by the buttons in the app). Preview visits are not counted.
// - Add &print=1 to open the print window at once (the "PDF" button in the app).

import { notFound } from 'next/navigation';
import { db } from '../../../lib/supabase';
import LandingRender from '../../../components/LandingRender';
import PageTools from './PageTools';

async function loadPage(slug) {
  const { data, error } = await db()
    .from('landing_pages')
    .select('id, title, slug, language, theme, blocks, status, view_count, partners(name)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: 'Page not found' };
  const hero = page.blocks?.find((b) => b.type === 'hero' && b.visible)?.data ?? {};
  return {
    title: hero.headline || page.title,
    description: hero.text || undefined,
    openGraph: hero.image ? { images: [hero.image] } : undefined, // preview photo when the link is shared
  };
}

export default async function PublicLandingPage({ params, searchParams }) {
  const { slug } = await params;
  const { preview, print } = await searchParams;
  const isPreview = preview === '1';

  const page = await loadPage(slug);
  if (!page) notFound();
  if (page.status !== 'published' && !isPreview) notFound();

  // Count real visits only
  if (!isPreview && page.status === 'published') {
    await db()
      .from('landing_pages')
      .update({ view_count: (page.view_count ?? 0) + 1, last_viewed_at: new Date().toISOString() })
      .eq('id', page.id);
  }

  return (
    <>
      {isPreview && (
        <div className="preview-banner no-print">
          Preview {page.status !== 'published' && '(Draft: partners cannot open this link until you publish it)'} · Not
          counted as a view
        </div>
      )}
      <LandingRender
        blocks={page.blocks ?? []}
        theme={page.theme ?? {}}
        language={page.language}
        partnerName={page.partners?.name ?? null}
      />
      <PageTools language={page.language} autoPrint={print === '1'} />
    </>
  );
}