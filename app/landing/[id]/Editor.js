'use client';

// The landing page editor: sections on the left, live preview on the right.

import { useEffect, useState, useTransition } from 'react';
import LandingRender from '../../../components/LandingRender';
import { BLOCK_LABELS, BLOCK_FIELDS } from '../../../lib/landing';
import { saveLandingBlocks, uploadLandingImage } from '../actions';
import { compressImage, tooBig } from '../../../lib/compress';

// ---------- Small field components ----------

function TextField({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AreaField({ label, value, onChange, rows = 3 }) {
  return (
    <div className="field">
      <label>{label}</label>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function useUpload(pageId) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(files) {
    setBusy(true);
    setError('');
    const urls = [];
    for (const original of files) {
      const file = await compressImage(original);
      if (tooBig(file)) {
        setError(`"${original.name}" is too large. Please use a photo under 4 MB.`);
        continue;
      }
      const fd = new FormData();
      fd.append('page_id', pageId);
      fd.append('file', file);
      const result = await uploadLandingImage(fd);
      if (result?.error) setError(result.error);
      else if (result?.url) urls.push(result.url);
    }
    setBusy(false);
    return urls;
  }
  return { upload, busy, error };
}

function ImageField({ label, value, onChange, pageId }) {
  const { upload, busy, error } = useUpload(pageId);
  return (
    <div className="field">
      <label>{label}</label>
      {value ? (
        <div className="ed-image">
          <img src={value} alt="" referrerPolicy="no-referrer" />
          <button type="button" onClick={() => onChange('')}>Remove</button>
        </div>
      ) : null}
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={async (e) => {
          const [url] = await upload([...e.target.files]);
          e.target.value = '';
          if (url) onChange(url);
        }}
      />
      {busy && <p className="hint">Uploading...</p>}
      {error && <p className="ed-error">{error}</p>}
    </div>
  );
}

function ImagesField({ label, value, onChange, pageId }) {
  const images = value ?? [];
  const { upload, busy, error } = useUpload(pageId);
  const move = (i, step) => {
    const j = i + step;
    if (j < 0 || j >= images.length) return;
    const copy = [...images];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  return (
    <div className="field">
      <label>{label} ({images.length})</label>
      {images.length > 0 && (
        <div className="ed-images">
          {images.map((src, i) => (
            <div key={src} className="ed-images-item">
              <img src={src} alt="" referrerPolicy="no-referrer" />
              <div className="ed-mini-actions">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left">←</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move right">→</button>
                <button type="button" onClick={() => onChange(images.filter((x) => x !== src))} aria-label="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={async (e) => {
          const urls = await upload([...e.target.files]);
          e.target.value = '';
          if (urls.length) onChange([...images, ...urls]);
        }}
      />
      {busy && <p className="hint">Uploading...</p>}
      {error && <p className="ed-error">{error}</p>}
    </div>
  );
}

function ListField({ field, value, onChange }) {
  const items = value ?? [];
  const setItem = (i, key, v) => onChange(items.map((it, n) => (n === i ? { ...it, [key]: v } : it)));
  const move = (i, step) => {
    const j = i + step;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const empty = Object.fromEntries(field.fields.map((f) => [f.key, '']));

  return (
    <div className="field">
      <label>{field.label}</label>
      {items.map((item, i) => (
        <div key={i} className="ed-list-item">
          <div className="ed-list-head">
            <strong>{field.itemLabel} {i + 1}</strong>
            <div className="ed-mini-actions">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              <button type="button" onClick={() => onChange(items.filter((_, n) => n !== i))} aria-label="Remove">✕</button>
            </div>
          </div>
          {field.fields.map((f) =>
            f.type === 'textarea' ? (
              <AreaField key={f.key} label={f.label} rows={f.rows} value={item[f.key]} onChange={(v) => setItem(i, f.key, v)} />
            ) : (
              <TextField key={f.key} label={f.label} value={item[f.key]} onChange={(v) => setItem(i, f.key, v)} />
            )
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { ...empty }])}>+ Add {field.itemLabel.toLowerCase()}</button>
    </div>
  );
}

// ---------- The editor ----------

export default function Editor({ page, partnerName }) {
  const [blocks, setBlocks] = useState(page.blocks ?? []);
  const [openId, setOpenId] = useState(page.blocks?.[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, startSaving] = useTransition();

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    const warn = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function changeBlocks(updater) {
    setBlocks(updater);
    setDirty(true);
    setMessage('');
  }
  const setField = (id, key, value) =>
    changeBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b)));
  const toggleVisible = (id) => changeBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b)));
  const moveBlock = (i, step) =>
    changeBlocks((bs) => {
      const j = i + step;
      if (j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  function save() {
    startSaving(async () => {
      const result = await saveLandingBlocks(page.id, blocks);
      if (result?.error) setMessage('Not saved: ' + result.error);
      else {
        setDirty(false);
        setMessage('Saved');
      }
    });
  }

  return (
    <div className="ed-layout">
      <div className="ed-panel">
        <div className="ed-savebar">
          <button type="button" className="primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving...' : dirty ? 'Save changes' : 'All saved'}
          </button>
          {message && <span className={message === 'Saved' ? 'ed-ok' : 'ed-error'}>{message}</span>}
          {dirty && !message && <span className="hint">You have unsaved changes</span>}
        </div>

        {blocks.map((b, i) => {
          const open = openId === b.id;
          const fields = BLOCK_FIELDS[b.type] ?? [];
          return (
            <div key={b.id} className={`ed-block ${b.visible ? '' : 'is-hidden'} ${open ? 'is-open' : ''}`}>
              <div className="ed-block-head">
                <button type="button" className="ed-block-title" onClick={() => setOpenId(open ? null : b.id)}>
                  <span>{open ? '▾' : '▸'}</span> {BLOCK_LABELS[b.type] ?? b.type}
                  {!b.visible && <span className="hint"> (hidden)</span>}
                </button>
                <div className="ed-mini-actions">
                  <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label="Move section up">↑</button>
                  <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} aria-label="Move section down">↓</button>
                  <button type="button" onClick={() => toggleVisible(b.id)}>{b.visible ? 'Hide' : 'Show'}</button>
                </div>
              </div>

              {open && (
                <div className="ed-block-body">
                  {fields.map((f) => {
                    const value = b.data?.[f.key];
                    const onChange = (v) => setField(b.id, f.key, v);
                    switch (f.type) {
                      case 'textarea': return <AreaField key={f.key} label={f.label} rows={f.rows} value={value} onChange={onChange} />;
                      case 'image': return <ImageField key={f.key} label={f.label} value={value} onChange={onChange} pageId={page.id} />;
                      case 'images': return <ImagesField key={f.key} label={f.label} value={value} onChange={onChange} pageId={page.id} />;
                      case 'list': return <ListField key={f.key} field={f} value={value} onChange={onChange} />;
                      default: return <TextField key={f.key} label={f.label} value={value} onChange={onChange} />;
                    }
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="ed-preview">
        <div className="ed-preview-bar">Live preview</div>
        <div className="ed-preview-frame">
          <LandingRender blocks={blocks} theme={page.theme} language={page.language} partnerName={partnerName} preview />
        </div>
      </div>
    </div>
  );
}