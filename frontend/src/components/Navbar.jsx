import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './Navbar.module.css';

const DEFAULT_LINKS = [
  { label: 'Gardens', href: '/gardens' },
  { label: 'Topics',  href: '/topics' },
  { label: 'About',   href: '/about' },
];

export default function Navbar({ session, onAuthClick, onLogoClick, gardenTopics, gardenUsername, activeTopic, onTopicClick }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // Are we on a garden page?
  const isGardenPage = gardenTopics && gardenTopics.length > 0;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>

        {/* Left — always show brand first */}
        <ul className={styles.leftLinks}>
          {/* Brand tab */}
          <li>
            <a
              href="/"
              onClick={onLogoClick ? (e) => { e.preventDefault(); onLogoClick(); } : undefined}
              className={`${styles.link} ${styles.primary}`}
            >
              Leaflet
            </a>
          </li>

          {/* Garden topics OR default nav links */}
          {isGardenPage ? (
            [gardenUsername, ...gardenTopics].map(item => (
              <li key={item}>
                <button
                  className={`${styles.link} ${activeTopic === item ? styles.topicActive : ''}`}
                  onClick={() => onTopicClick(item)}
                >
                  {item}
                </button>
              </li>
            ))
          ) : (
            DEFAULT_LINKS.map(link => (
              <li key={link.label}>
                <a href={link.href} className={styles.link}>{link.label}</a>
              </li>
            ))
          )}
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
                <a href="https://github.com/mounikb/leaflet.me"
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