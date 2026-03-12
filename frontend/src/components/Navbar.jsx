import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Leaflet', href: '/', primary: true },
  { label: 'Gardens',  href: '/gardens' },
  { label: 'Topics',   href: '/topics' },
  { label: 'About',    href: '/about' },
];

export default function Navbar({ session, onAuthClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>
        {/* Left tabs */}
        <ul className={styles.leftLinks}>
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`${styles.link} ${link.primary ? styles.primary : ''}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right — auth state */}
        <ul className={styles.rightLinks}>
          {session ? (
            <>
              <li>
                <span className={styles.userLabel}>
                  🌱 {session.user.user_metadata?.username || session.user.email}
                </span>
              </li>
              <li>
                <button className={styles.link} onClick={handleSignOut}>
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="https://github.com/mounikb/DigiOrchid"
                  className={styles.link}
                  target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <button className={`${styles.link} ${styles.signupBtn}`} onClick={onAuthClick}>
                  Sign up
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}