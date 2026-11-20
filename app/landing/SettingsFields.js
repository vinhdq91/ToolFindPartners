// The settings fields shared by the "new page" form and the "edit page" form.
import { COLORS, FONTS, LANGUAGES, PAGE_STATUSES } from '../../lib/landing';

export default function SettingsFields({ page = {}, partners = [], showStatus = false, showLanguage = true }) {
  const theme = page.theme ?? {};
  return (
    <>
      <div className="field">
        <label>Page name *</label>
        <input name="title" required defaultValue={page.title ?? ''} placeholder="e.g. Workshop introduction" />
      </div>
      <div className="field">
        <label>Link name (letters, numbers and - only)</label>
        <input name="slug" defaultValue={page.slug ?? ''} placeholder="Leave empty to make it from the page name" />
        <p className="hint">The page address will be /p/{page.slug || 'link-name'}</p>
      </div>

      <div className="grid2">
        {showLanguage && (
          <div className="field">
            <label>Language</label>
            <select name="language" defaultValue={page.language ?? 'en'}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        )}
        <div className="field">
          <label>Made for one partner? (optional)</label>
          <select name="partner_id" defaultValue={page.partner_id ?? ''}>
            <option value="">No, a general page</option>
            {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Main color</label>
        <div className="color-choices">
          {COLORS.map((c, i) => (
            <label key={c.value} className="color-choice">
              <input
                type="radio"
                name="color"
                value={c.value}
                defaultChecked={theme.color ? theme.color === c.value : i === 0}
              />
              <span className="swatch" style={{ background: c.value }} />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Font style</label>
          <select name="font" defaultValue={theme.font ?? 'modern'}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        {showStatus && (
          <div className="field">
            <label>Status</label>
            <select name="status" defaultValue={page.status ?? 'draft'}>
              {PAGE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>
    </>
  );
}