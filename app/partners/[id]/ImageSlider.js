'use client';

import { useState } from 'react';

export default function ImageSlider({ images }) {
  const [broken, setBroken] = useState([]);
  const [index, setIndex] = useState(0);

  const list = images.filter((url) => !broken.includes(url));
  if (list.length === 0) {
    return <div className="slider-empty">No images yet.</div>;
  }

  const i = Math.min(index, list.length - 1);
  const go = (step) => setIndex((i + step + list.length) % list.length);
  const markBroken = (url) => setBroken((b) => (b.includes(url) ? b : [...b, url]));

  return (
    <div className="slider">
      <div className="slider-main">
        <img
          src={list[i]}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => markBroken(list[i])}
        />
        {list.length > 1 && (
          <>
            <button type="button" className="slider-arrow left" onClick={() => go(-1)} aria-label="Previous image">‹</button>
            <button type="button" className="slider-arrow right" onClick={() => go(1)} aria-label="Next image">›</button>
            <span className="slider-count">{i + 1} / {list.length}</span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="slider-thumbs">
          {list.map((url, n) => (
            <img
              key={url}
              src={url}
              alt=""
              referrerPolicy="no-referrer"
              className={n === i ? 'active' : ''}
              onClick={() => setIndex(n)}
              onError={() => markBroken(url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}