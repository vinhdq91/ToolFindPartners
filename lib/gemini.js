// Writes Facebook group posts with Google's Gemini API (free tier).
// Needs GEMINI_API_KEY in .env.local (and in Vercel settings).
// GEMINI_MODEL is optional: copy the exact model name from Google AI Studio if the default stops working.

const DEFAULT_MODEL = 'gemini-3.7-flash';

export const GOALS = {
  partner_gift: 'Invite businesses to order custom photo magnets as gifts for their guests (welcome gift, thank-you gift, tour souvenir).',
  partner_referral: 'Invite businesses to introduce their guests to the workshop and share the profit from those orders.',
  partner_both: 'Invite businesses to partner in two ways: magnets as guest gifts, or referring guests and sharing profit.',
  story: 'Share a short, real-feeling moment from the workshop (how a guest photo became a magnet). No hard selling, one soft line about partnering at the end.',
  new_experience: 'Explain how photo magnets add a new, personal experience to tour programs and hotel services in Hoi An.',
  question: 'Start a useful discussion for hospitality businesses (e.g. what small gifts guests remember), and mention the workshop naturally once.',
};

import { TONES, LENGTHS } from './gemini-options';

function buildPrompts({ group, options, settings, recentPosts }) {
  const language = options.language === 'en' || (options.language === 'auto' && group.language === 'en') ? 'English' : 'Vietnamese';
  const asPage = options.poster === 'page';
  const link = settings.landingUrl
    ? `${settings.landingUrl}${settings.landingUrl.includes('?') ? '&' : '?'}src=${encodeURIComponent('fb-' + group.id)}`
    : '';

  const system = `You write Facebook group posts for a custom photo magnet workshop in Hoi An, Vietnam.
The goal is to find business partners: hotels, homestays, tour companies, restaurants, cafes, spas, travel agents.

Facts about the workshop (the ONLY facts you may use; never invent prices, discounts, commission rates,
numbers of customers, awards or reviews):
<workshop>
${settings.workshopInfo || 'A workshop in Hoi An that prints guests\' own travel photos as custom fridge magnets.'}
</workshop>

Rules:
- Write in ${language}. ${language === 'Vietnamese' ? 'Natural, polite Vietnamese as people really write on Facebook (anh/chị, mình), correct spelling with full diacritics.' : 'Natural, simple English.'}
- ${asPage
    ? 'The post is written by the workshop\'s Facebook Page: speak as "we" / "bên mình".'
    : `The post is written by ${options.posterName || 'a staff member'}, who works at the workshop. Speak in first person and say openly that you work at the workshop. Never pretend to be a customer or an outsider.`}
- Be honest and specific. No fake urgency, no "100% guaranteed", no ALL CAPS, at most 3 emojis, at most 2 hashtags.
- End with one easy next step (comment, inbox, or Zalo if the facts include a number).
${link ? `- Put this link once, on its own line near the end: ${link}` : '- Do not include any links.'}
- Return only the post text. No title, no quotes around it, no notes.`;

  const avoid = recentPosts.length
    ? `\n\nPosts already used in this group (write something clearly different in opening, structure and wording):\n${recentPosts
        .map((p, i) => `--- ${i + 1} ---\n${p.slice(0, 600)}`)
        .join('\n')}`
    : '';

  const user = `Facebook group: "${group.name}" (type: ${group.kind}${group.promo_rule ? `; group rule: ${group.promo_rule}` : ''}).
Goal: ${GOALS[options.goal] ?? GOALS.partner_both}
Tone: ${TONES[options.tone] ?? TONES.friendly}. Length: ${LENGTHS[options.length] ?? LENGTHS.medium}.
${options.extra ? `Extra instructions from our team: ${options.extra}` : ''}${avoid}`;

  return { system, user };
}

// Backup model, used when the main one is busy. Change it with GEMINI_FALLBACK_MODEL if needed.
const DEFAULT_FALLBACK = 'gemini-3.5-flash-lite';
const BUSY_CODES = [500, 503, 504]; // "high demand" / temporary server problems
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class BusyError extends Error {}

export async function generatePostText({ group, options, settings, recentPosts = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing in .env.local / Vercel settings.');
  const main = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL || DEFAULT_FALLBACK;
  const prompts = buildPrompts({ group, options, settings, recentPosts });

  // Main model: up to 3 tries (wait 2 s, then 5 s). Then the backup model: up to 2 tries.
  const plan = [
    [main, 0], [main, 2000], [main, 5000],
    ...(fallback && fallback !== main ? [[fallback, 0], [fallback, 3000]] : []),
  ];
  let busyError;
  for (const [model, wait] of plan) {
    if (wait) await sleep(wait);
    try {
      return await callGemini(apiKey, model, prompts);
    } catch (err) {
      if (err instanceof BusyError) {
        busyError = err;
        continue;
      }
      // The backup model may not exist on this account: report the main model's busy message instead
      if (model === fallback && busyError) break;
      throw err;
    }
  }
  throw new Error('Gemini is very busy right now (main and backup models). Please try again in a few minutes.');
}

async function callGemini(apiKey, model, { system, user }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 4096 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    if (BUSY_CODES.includes(res.status)) throw new BusyError(msg);
    if (res.status === 429) throw new Error('Gemini free limit reached. Wait a minute and try again.');
    if (res.status === 404) throw new Error(`Model "${model}" not found. Set GEMINI_MODEL to a model name from Google AI Studio.`);
    if (res.status === 400 || res.status === 403) throw new Error(`Gemini refused the request: ${msg}`);
    throw new Error(`Gemini error: ${msg}`);
  }

  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim();
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? 'unknown';
    throw new Error(`Gemini returned no text (reason: ${reason}). Try again.`);
  }
  return text.replace(/^["“]|["”]$/g, '').trim();
}

// Exported for testing
export { buildPrompts };