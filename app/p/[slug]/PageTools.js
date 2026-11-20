'use client';

// "Download PDF" button on the public page. It opens the browser's print window,
// where you choose "Save as PDF". With autoPrint, the window opens by itself
// after all photos have loaded.

import { useEffect } from 'react';

const LABEL = { en: 'Download PDF', vi: 'Tải PDF' };

function waitForImages() {
  const images = [...document.images].filter((img) => !img.complete);
  return Promise.all(
    images.map((img) => new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))
  );
}

export default function PageTools({ language = 'en', autoPrint = false }) {
  useEffect(() => {
    if (!autoPrint) return;
    let cancelled = false;
    waitForImages().then(() => {
      if (!cancelled) setTimeout(() => window.print(), 300);
    });
    return () => {
      cancelled = true;
    };
  }, [autoPrint]);

  return (
    <button type="button" className="pdf-button no-print" onClick={() => window.print()}>
      ⤓ {LABEL[language] ?? LABEL.en}
    </button>
  );
}