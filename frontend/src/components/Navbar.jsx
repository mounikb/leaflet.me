import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './Navbar.module.css';

const DEFAULT_LINKS = [
  { label: 'Gardens', href: '/gardens' },
  { label: 'Topics',  href: '/topics' },
  { label: 'About',   href: '/about' },
];

const THEMES = [
  { id: 'default', label: 'Parchment', color: '#f5f0e8' },
  { id: 'dark',    label: 'Midnight',  color: '#1a1714' },
  { id: 'sage',    label: 'Sage',      color: '#e8ede6' },
  { id: 'rose',    label: 'Rose',      color: '#f5ece8' },
  { id: 'slate',   label: 'Slate',     color: '#e8ecef' },
];

export default function Navbar({
  session, onAuthClick, onLogoClick,
  gardenTopics, gardenUsername, activeTopic, onTopicClick,
  onDragModeToggle, dragMode, isOwnerGarden
}) {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [showThemes, setShowThemes]     = useState(false);
  const [activeTheme, setActiveTheme]   = useState(() => localStorage.getItem('leaflet-theme') || 'default');
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowThemes(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('leaflet-theme', activeTheme);
  }, [activeTheme]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function selectTheme(id) {
    setActiveTheme(id);
    setShowThemes(false);
  }

  const isGardenPage = gardenTopics && gardenTopics.length > 0;

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>

        {/* Left */}
        <ul className={styles.leftLinks}>
          <li>
            <a href="/"
              onClick={onLogoClick ? (e) => { e.preventDefault(); onLogoClick(); } : undefined}
              className={`${styles.link} ${styles.primary}`}
            >
              Leaflet
            </a>
          </li>

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

        {/* Right */}
        <ul className={styles.rightLinks}>
          {session ? (
            <>
              {/* Settings menu — only on owner's garden */}
              {isOwnerGarden && (
                <li className={styles.menuWrap} ref={menuRef}>
                  <button
                    className={`${styles.settingsBtn} ${menuOpen ? styles.settingsBtnActive : ''}`}
                    onClick={() => { setMenuOpen(o => !o); setShowThemes(false); }}
                    title="Garden settings"
                  >
                    <span className={styles.settingsIcon}>⚙</span>
                    Customise
                  </button>

                  {menuOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>Your Garden</div>

                      {/* Theme picker */}
                      <button className={styles.dropItem} onClick={() => setShowThemes(o => !o)}>
                        <span className={styles.dropIcon}>🎨</span>
                        <span className={styles.dropLabel}>
                          Theme
                          <span className={styles.dropSub}>
                            {THEMES.find(t => t.id === activeTheme)?.label}
                          </span>
                        </span>
                        <span className={styles.dropChevron}>{showThemes ? '▲' : '▼'}</span>
                      </button>

                      {showThemes && (
                        <div className={styles.themeGrid}>
                          {THEMES.map(t => (
                            <button
                              key={t.id}
                              className={`${styles.themeDot} ${activeTheme === t.id ? styles.themeDotActive : ''}`}
                              style={{ background: t.color }}
                              onClick={() => selectTheme(t.id)}
                              title={t.label}
                            />
                          ))}
                        </div>
                      )}

                      <div className={styles.dropDivider} />

                      {/* Drag to reorder */}
                      <button
                        className={`${styles.dropItem} ${dragMode ? styles.dropItemActive : ''}`}
                        onClick={() => { onDragModeToggle?.(); setMenuOpen(false); }}
                      >
                        <span className={styles.dropIcon}>⠿</span>
                        <span className={styles.dropLabel}>
                          Reorder cards
                          <span className={styles.dropSub}>{dragMode ? 'Drag mode on — click to exit' : 'Drag cards to rearrange'}</span>
                        </span>
                        {dragMode && <span className={styles.activePill}>On</span>}
                      </button>

                      {/* Edit bio */}
                      <button className={styles.dropItem} onClick={() => { window.dispatchEvent(new CustomEvent('leaflet:editbio')); setMenuOpen(false); }}>
                        <span className={styles.dropIcon}>✏️</span>
                        <span className={styles.dropLabel}>
                          Edit bio
                          <span className={styles.dropSub}>Update your intro text</span>
                        </span>
                      </button>

                      {/* Manage topics */}
                      <button className={styles.dropItem} onClick={() => { window.dispatchEvent(new CustomEvent('leaflet:edittopics')); setMenuOpen(false); }}>
                        <span className={styles.dropIcon}>🌿</span>
                        <span className={styles.dropLabel}>
                          Manage topics
                          <span className={styles.dropSub}>Add or remove topics</span>
                        </span>
                      </button>

                      <div className={styles.dropDivider} />

                      {/* Sign out */}
                      <button className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={handleSignOut}>
                        <span className={styles.dropIcon}>→</span>
                        <span className={styles.dropLabel}>Sign out</span>
                      </button>
                    </div>
                  )}
                </li>
              )}

              {/* Not owner — just sign out */}
              {!isOwnerGarden && (
                <li>
                  <button className={`${styles.link} ${styles.signoutBtn}`} onClick={handleSignOut}>
                    Sign out
                  </button>
                </li>
              )}
            </>
          ) : (
            <>
              <li>
                <a href="https://github.com/mounikb/leaflet.me"
                  className={styles.link} target="_blank" rel="noreferrer">
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