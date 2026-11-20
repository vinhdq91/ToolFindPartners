import Link from 'next/link';
import { db } from '../lib/supabase';
import { TYPES, STATUSES, STATUS_LABELS } from '../lib/constants';
import { fetchMissingImages } from './image-actions';

export const dynamic = 'force-dynamic'; // always show fresh data

function scoreClass(score) {
  if (score === null || score === undefined) return 'none';
  if (score >= 70) return 'high';
  if (score >= 40) return 'mid';
  return 'low';
}

export default async function Dashboard({ searchParams }) {
  const { status = 'all', type = 'all', q = '', images } = await searchParams;
  const supabase = db();

  // Numbers for each status
  const { data: allStatuses, error: countError } = await supabase.from('partners').select('status');
  if (countError) return <p className="notice">Database error: {countError.message}</p>;
  const counts = { all: allStatuses.length };
  for (const s of STATUSES) counts[s] = allStatuses.filter((r) => r.status === s).length;

  // Partner list with filters
  let query = supabase
    .from('partners')
    .select('id, name, type, score, email, facebook_url, phone, status, email_subject, contacted_at, image_urls')
    .order('score', { ascending: false, nullsFirst: false })
    .order('id')
    .limit(1000);
  if (status !== 'all') query = query.eq('status', status);
  if (type !== 'all') query = query.eq('type', type);
  if (q) query = query.ilike('name', `%${q}%`);
  const { data: partners, error } = await query;
  if (error) return <p className="notice">Database error: {error.message}</p>;

  const link = (s) => {
    const params = new URLSearchParams();
    if (s !== 'all') params.set('status', s);
    if (type !== 'all') params.set('type', type);
    if (q) params.set('q', q);
    const str = params.toString();
    return str ? `/?${str}` : '/';
  };

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <form action={fetchMissingImages}>
          <button type="submit">Get missing images from websites</button>
        </form>
      </div>
      {images && (
        <p className="notice ok">
          Images found for {images.split('-')[0]} of {images.split('-')[1]} partners that had no images.
          Partners without a website need photos uploaded on their page.
        </p>
      )}

      <div className="stats">
        {['all', ...STATUSES].map((s) => (
          <Link key={s} href={link(s)} className={`stat ${status === s ? 'active' : ''}`}>
            <div className="num">{counts[s]}</div>
            <div className="label">{s === 'all' ? 'All partners' : STATUS_LABELS[s]}</div>
          </Link>
        ))}
      </div>

      <form className="filters" method="get">
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <input name="q" placeholder="Search name..." defaultValue={q} />
        <select name="type" defaultValue={type}>
          <option value="all">All types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="submit">Filter</button>
        {(q || type !== 'all') && <Link href={status === 'all' ? '/' : `/?status=${status}`}>Clear</Link>}
      </form>

      {partners.length === 0 ? (
        <div className="card">No partners here yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Score</th>
              <th>Name</th>
              <th>Type</th>
              <th>Contact</th>
              <th>Draft</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/partners/${p.id}`} className="thumb">
                    {p.image_urls?.[0] ? (
                      <img src={p.image_urls[0]} alt="" referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <span>No image</span>
                    )}
                  </Link>
                </td>
                <td><span className={`score ${scoreClass(p.score)}`}>{p.score ?? '-'}</span></td>
                <td><Link href={`/partners/${p.id}`}>{p.name}</Link></td>
                <td>{p.type ?? <span className="muted">-</span>}</td>
                <td>
                  {p.email && <div>{p.email}</div>}
                  {p.facebook_url && <div><a href={p.facebook_url} target="_blank" rel="noreferrer">Facebook</a></div>}
                  {!p.email && !p.facebook_url && (p.phone ?? <span className="muted">-</span>)}
                </td>
                <td>{p.email_subject ? 'Ready' : <span className="muted">Not yet</span>}</td>
                <td><span className={`badge ${p.status}`}>{STATUS_LABELS[p.status] ?? p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}