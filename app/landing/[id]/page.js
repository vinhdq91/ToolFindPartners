import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '../../../lib/supabase';
import { saveLandingSettings, duplicateLandingPage, deleteLandingPage } from '../actions';
import SettingsFields from '../SettingsFields';
import DeleteButton from '../DeleteButton';
import Editor from './Editor';
import LinkButtons from '../LinkButtons';

export default async function EditLandingPage({ params, searchParams }) {
  const { id } = await params;
  const { created, saved, error: formError } = await searchParams;
  const supabase = db();

  const { data: page, error } = await supabase.from('landing_pages').select('*').eq('id', Number(id)).maybeSingle();
  if (error) return <p className="notice">Database error: {error.message}</p>;
  if (!page) notFound();
  const { data: partners } = await supabase.from('partners').select('id, name').order('name');
  const partnerName = partners?.find((p) => p.id === page.partner_id)?.name ?? null;

  return (
    <>
      <p><Link href="/landing">← Back to landing pages</Link></p>
      <div className="page-head">
        <div>
          <h1>{page.title}</h1>
          <p className="hint" style={{ margin: 0 }}>
            /p/{page.slug} · {page.language === 'vi' ? 'Tiếng Việt' : 'English'} ·{' '}
            {page.status === 'published' ? 'Published' : 'Draft'} · {page.view_count} views
          </p>
        </div>
        <div className="actions">
          <LinkButtons slug={page.slug} status={page.status} />
          <form action={duplicateLandingPage}>
            <input type="hidden" name="id" value={page.id} />
            <button type="submit">Duplicate</button>
          </form>
          <form action={deleteLandingPage}>
            <input type="hidden" name="id" value={page.id} />
            <DeleteButton question={`Delete "${page.title}"? This cannot be undone.`} />
          </form>
        </div>
      </div>

      {created && <p className="notice ok">Page created. Open a section below to change its text and photos.</p>}
      {page.status !== 'published' && !created && (
        <p className="notice">
          This page is a Draft. Partners can&apos;t open its link yet. When it&apos;s ready, set Status to Published in
          Page settings. (Save your section changes first.)
        </p>
      )}
      {saved && <p className="notice ok">Settings saved.</p>}
      {formError === 'title' && <p className="notice">Please enter a page name.</p>}

      <details className="card" open={Boolean(saved || formError)}>
        <summary className="settings-summary">Page settings (name, link, color, font, status)</summary>
        <form action={saveLandingSettings} style={{ marginTop: 16 }}>
          <input type="hidden" name="id" value={page.id} />
          <input type="hidden" name="language" value={page.language} />
          <SettingsFields page={page} partners={partners ?? []} showStatus showLanguage={false} />
          <p className="hint">
            Save your section changes first: saving settings reloads the page. To make the other language, duplicate
            this page and translate the copy.
          </p>
          <button type="submit" className="primary">Save settings</button>
        </form>
      </details>

      <Editor page={page} partnerName={partnerName} />
    </>
  );
}