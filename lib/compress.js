// Shrinks a photo in the browser before upload.
// Vercel accepts at most 4.5 MB per upload, and phone photos are often bigger.
// Photos become JPEG, at most 2000 px on the longest side. That is sharp enough
// for the website and the PDF, and usually 300 KB - 1 MB.

const MAX_SIDE = 2000;
const QUALITY = 0.85;
const LIMIT_BYTES = 4 * 1024 * 1024; // stay safely under Vercel's 4.5 MB

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This photo type cannot be read by the browser.'));
    };
    img.src = url;
  });
}

export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) return file;
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file; // keep as they are
  if (file.size < 700 * 1024 && file.type === 'image/jpeg') return file; // already small

  let loaded;
  try {
    loaded = await loadImage(file);
  } catch {
    return file; // e.g. some iPhone HEIC photos on Windows: upload as it is
  }
  const { img, url } = loaded;
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // transparent PNG parts become white, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

export function tooBig(file) {
  return file.size > LIMIT_BYTES;
}