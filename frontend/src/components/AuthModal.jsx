import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './AuthModal.module.css';

// Human-readable Supabase error messages
function friendlyError(msg) {
  if (!msg) return 'Something went wrong. Please try again.';
  if (msg.includes('already registered') || msg.includes('User already registered'))
    return 'An account with this email already exists. Try signing in instead.';
  if (msg.includes('Invalid login credentials'))
    return 'Wrong email or password. Please try again.';
  if (msg.includes('Email not confirmed'))
    return 'Please verify your email before signing in. Check your inbox.';
  if (msg.includes('Password should be at least'))
    return 'Password must be at least 6 characters.';
  if (msg.includes('Unable to validate email'))
    return 'Please enter a valid email address.';
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Too many attempts. Please wait a minute and try again.';
  return msg;
}

// Username rules
function validateUsername(username) {
  if (!username) return null;
  if (username.length < 3) return 'At least 3 characters required.';
  if (username.length > 20) return 'Max 20 characters.';
  if (!/^[a-z0-9-]+$/.test(username)) return 'Only lowercase letters, numbers, and hyphens.';
  if (username.startsWith('-') || username.endsWith('-')) return 'Cannot start or end with a hyphen.';
  return null;
}

export default function AuthModal({ onClose }) {
  const [tab, setTab]       = useState('signup');
  const [form, setForm]     = useState({ username: '', email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameMsg, setUsernameMsg]       = useState('');
  const debounceRef = useRef(null);

  // Clear pending debounce on unmount to avoid setState on unmounted component
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function handleChange(e) {
    const { name, value } = e.target;
    // Auto lowercase username
    const val = name === 'username' ? value.toLowerCase() : value;
    setForm(f => ({ ...f, [name]: val }));
    setMessage(null);
    if (name === 'username') checkUsername(val);
  }

  function checkUsername(val) {
    setUsernameStatus(null);
    setUsernameMsg('');
    if (!val) return;

    const err = validateUsername(val);
    if (err) { setUsernameStatus('invalid'); setUsernameMsg(err); return; }

    setUsernameStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', val)
        .maybeSingle();
      if (data) {
        setUsernameStatus('taken');
        setUsernameMsg('This username is already taken.');
      } else {
        setUsernameStatus('available');
        setUsernameMsg('Looks good!');
      }
    }, 500);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    if (!form.username.trim()) { setMessage({ type: 'error', text: 'Please choose a username.' }); return; }
    const formatErr = validateUsername(form.username);
    if (formatErr) { setMessage({ type: 'error', text: formatErr }); return; }
    if (usernameStatus === 'taken') { setMessage({ type: 'error', text: 'That username is taken. Please choose another.' }); return; }
    if (usernameStatus === 'checking') { setMessage({ type: 'error', text: 'Please wait while we check your username.' }); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { username: form.username },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: friendlyError(error.message) });
    } else {
      setMessage({ type: 'success', text: `We've sent a verification email to ${form.email}. Check your inbox!` });
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: friendlyError(error.message) });
    } else {
      onClose();
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { setMessage({ type: 'error', text: friendlyError(error.message) }); setLoading(false); }
  }

  const usernameIndicator = () => {
    if (!form.username) return null;
    if (usernameStatus === 'checking') return <span className={styles.usernameChecking}>Checking...</span>;
    if (usernameStatus === 'available') return <span className={styles.usernameAvailable}>✓ {usernameMsg}</span>;
    if (usernameStatus === 'taken') return <span className={styles.usernameTaken}>✕ {usernameMsg}</span>;
    if (usernameStatus === 'invalid') return <span className={styles.usernameTaken}>{usernameMsg}</span>;
    return null;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <div className={styles.logo}>🌸 Leaflet</div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'signup' ? styles.active : ''}`}
            onClick={() => { setTab('signup'); setMessage(null); }}>Create account</button>
          <button className={`${styles.tab} ${tab === 'signin' ? styles.active : ''}`}
            onClick={() => { setTab('signin'); setMessage(null); }}>Sign in</button>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} />
          Continue with Google
        </button>

        <div className={styles.divider}><span>or</span></div>

        <form onSubmit={tab === 'signup' ? handleSignUp : handleSignIn}>
          {tab === 'signup' && (
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <div className={`${styles.inputWrap} ${usernameStatus === 'taken' || usernameStatus === 'invalid' ? styles.inputError : ''} ${usernameStatus === 'available' ? styles.inputValid : ''}`}>
                <span className={styles.prefix}>leaflet.me/</span>
                <input
                  className={styles.input}
                  name="username"
                  type="text"
                  placeholder="yourname"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="off"
                  maxLength={20}
                  required
                />
              </div>
              <div className={styles.usernameHint}>
                {usernameIndicator() || <span className={styles.usernameRule}>3–20 chars, letters, numbers, hyphens only</span>}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} name="email" type="email"
              placeholder="you@example.com" value={form.email} onChange={handleChange} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input className={styles.input} name="password" type="password"
              placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={form.password} onChange={handleChange} required />
          </div>

          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>
          )}

          <button className={styles.submitBtn} type="submit" disabled={loading || (tab === 'signup' && usernameStatus === 'taken')}>
            {loading ? 'Please wait...' : tab === 'signup' ? 'Plant my garden 🌱' : 'Sign in →'}
          </button>
        </form>

        <p className={styles.switch}>
          {tab === 'signup' ? 'Already have a garden? ' : "Don't have an account? "}
          <button className={styles.switchBtn}
            onClick={() => { setTab(tab === 'signup' ? 'signin' : 'signup'); setMessage(null); }}>
            {tab === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}