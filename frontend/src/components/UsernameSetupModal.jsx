import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './UsernameSetupModal.module.css';
import Icon from './Icons';

function validate(username) {
  if (!username) return null;
  if (username.length < 3) return 'At least 3 characters.';
  if (username.length > 20) return 'Max 20 characters.';
  if (!/^[a-z0-9-]+$/.test(username)) return 'Only lowercase letters, numbers, hyphens.';
  if (username.startsWith('-') || username.endsWith('-')) return 'Cannot start or end with a hyphen.';
  return null;
}

export default function UsernameSetupModal({ session, onComplete }) {
  const [username, setUsername] = useState(
    // Pre-fill from Google name if available
    session?.user?.user_metadata?.full_name
      ?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20)
    || ''
  );
  const [status, setStatus] = useState(null); // null | checking | available | taken | invalid
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const debounce = useRef(null);

  // Clear pending debounce on unmount to avoid setState on unmounted component
  useEffect(() => () => clearTimeout(debounce.current), []);

  function handleChange(e) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setUsername(val);
    check(val);
  }

  function check(val) {
    setStatus(null); setMsg('');
    if (!val) return;
    const err = validate(val);
    if (err) { setStatus('invalid'); setMsg(err); return; }
    setStatus('checking');
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('username').eq('username', val).maybeSingle();
      if (data) { setStatus('taken'); setMsg('Already taken.'); }
      else { setStatus('available'); setMsg('Looks good!'); }
    }, 500);
  }

  async function handleSave() {
    const err = validate(username);
    if (err) { setError(err); return; }
    if (status === 'taken') { setError('Username is taken.'); return; }
    if (status === 'checking') { setError('Please wait...'); return; }
    setSaving(true);
    // Update user metadata
    await supabase.auth.updateUser({ data: { username } });
    // Upsert profile
    // Only set username — onboarding will set onboarded: true when complete
    await supabase.from('profiles').upsert({ id: session.user.id, username });
    setSaving(false);
    onComplete(username);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}><Icon name="seedling" circle size={24} /></div>
        <h2 className={styles.title}>Choose your username</h2>
        <p className={styles.sub}>
          This will be your garden address:<br />
          <strong>leaflet.me/{username || 'yourname'}</strong>
        </p>

        <div className={styles.inputWrap}>
          <span className={styles.prefix}>leaflet.me/</span>
          <input
            className={styles.input}
            value={username}
            onChange={handleChange}
            placeholder="yourname"
            autoFocus
          />
        </div>

        <div className={styles.statusRow}>
          {status === 'checking' && <span className={styles.checking}>Checking...</span>}
          {status === 'available' && <span className={styles.available}><Icon name="check" size={12} /> {msg}</span>}
          {status === 'taken' && <span className={styles.taken}>✕ {msg}</span>}
          {status === 'invalid' && <span className={styles.taken}>{msg}</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.btn}
          onClick={handleSave}
          disabled={saving || status !== 'available'}
        >
          {saving ? 'Saving...' : 'Claim my garden →'}
        </button>
      </div>
    </div>
  );
}