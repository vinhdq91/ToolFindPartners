import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, manualId, cleanUrl } from '../../lib/supabase';
import { TYPES } from '../../lib/constants';

async function addPartner(formData) {
  'use server';
  const text = (name) => {
    const v = String(formData.get(name) ?? '').trim();
    return v || null;
  };
  const partner = {
    name: text('name'),
    type: text('type') ?? 'other',
    website: cleanUrl(text('website')),
    facebook_url: cleanUrl(text('facebook_url')),
    email: text('email')?.toLowerCase() ?? null,
    phone: text('phone'),
    address: text('address'),
    notes: text('notes'),
    found_by: 'manual',
  };
  if (!partner.name) redirect('/add?error=name');
  if (!partner.website && !partner.facebook_url) redirect('/add?error=link');
  partner.place_id = manualId(partner);

  const { data, error } = await db().from('partners').insert(partner).select('id').single();
  if (error) {
    if (error.code === '23505') redirect('/add?error=exists');
    throw new Error(error.message);
  }
  revalidatePath('/');
  redirect(`/partners/${data.id}`);
}

const ERRORS = {
  name: 'Please enter a name.',
  link: 'Please enter a website or a Facebook page.',
  exists: 'This partner is already in the list.',
};

export default async function AddPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <>
      <h1>Add a partner</h1>
      {error && <p className="notice">{ERRORS[error] ?? 'Something went wrong.'}</p>}

      <form action={addPartner} className="card" style={{ maxWidth: 700 }}>
        <div className="field">
          <label>Name *</label>
          <input name="name" required />
        </div>
        <div className="field">
          <label>Type</label>
          <select name="type" defaultValue="hotel">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Website (website or Facebook is needed)</label>
          <input name="website" placeholder="https://..." />
        </div>
        <div className="field">
          <label>Facebook page</label>
          <input name="facebook_url" placeholder="https://facebook.com/..." />
        </div>
        <div className="grid2">
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" />
          </div>
          <div className="field">
            <label>Phone</label>
            <input name="phone" />
          </div>
        </div>
        <div className="field">
          <label>Address</label>
          <input name="address" />
        </div>
        <div className="field">
          <label>Notes</label>
          <input name="notes" placeholder="Anything useful, e.g. who you talked to" />
        </div>
        <button type="submit" className="primary">Add partner</button>
      </form>
    </>
  );
}