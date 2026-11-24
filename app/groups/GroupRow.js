'use client';

// One Facebook group: Generate a post with AI, then Copy & open the group.

import { useEffect, useState } from 'react';
import { generatePost, markPosted, updateGroup, deleteGroup } from './actions';
import { GROUP_KINDS, GROUP_KIND_LABELS } from '../../lib/constants';
import { GOAL_LABELS, TONES, LENGTHS } from '../../lib/gemini-options';

const WAIT_DAYS = 7;

function daysAgo(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function GroupRow({ group, staffNames }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState({ goal: 'partner_both', tone: 'friendly', length: 'medium', language: 'auto', poster: 'page', posterName: '', extra: '' });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [askPosted, setAskPosted] = useState(false);
  const [message, setMessage] = useState('');

  // Remember who is using this computer
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('poster') || 'null');
      if (saved) setOptions((o) => ({ ...o, ...saved }));
    } catch {}
  }, []);
  function setOption(key, value) {
    setOptions((o) => {
      const next = { ...o, [key]: value };
      if (key === 'poster' || key === 'posterName') {
        try {
          localStorage.setItem('poster', JSON.stringify({ poster: next.poster, posterName: next.posterName }));
        } catch {}
      }
      return next;
    });
  }

  const ago = daysAgo(group.last_posted_at);
  const tooSoon = ago !== null && ago < WAIT_DAYS;
  const postedBy = options.poster === 'page' ? 'Workshop Page' : options.posterName || 'Staff';

  async function generate() {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await generatePost(group.id, options);
    setBusy(false);
    if (result?.error) setError(result.error);
    else setText(result.text);
  }

  async function copyAndOpen() {
    if (!text.trim()) return;
    if (tooSoon && !confirm(`This group got a post ${ago} day(s) ago by ${group.last_posted_by ?? 'someone'}. Posting again so soon can look like spam. Continue?`)) return;
    // Copy first (the page must still have focus), then open the group in a new tab
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied. In the group: click "Write something...", press Ctrl+V, then Post.');
    } catch {
      setMessage('Could not copy automatically. Select the text and copy it by hand.');
    }
    window.open(group.url, '_blank', 'noopener');
    setAskPosted(true);
  }

  async function confirmPosted() {
    const result = await markPosted(group.id, text, options, postedBy);
    if (result?.error) setError(result.error);
    else {
      setAskPosted(false);
      setText('');
      setMessage('Marked as posted. Thank you!');
    }
  }

  return (
    <div className={`group-row ${open ? 'is-open' : ''}`}>
      <div className="group-head">
        <div className="group-title">
          <a href={group.url} target="_blank" rel="noreferrer">{group.name}</a>
          <div className="hint">
            <span className={`badge kind-${group.kind}`}>{GROUP_KIND_LABELS[group.kind] ?? group.kind}</span>{' '}
            {group.language === 'en' ? 'English' : 'Tiếng Việt'}
            {group.members ? ` · ${group.members.toLocaleString()} members` : ''}
            {group.promo_rule ? ` · Rule: ${group.promo_rule}` : ''}
          </div>
        </div>
        <div className={`group-last ${tooSoon ? 'too-soon' : ''}`}>
          {ago === null ? 'Never posted' : `Last post ${ago === 0 ? 'today' : `${ago} day(s) ago`}`}
          {group.last_posted_by && <div className="hint">by {group.last_posted_by} · {group.post_count} total</div>}
        </div>
        <div className="actions">
          <button type="button" className="primary" onClick={() => { setOpen(true); generate(); }} disabled={busy}>
            {busy ? 'Writing...' : text ? 'Generate again' : 'Generate'}
          </button>
          <button type="button" onClick={copyAndOpen} disabled={!text.trim() || busy}>Copy &amp; open group</button>
          <button type="button" className="link-button" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Options'}</button>
        </div>
      </div>

      {open && (
        <div className="group-body">
          {group.kind === 'job' && (
            <p className="notice">Job groups often ban ads. Check the group rules before posting, or use this group to find businesses that are hiring.</p>
          )}
          <div className="group-options">
            <label>Goal
              <select value={options.goal} onChange={(e) => setOption('goal', e.target.value)}>
                {Object.entries(GOAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Tone
              <select value={options.tone} onChange={(e) => setOption('tone', e.target.value)}>
                {Object.entries(TONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Length
              <select value={options.length} onChange={(e) => setOption('length', e.target.value)}>
                {Object.entries(LENGTHS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Language
              <select value={options.language} onChange={(e) => setOption('language', e.target.value)}>
                <option value="auto">Same as group</option>
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </label>
            <label>Posted by
              <select
                value={options.poster === 'page' ? 'page' : `staff:${options.posterName}`}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'page') setOption('poster', 'page');
                  else {
                    setOption('poster', 'staff');
                    setOption('posterName', v.slice(6));
                  }
                }}
              >
                <option value="page">Workshop Page</option>
                {staffNames.map((n) => <option key={n} value={`staff:${n}`}>{n} (staff)</option>)}
              </select>
            </label>
          </div>
          <div className="field">
            <label>Extra instructions (optional)</label>
            <input value={options.extra} onChange={(e) => setOption('extra', e.target.value)} placeholder="e.g. mention our Christmas magnet designs" />
          </div>

          {error && <p className="ed-error">{error}</p>}
          <div className="field">
            <label>Post text (you can edit it)</label>
            <textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Click Generate to write a post with AI." />
          </div>
          {message && <p className="ed-ok">{message}</p>}
          {askPosted && (
            <div className="notice">
              Did you post it in the group?{' '}
              <button type="button" className="primary" onClick={confirmPosted}>Yes, mark as posted</button>{' '}
              <button type="button" onClick={() => setAskPosted(false)}>Not yet</button>
            </div>
          )}

          <details className="group-settings">
            <summary className="hint">Group settings</summary>
            <form action={updateGroup} className="group-options" style={{ marginTop: 10 }}>
              <input type="hidden" name="id" value={group.id} />
              <label>Name <input name="name" defaultValue={group.name} /></label>
              <label>Type
                <select name="kind" defaultValue={group.kind}>
                  {GROUP_KINDS.map((k) => <option key={k} value={k}>{GROUP_KIND_LABELS[k]}</option>)}
                </select>
              </label>
              <label>Language
                <select name="language" defaultValue={group.language}>
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label>Members <input name="members" type="number" defaultValue={group.members ?? ''} /></label>
              <label>Ads rule <input name="promo_rule" defaultValue={group.promo_rule ?? ''} placeholder="e.g. Only on Monday" /></label>
              <label>Notes <input name="notes" defaultValue={group.notes ?? ''} /></label>
              <div className="actions">
                <button type="submit">Save group</button>
              </div>
            </form>
            <form action={deleteGroup} style={{ marginTop: 8 }}>
              <input type="hidden" name="id" value={group.id} />
              <button
                type="submit"
                className="danger"
                onClick={(e) => { if (!confirm(`Remove "${group.name}" from the list?`)) e.preventDefault(); }}
              >
                Remove group
              </button>
            </form>
          </details>
        </div>
      )}
    </div>
  );
}