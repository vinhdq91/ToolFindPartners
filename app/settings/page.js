import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSettings, saveSettings, SETTING_KEYS } from '../../lib/settings';

async function save(formData) {
  'use server';
  const text = (name) => String(formData.get(name) ?? '').trim();
  await saveSettings({
    [SETTING_KEYS.workshopInfo]: text('workshop_info'),
    [SETTING_KEYS.landingUrl]: text('landing_url'),
    [SETTING_KEYS.staffNames]: text('staff_names'),
  });
  revalidatePath('/groups');
  redirect('/settings?saved=1');
}

export default async function SettingsPage({ searchParams }) {
  const { saved } = await searchParams;
  const settings = await getSettings();

  return (
    <>
      <h1>Settings</h1>
      {saved && <p className="notice ok">Settings saved.</p>}

      <form action={save} className="card" style={{ maxWidth: 820 }}>
        <div className="field">
          <label>About our workshop (the AI only uses these facts when writing posts)</label>
          <textarea
            name="workshop_info"
            rows={14}
            defaultValue={settings.workshopInfo}
            placeholder={`Workshop name: ...
Address: ..., Hoi An
Zalo / phone: ...
What we make: custom photo magnets from guests' own travel photos, ready in ... minutes
Price for guests: ...
For partners: gift orders at ... / referral: we share ...% of each order
Free sample for partners: yes/no`}
          />
          <p className="hint">Write real facts only. If a price or commission is not here, the AI will not mention one.</p>
        </div>

        <div className="field">
          <label>Main landing page link (added to posts, with a tag to see which group sent visitors)</label>
          <input name="landing_url" defaultValue={settings.landingUrl} placeholder="https://your-app.vercel.app/p/workshop" />
        </div>

        <div className="field">
          <label>Staff who post (one name per line)</label>
          <textarea name="staff_names" rows={4} defaultValue={settings.staffNames.join('\n')} placeholder={'Vinh\nLan\nMinh'} />
        </div>

        <button type="submit" className="primary">Save settings</button>
      </form>
    </>
  );
}