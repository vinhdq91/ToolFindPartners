import Link from 'next/link';
import { db } from '../../lib/supabase';
import { duplicateLandingPage, deleteLandingPage } from './actions';
import DeleteButton from './DeleteButton';
import LinkButtons from './LinkButtons';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function LandingList({ searchParams }) {
  const { deleted } = await searchParams;
  const { data: pages, error } = await db()
    .from('landing_pages')
    .select('id, title, slug, language, status, view_count, last_viewed_at, updated_at, theme, partners(name)')
    .order('updated_at', { ascending: false });
  if (error) return <p className="notice">Database error: {error.message}</p>;

  return (
    <>
      <div className="page-head">
        <h1>Landing pages</h1>
        <Link href="/landing/new" className="button primary">+ New landing page</Link>
      </div>
      {deleted && <p className="notice ok">Page deleted.</p>}

      {pages.length === 0 ? (
        <div className="card">
          <p>No landing pages yet.</p>
          <p className="hint">Make one page about the workshop first. Later you can duplicate it for a single partner.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>Link</th>
              <th>Language</th>
              <th>Status</th>
              <th>Views</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="color-dot" style={{ background: p.theme?.color }} />
                  <Link href={`/landing/${p.id}`}>{p.title}</Link>
                  {p.partners?.name && <div className="hint">For: {p.partners.name}</div>}
                </td>
                <td><code>/p/{p.slug}</code></td>
                <td>{p.language === 'vi' ? 'Tiếng Việt' : 'English'}</td>
                <td><span className={`badge ${p.status === 'published' ? 'partner' : ''}`}>{p.status === 'published' ? 'Published' : 'Draft'}</span></td>
                <td>
                  {p.view_count}
                  {p.last_viewed_at && <div className="hint">Last: {formatDate(p.last_viewed_at)}</div>}
                </td>
                <td>{formatDate(p.updated_at)}</td>
                <td>
                  <div className="actions">
                    <Link href={`/landing/${p.id}`} className="button">Edit</Link>
                    <LinkButtons slug={p.slug} status={p.status} />
                    <form action={duplicateLandingPage}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit">Duplicate</button>
                    </form>
                    <form action={deleteLandingPage}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton question={`Delete "${p.title}"? This cannot be undone.`} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}