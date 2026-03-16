import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './Navbar.module.css';
import Icon from './Icons';
import ConfirmModal from './ConfirmModal';

const DEFAULT_LINKS = [
  { label: 'Gardens', href: '/gardens' },
  { label: 'About',   href: '/about' },
];

export default function Navbar({
  session, onAuthClick, onLogoClick, onDiscoverClick,
  gardenTopics, gardenUsername, activeTopic, onTopicClick,
  onDragModeToggle, dragMode, isOwnerGarden, onAboutClick
}) {
  const [scrolled, setScrolled]         = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
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
       
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);


  async function handleSignOut() {
    setShowSignOutConfirm(true);
    setMenuOpen(false);
    setMobileOpen(false);
  }

  async function confirmSignOut() {
    setShowSignOutConfirm(false);
    await supabase.auth.signOut();
  }

  const isGardenPage = gardenTopics && gardenTopics.length > 0;

  return (
    <>
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <nav className={styles.nav}>

        {/* Left */}
        <ul className={styles.leftLinks}>
          <li>
            <a href="/"
              onClick={(e) => { e.preventDefault(); onLogoClick?.(); }}
              className={styles.logoLink}
            >
              <img src="/leaflet-icon.png" alt="Leaflet" className={styles.logoIcon} />
              <span className={styles.logoText}>Leaflet</span>
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
                {link.label === 'Gardens' ? (
                  <button className={styles.link} onClick={onDiscoverClick}>{link.label}</button>
                ) : link.label === 'About' ? (
                  <button className={styles.link} onClick={onAboutClick}>{link.label}</button>
                ) : (
                  <a href={link.href} className={styles.link}>{link.label}</a>
                )}
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
                    onClick={() => { setMenuOpen(o => !o); }}
                    title="Garden settings"
                  >
                    <Icon name="settings" size={14} />
                    Customise
                  </button>

                  {menuOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>Your Garden</div>


                      <div className={styles.dropDivider} />

                      {/* Drag to reorder */}
                      <button
                        className={`${styles.dropItem} ${dragMode ? styles.dropItemActive : ''}`}
                        onClick={() => { onDragModeToggle?.(); setMenuOpen(false); }}
                      >
                        <Icon name="drag" size={14} />
                        <span className={styles.dropLabel}>
                          Reorder cards
                          <span className={styles.dropSub}>{dragMode ? 'Drag mode on — click to exit' : 'Drag cards to rearrange'}</span>
                        </span>
                        {dragMode && <span className={styles.activePill}>On</span>}
                      </button>

                      {/* Edit bio */}
                      <button className={styles.dropItem} onClick={() => { window.dispatchEvent(new CustomEvent('leaflet:editbio')); setMenuOpen(false); }}>
                        <Icon name="pencil" size={14} />
                        <span className={styles.dropLabel}>
                          Edit bio
                          <span className={styles.dropSub}>Update your intro text</span>
                        </span>
                      </button>

                      {/* Manage topics */}
                      <button className={styles.dropItem} onClick={() => { window.dispatchEvent(new CustomEvent('leaflet:edittopics')); setMenuOpen(false); }}>
                        <Icon name="leaf" size={14} />
                        <span className={styles.dropLabel}>
                          Manage topics
                          <span className={styles.dropSub}>Add or remove topics</span>
                        </span>
                      </button>

                      <div className={styles.dropDivider} />

                      {/* Sign out */}
                      <button className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={handleSignOut}>
                        <Icon name="signOut" size={14} />
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

        {/* Mobile hamburger */}
        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          {isGardenPage ? (
            [gardenUsername, ...gardenTopics].map(item => (
              <button key={item}
                className={`${styles.mobileLink} ${activeTopic === item ? styles.mobileLinkActive : ''}`}
                onClick={() => { onTopicClick(item); setMobileOpen(false); }}
              >{item}</button>
            ))
          ) : (
            <>
              <button className={styles.mobileLink} onClick={() => { onDiscoverClick?.(); setMobileOpen(false); }}>Gardens</button>
              <button className={styles.mobileLink} onClick={() => { onAboutClick?.(); setMobileOpen(false); }}>About</button>
            </>
          )}

          <div className={styles.mobileDivider} />

          {session ? (
            <>
              {isOwnerGarden && (
                <button className={styles.mobileLink} onClick={() => { setMenuOpen(true); setMobileOpen(false); }}>
                  ⚙ Customise garden
                </button>
              )}
              <button className={`${styles.mobileLink} ${styles.mobileSignOut}`} onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <button className={styles.mobileLink} onClick={() => { onAuthClick(); setMobileOpen(false); }}>
              Sign up / Sign in
            </button>
          )}
        </div>
      )}
    </header>

      {showSignOutConfirm && (
        <ConfirmModal
          title="Sign out of Leaflet?"
          message="You'll need to sign back in to access your garden."
          confirmLabel="Sign out"
          cancelLabel="Stay"
          danger
          onConfirm={confirmSignOut}
          onCancel={() => setShowSignOutConfirm(false)}
        />
      )}
    </>
  );
}