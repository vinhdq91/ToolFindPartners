import Link from 'next/link';
import { db } from '../../../lib/supabase';
import { createLandingPage } from '../actions';
import SettingsFields from '../SettingsFields';

export default async function NewLandingPage({ searchParams }) {
  const { error } = await searchParams;
  const { data: partners } = await db().from('partners').select('id, name').order('name');

  return (
    <>
      <p><Link href="/landing">← Back to landing pages</Link></p>
      <h1>New landing page</h1>
      {error === 'title' && <p className="notice">Please enter a page name.</p>}

      <form action={createLandingPage} className="card" style={{ maxWidth: 760 }}>
        <SettingsFields partners={partners ?? []} />
        <p className="hint">
          The new page starts with all sections filled with example text. You can change, hide or move them in the editor.
        </p>
        <button type="submit" className="primary">Create page</button>
      </form>
    </>
  );
}