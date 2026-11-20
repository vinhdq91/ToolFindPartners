'use client';

import { useState } from 'react';

export default function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Could not copy. Please select the text and copy it by hand.');
    }
  }

  return (
    <button type="button" onClick={copy} disabled={!text}>
      {copied ? 'Copied!' : label}
    </button>
  );
}