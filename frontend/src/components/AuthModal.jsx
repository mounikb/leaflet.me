import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './AuthModal.module.css';

export default function AuthModal({ onClose }) {
  const [tab, setTab] = useState('signup'); // 'signup' | 'signin'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setMessage(null);
  }

  // ── Sign Up ──────────────────────────────────────────
  async function handleSignUp(e) {
    e.preventDefault();
    if (!form.username.trim()) {
      setMessage({ type: 'error', text: 'Please choose a username.' });
      return;
    }
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
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({
        type: 'success',
        text: `We've sent a verification email to ${form.email}. Please check your inbox!`,
      });
    }
  }

  // ── Sign In ──────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      onClose();
    }
  }

  // ── Google OAuth ─────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
    // On success Supabase redirects automatically
  }

  return (
    // Backdrop
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Close button */}
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {/* Logo */}
        <div className={styles.logo}>🌸 Leaflet</div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'signup' ? styles.active : ''}`}
            onClick={() => { setTab('signup'); setMessage(null); }}
          >
            Create account
          </button>
          <button
            className={`${styles.tab} ${tab === 'signin' ? styles.active : ''}`}
            onClick={() => { setTab('signin'); setMessage(null); }}
          >
            Sign in
          </button>
        </div>

        {/* Google button */}
        <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            width={18} height={18}
          />
          Continue with Google
        </button>

        {/* Divider */}
        <div className={styles.divider}><span>or</span></div>

        {/* Form */}
        <form onSubmit={tab === 'signup' ? handleSignUp : handleSignIn}>

          {tab === 'signup' && (
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <div className={styles.inputWrap}>
                <span className={styles.prefix}>leaflet.me/</span>
                <input
                  className={styles.input}
                  name="username"
                  type="text"
                  placeholder="yourname"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              name="password"
              type="password"
              placeholder={tab === 'signup' ? 'Min. 6 characters' : '••••••••'}
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : tab === 'signup'
              ? 'Plant my garden 🌱'
              : 'Sign in →'
            }
          </button>
        </form>

        {/* Switch tab hint */}
        <p className={styles.switch}>
          {tab === 'signup' ? 'Already have a garden? ' : "Don't have an account? "}
          <button
            className={styles.switchBtn}
            onClick={() => { setTab(tab === 'signup' ? 'signin' : 'signup'); setMessage(null); }}
          >
            {tab === 'signup' ? 'Sign in' : 'Create one'}
          </button>
        </p>

      </div>
    </div>
  );
}