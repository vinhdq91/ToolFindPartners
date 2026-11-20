'use client';

// Buttons for a landing page in the app: View, PDF, Copy link.

import { useState } from 'react';

export default function LinkButtons({ slug, status }) {
  const [copied, setCopied] = useState(false);
  const path = `/p/${slug}`;

  async function copy() {
    const url = window.location.origin + path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      prompt('Copy this link:', url);
    }
  }

  return (
    <>
      <a className="button" href={`${path}?preview=1`} target="_blank" rel="noreferrer">View</a>
      <a className="button" href={`${path}?preview=1&print=1`} target="_blank" rel="noreferrer">PDF</a>
      <button
        type="button"
        onClick={copy}
        title={status === 'published' ? 'Copy the link for partners' : 'Publish the page first, or partners will not be able to open it'}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </>
  );
}