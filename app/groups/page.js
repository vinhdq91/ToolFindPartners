import Link from 'next/link';
import { db } from '../../lib/supabase';
import { getSettings } from '../../lib/settings';
import { GROUP_KINDS, GROUP_KIND_LABELS } from '../../lib/constants';
import { addGroups } from './actions';
import GroupRow from './GroupRow';

export default async function GroupsPage({ searchParams }) {
  const { kind = 'all', added, skipped, bad } = await searchParams;

  let query = db()
    .from('fb_groups')
    .select('*')
    .order('last_posted_at', { ascending: true, nullsFirst: true }) // groups waiting longest come first
    .order('id');
  if (kind !== 'all') query = query.eq('kind', kind);
  const { data: groups, error } = await query;
  if (error) return <p className="notice">Database error: {error.message}</p>;
  const settings = await getSettings();

  return (
    <>
      <div className="page-head">
        <h1>Facebook groups</h1>
        <Link href="/settings" className="button">Settings (workshop facts, staff)</Link>
      </div>

      {added !== undefined && (
        <p className="notice ok">
          Added {added} group(s).{Number(skipped) > 0 && ` ${skipped} were already in the list.`}
          {bad && ` Not a Facebook link: ${bad}`}
        </p>
      )}
      {!settings.workshopInfo && (
        <p className="notice">
          Add your workshop facts in <Link href="/settings">Settings</Link> first, so the AI writes about your real offer.
        </p>
      )}

      <details className="card">
        <summary className="settings-summary">+ Add groups</summary>
        <form action={addGroups} style={{ marginTop: 12 }}>
          <div className="field">
            <label>One group per line. Just the link is OK, or: Name | link | type | language</label>
            <textarea
              name="lines"
              rows={6}
              placeholder={`https://www.facebook.com/groups/123456789
Hội chủ homestay Hội An | https://www.facebook.com/groups/abc | hospitality | vi
Việc làm Hội An | https://www.facebook.com/groups/xyz | job | vi`}
            />
            <p className="hint">Types: {GROUP_KINDS.join(', ')}. Languages: vi, en.</p>
          </div>
          <button type="submit" className="primary">Add groups</button>
        </form>
      </details>

      <div className="filters">
        {['all', ...GROUP_KINDS].map((k) => (
          <Link key={k} href={k === 'all' ? '/groups' : `/groups?kind=${k}`} className={`button ${kind === k ? 'primary' : ''}`}>
            {k === 'all' ? 'All' : GROUP_KIND_LABELS[k]}
          </Link>
        ))}
        <span className="hint">{groups.length} group(s) · groups waiting longest are on top</span>
      </div>

      {groups.length === 0 ? (
        <div className="card">No groups yet. Add some with "+ Add groups".</div>
      ) : (
        groups.map((g) => <GroupRow key={g.id} group={g} staffNames={settings.staffNames} />)
      )}
    </>
  );
}