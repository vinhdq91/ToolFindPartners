'use client';

// Upload photos for a partner. Each photo is shrunk in the browser first,
// then sent on its own, so uploads stay under Vercel's 4.5 MB limit.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImage, tooBig } from '../../../lib/compress';
import { uploadPhotos } from './photo-actions';

export default function PhotoUploader({ partnerId }) {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0); // changing it empties the file box

  async function upload() {
    if (!files.length) return;
    setBusy(true);
    let done = 0;
    const problems = [];
    for (const original of files) {
      setStatus(`Uploading ${done + 1} of ${files.length}...`);
      try {
        const file = await compressImage(original);
        if (tooBig(file)) {
          problems.push(`${original.name} is too large`);
          continue;
        }
        const fd = new FormData();
        fd.append('id', partnerId);
        fd.append('photos', file);
        await uploadPhotos(fd);
        done++;
      } catch (err) {
        problems.push(`${original.name}: ${err.message}`);
      }
    }
    setBusy(false);
    setFiles([]);
    setInputKey((k) => k + 1);
    setStatus(problems.length ? `Uploaded ${done}. Problems: ${problems.join('; ')}` : `Uploaded ${done} photo(s).`);
    router.refresh();
  }

  return (
    <div className="actions">
      <input
        key={inputKey}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => {
          setFiles([...e.target.files]);
          setStatus('');
        }}
      />
      <button type="button" onClick={upload} disabled={busy || !files.length}>
        {busy ? 'Uploading...' : 'Upload photos'}
      </button>
      {status && <span className="hint">{status}</span>}
    </div>
  );
}