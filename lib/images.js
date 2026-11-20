// Finds the main photos on a partner's website (the same way link previews work).
// We only save the image links, not the image files.

const MAX_IMAGES = 8;
const TIMEOUT_MS = 12000;

const SKIP_WORDS = [
  'logo', 'icon', 'favicon', 'sprite', 'avatar', 'flag', 'pixel', 'spinner', 'loading',
  'placeholder', 'blank', 'badge', 'tripadvisor', 'booking', 'payment', 'visa', 'mastercard',
  'arrow', 'button', 'banner-ad', 'emoji', 'qr', 'map-marker', 'gravatar', 'facebook', 'instagram',
];
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)(\?|#|$)/i;

function absolute(src, base) {
  try {
    const u = new URL(src.trim().replace(/&amp;/g, '&'), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

function looksUseful(url) {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:')) return false;
  if (SKIP_WORDS.some((w) => lower.includes(w))) return false;
  if (/[-_](\d{1,2})x(\d{1,2})\./.test(lower)) return false; // tiny sizes like -32x32.png
  return true;
}

function metaImages(html) {
  const found = [];
  const re = /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]*>/gi;
  for (const tag of html.match(re) ?? []) {
    const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
    if (content) found.push(content);
  }
  return found;
}

function pageImages(html) {
  const found = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src =
      tag.match(/\sdata-(?:lazy-)?src=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\ssrc=["']([^"']+)["']/i)?.[1] ??
      tag.match(/\ssrcset=["']([^"'\s,]+)/i)?.[1];
    if (!src) continue;
    const width = Number(tag.match(/\swidth=["']?(\d+)/i)?.[1] ?? 0);
    if (width && width < 200) continue; // skip small images
    found.push(src);
  }
  // Background images in inline styles (common for big header photos)
  for (const m of html.matchAll(/background(?:-image)?\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    found.push(m[1]);
  }
  return found;
}

export async function findImages(siteUrl) {
  if (!siteUrl) return [];
  if (/facebook\.com|fb\.com|instagram\.com/i.test(siteUrl)) return []; // these need a login

  let html;
  let base = siteUrl;
  try {
    const res = await fetch(siteUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PartnerOutreach/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html')) return [];
    html = (await res.text()).slice(0, 1_000_000);
    base = res.url || siteUrl;
  } catch {
    return []; // site is down, slow, or blocks us
  }

  const urls = [];
  const seen = new Set();
  const push = (src, mustHaveExt) => {
    const url = absolute(src, base);
    if (!url || !looksUseful(url)) return;
    if (mustHaveExt && !IMAGE_EXT.test(url)) return;
    const key = url.replace(/[-_]\d{2,4}x\d{2,4}(?=\.)/, '').split('?')[0]; // same photo in other sizes
    if (seen.has(key)) return;
    seen.add(key);
    urls.push(url);
  };

  metaImages(html).forEach((src) => push(src, false)); // the site's own preview photo comes first
  pageImages(html).forEach((src) => push(src, true));
  return urls.slice(0, MAX_IMAGES);
}

// Runs a job for many items, a few at a time
export async function runInGroups(items, groupSize, worker) {
  let next = 0;
  async function runner() {
    while (next < items.length) await worker(items[next++]);
  }
  await Promise.all(Array.from({ length: Math.min(groupSize, items.length) }, runner));
}