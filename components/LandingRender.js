// Draws a landing page from its blocks and theme.
// Used by the editor preview (part 2) and the public page /p/... (part 3), so both look the same.

const FONT_STACKS = {
  modern: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  classic: 'Georgia, Cambria, "Times New Roman", Times, serif',
  friendly: '"Trebuchet MS", "Segoe UI", Tahoma, Verdana, sans-serif',
};

const LABELS = {
  en: { preparedFor: 'Prepared for', call: 'Phone', email: 'Email', map: 'Open in Google Maps', noImages: 'Add photos to this section in the editor.' },
  vi: { preparedFor: 'Dành riêng cho', call: 'Điện thoại', email: 'Email', map: 'Xem trên Google Maps', noImages: 'Thêm ảnh cho phần này trong trình chỉnh sửa.' },
};

const digits = (s) => String(s ?? '').replace(/\D/g, '');
const intl = (s) => {
  const d = digits(s);
  return d.startsWith('0') ? '84' + d.slice(1) : d; // Vietnamese local number -> +84
};

function Img({ src, className }) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className={className} referrerPolicy="no-referrer" />;
}

function Hero({ d, t }) {
  return (
    <section className={`lp-hero ${d.image ? 'has-image' : ''}`}>
      {d.image && <Img src={d.image} className="lp-hero-bg" />}
      <div className="lp-hero-inner">
        {d.headline && <h1>{d.headline}</h1>}
        {d.text && <p>{d.text}</p>}
        {d.button && <a href="#contact" className="lp-button">{d.button}</a>}
      </div>
    </section>
  );
}

function About({ d }) {
  return (
    <section className={`lp-section lp-about ${d.image ? 'has-image' : ''}`}>
      <div className="lp-about-text">
        {d.heading && <h2>{d.heading}</h2>}
        {d.text && <p className="lp-pre">{d.text}</p>}
      </div>
      {d.image && <Img src={d.image} className="lp-about-img" />}
    </section>
  );
}

function Cards({ d, numbered, className }) {
  const items = (d.items ?? []).filter((i) => i.title || i.text);
  return (
    <section className={`lp-section ${className}`}>
      {d.heading && <h2>{d.heading}</h2>}
      <div className="lp-cards">
        {items.map((item, n) => (
          <div className="lp-card" key={n}>
            {numbered && <span className="lp-num">{n + 1}</span>}
            {item.title && <h3>{item.title}</h3>}
            {item.text && <p className="lp-pre">{item.text}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Gallery({ d, t, preview }) {
  const images = (d.images ?? []).filter(Boolean);
  if (!images.length && !preview) return null;
  return (
    <section className="lp-section lp-gallery">
      {d.heading && <h2>{d.heading}</h2>}
      {images.length ? (
        <div className="lp-gallery-grid">
          {images.map((src) => <Img key={src} src={src} />)}
        </div>
      ) : (
        <p className="lp-placeholder">{t.noImages}</p>
      )}
    </section>
  );
}

function Prices({ d }) {
  const items = (d.items ?? []).filter((i) => i.name || i.price);
  return (
    <section className="lp-section lp-prices">
      {d.heading && <h2>{d.heading}</h2>}
      <div className="lp-price-list">
        {items.map((item, n) => (
          <div className="lp-price" key={n}>
            <div>
              <div className="lp-price-name">{item.name}</div>
              {item.note && <div className="lp-price-note">{item.note}</div>}
            </div>
            <div className="lp-price-value">{item.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Reviews({ d }) {
  const items = (d.items ?? []).filter((i) => i.quote);
  return (
    <section className="lp-section lp-reviews">
      {d.heading && <h2>{d.heading}</h2>}
      <div className="lp-cards">
        {items.map((item, n) => (
          <figure className="lp-card lp-review" key={n}>
            <blockquote className="lp-pre">“{item.quote}”</blockquote>
            {item.author && <figcaption>— {item.author}</figcaption>}
          </figure>
        ))}
      </div>
    </section>
  );
}

function Contact({ d, t }) {
  const rows = [];
  if (d.phone) rows.push([t.call, d.phone, `tel:${d.phone.replace(/\s/g, '')}`]);
  if (d.zalo) rows.push(['Zalo', d.zalo, `https://zalo.me/${digits(d.zalo)}`]);
  if (d.whatsapp) rows.push(['WhatsApp', d.whatsapp, `https://wa.me/${intl(d.whatsapp)}`]);
  if (d.email) rows.push([t.email, d.email, `mailto:${d.email}`]);
  if (d.facebook) rows.push(['Facebook', d.facebook.replace(/^https?:\/\/(www\.)?/, ''), d.facebook]);

  return (
    <section className="lp-section lp-contact" id="contact">
      {d.heading && <h2>{d.heading}</h2>}
      {d.text && <p className="lp-pre">{d.text}</p>}
      <div className="lp-contact-list">
        {rows.map(([label, value, href]) => (
          <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="lp-contact-row">
            <span className="lp-contact-label">{label}</span>
            <span>{value}</span>
          </a>
        ))}
        {d.address && (
          <div className="lp-contact-row">
            <span className="lp-contact-label">📍</span>
            <span>{d.address}</span>
          </div>
        )}
      </div>
      {d.map_url && (
        <a href={d.map_url} target="_blank" rel="noreferrer" className="lp-button">{t.map}</a>
      )}
    </section>
  );
}

export default function LandingRender({ blocks = [], theme = {}, language = 'en', partnerName = null, preview = false }) {
  const t = LABELS[language] ?? LABELS.en;
  const style = {
    '--lp-c': theme.color || '#c2410c',
    '--lp-font': FONT_STACKS[theme.font] ?? FONT_STACKS.modern,
  };

  return (
    <div className="lp" style={style} lang={language}>
      {partnerName && (
        <div className="lp-for">
          {t.preparedFor} <strong>{partnerName}</strong>
        </div>
      )}
      {blocks
        .filter((b) => b.visible)
        .map((b) => {
          const d = b.data ?? {};
          switch (b.type) {
            case 'hero': return <Hero key={b.id} d={d} t={t} />;
            case 'about': return <About key={b.id} d={d} />;
            case 'steps': return <Cards key={b.id} d={d} numbered className="lp-steps" />;
            case 'gallery': return <Gallery key={b.id} d={d} t={t} preview={preview} />;
            case 'partners': return <Cards key={b.id} d={d} className="lp-partners" />;
            case 'prices': return <Prices key={b.id} d={d} />;
            case 'reviews': return <Reviews key={b.id} d={d} />;
            case 'contact': return <Contact key={b.id} d={d} t={t} />;
            default: return null;
          }
        })}
    </div>
  );
}