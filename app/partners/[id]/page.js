import Link from 'next/link';
import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '../../../lib/supabase';
import { STATUSES, STATUS_LABELS, OFFER_LABELS } from '../../../lib/constants';
import CopyButton from './CopyButton';
import ImageSlider from './ImageSlider';
import { fetchWebsiteImages, removeImage } from './photo-actions';
import PhotoUploader from './PhotoUploader';

export const dynamic = 'force-dynamic';

// ---------- Server actions (run on the server, not in the browser) ----------

async function saveDraft(formData) {
  'use server';
  const id = Number(formData.get('id'));
  const text = (name) => {
    const v = String(formData.get(name) ?? '').trim();
    return v || null;
  };
  const status = text('status') ?? 'new';
  const update = {
    email: text('email')?.toLowerCase() ?? null,
    phone: text('phone'),
    email_subject: text('email_subject'),
    email_body: text('email_body'),
    facebook_message: text('facebook_message'),
    notes: text('notes'),
    status,
    updated_at: new Date().toISOString(),
  };
  if (status !== 'new' && !formData.get('contacted_at')) update.contacted_at = new Date().toISOString();
  const { error } = await db().from('partners').update(update).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath(`/partners/${id}`);
}

async function markContacted(formData) {
  'use server';
  const id = Number(formData.get('id'));
  const now = new Date().toISOString();
  const { error } = await db()
    .from('partners')
    .update({ status: 'contacted', contacted_at: now, updated_at: now })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath(`/partners/${id}`);
}

// ---------- Page ----------

function gmailLink(p) {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: p.email ?? '',
    su: p.email_subject ?? '',
    body: p.email_body ?? '',
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function PartnerPage({ params }) {
  const { id } = await params;
  const { data: p, error } = await db().from('partners').select('*').eq('id', Number(id)).maybeSingle();
  if (error) return <p className="notice">Database error: {error.message}</p>;
  if (!p) notFound();

  return (
    <>
      <p><Link href="/">← Back to dashboard</Link></p>
      <h1>{p.name}</h1>

      <div className="card">
        <ImageSlider images={p.image_urls ?? []} />

        <div className="actions" style={{ marginTop: 14 }}>
          {p.website && (
            <form action={fetchWebsiteImages}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit">{p.image_urls?.length ? 'Refresh images from website' : 'Get images from website'}</button>
            </form>
          )}
          <PhotoUploader partnerId={p.id} />
        </div>
        <p className="hint">
          Website images are the partner&apos;s own photos, shown by link for reference only. Don&apos;t reuse them in
          our posts. Uploaded photos are made smaller automatically before upload.
        </p>

        {p.image_urls?.length > 0 && (
          <details>
            <summary className="hint" style={{ cursor: 'pointer' }}>Remove images ({p.image_urls.length})</summary>
            <div className="manage-thumbs">
              {p.image_urls.map((url) => (
                <form key={url} action={removeImage} className="manage-thumb">
                  <img src={url} alt="" referrerPolicy="no-referrer" loading="lazy" />
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="url" value={url} />
                  <button type="submit" aria-label="Remove image">Remove</button>
                </form>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="grid2">
        <div className="card info">
          <h2>About this partner</h2>
          <p><b>Type:</b> {p.type ?? '-'}</p>
          <p><b>Address:</b> {p.address ?? '-'}</p>
          <p><b>Website:</b> {p.website ? <a href={p.website} target="_blank" rel="noreferrer">{p.website}</a> : '-'}</p>
          <p><b>Facebook:</b> {p.facebook_url ? <a href={p.facebook_url} target="_blank" rel="noreferrer">Open page</a> : '-'}</p>
          {p.other_emails && <p><b>Other emails:</b> {p.other_emails}</p>}
          {p.rating && <p><b>Rating:</b> {p.rating} ({p.review_count ?? 0} reviews)</p>}
          {p.google_maps_url && <p><a href={p.google_maps_url} target="_blank" rel="noreferrer">Open in Google Maps</a></p>}
          <p><b>Added:</b> {formatDate(p.created_at)} {p.found_by ? `(${p.found_by})` : ''}</p>
          {p.contacted_at && <p><b>First contacted:</b> {formatDate(p.contacted_at)}</p>}
        </div>

        <div className="card info">
          <h2>Fit score</h2>
          {p.score === null || p.score === undefined ? (
            <p className="muted">Not scored yet.</p>
          ) : (
            <>
              <p style={{ fontSize: 32, fontWeight: 600, margin: '4px 0' }}>{p.score} / 100</p>
              {p.best_offer && <p><b>Best offer:</b> {OFFER_LABELS[p.best_offer] ?? p.best_offer}</p>}
              {p.score_reason && <p>{p.score_reason}</p>}
            </>
          )}
        </div>
      </div>

      <form action={saveDraft} className="card">
        <input type="hidden" name="id" value={p.id} />
        <input type="hidden" name="contacted_at" value={p.contacted_at ?? ''} />

        <div className="grid2">
          <div className="field">
            <label>Email</label>
            <input name="email" defaultValue={p.email ?? ''} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" defaultValue={p.phone ?? ''} />
          </div>
        </div>

        <h2>Email draft</h2>
        <div className="field">
          <label>Subject</label>
          <input name="email_subject" defaultValue={p.email_subject ?? ''} />
        </div>
        <div className="field">
          <label>Message</label>
          <textarea name="email_body" rows={12} defaultValue={p.email_body ?? ''} />
        </div>

        <h2>Facebook message</h2>
        <div className="field">
          <textarea name="facebook_message" rows={5} defaultValue={p.facebook_message ?? ''} />
        </div>

        <div className="grid2">
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={p.status}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Notes</label>
            <input name="notes" defaultValue={p.notes ?? ''} />
          </div>
        </div>

        <div className="actions">
          <button type="submit" className="primary">Save changes</button>
          <span className="hint">Save first, then use the buttons below, so they use your latest text.</span>
        </div>
      </form>

      <div className="card">
        <h2>Send</h2>
        <div className="actions">
          {p.email && p.email_subject ? (
            <a className="button primary" href={gmailLink(p)} target="_blank" rel="noreferrer">Open email in Gmail</a>
          ) : (
            <span className="muted">Needs an email address and a draft to open Gmail.</span>
          )}
          <CopyButton text={p.facebook_message} label="Copy Facebook message" />
          {p.facebook_url && <a className="button" href={p.facebook_url} target="_blank" rel="noreferrer">Open Facebook page</a>}
          {p.status === 'new' && (
            <form action={markContacted}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit">Mark as contacted</button>
            </form>
          )}
        </div>
        <p className="hint">After you send the email or Facebook message, click "Mark as contacted".</p>
      </div>
    </>
  );
}