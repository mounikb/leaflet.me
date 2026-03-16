import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './OnboardingModal.module.css';
import Icon from './Icons';

const DEFAULT_TOPICS = [
  'Writing', 'Photography', 'Reading', 'Code',
  'Art', 'Cooking', 'Travel', 'Music'
];

export default function OnboardingModal({ session, onComplete, onSkip }) {
  const [step, setStep] = useState(1); // 1 = intro, 2 = topics, 3 = about
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [customTopic, setCustomTopic] = useState('');
  const [customTopicError, setCustomTopicError] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleTopic(topic) {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) return prev.filter(t => t !== topic);
      if (prev.length >= 7) return prev; // max 7
      return [...prev, topic];
    });
  }

  function addCustomTopic() {
    const t = customTopic.trim();
    if (!t) return;
    const normalized = t.toLowerCase();
    const isDuplicate = DEFAULT_TOPICS.some(d => d.toLowerCase() === normalized) ||
      selectedTopics.some(existing => existing.toLowerCase() === normalized);
    if (isDuplicate) { setCustomTopicError('This topic already exists.'); return; }
    if (selectedTopics.length >= 7) { setCustomTopicError('Max 7 topics.'); return; }
    setSelectedTopics(prev => [...prev, t]);
    setCustomTopic('');
    setCustomTopicError('');
    setShowCustomInput(false);
  }

  async function handleFinish() {
    setSaving(true);
    // Always read username from profiles table — handles Google OAuth correctly
    const { data: existing } = await supabase
      .from('profiles').select('username').eq('id', session.user.id).single();
    let username = existing?.username
      || session.user.user_metadata?.username
      || session.user.email.split('@')[0];

    // If username not yet set, ensure it's unique
    if (!existing?.username) {
      const { data: taken } = await supabase
        .from('profiles').select('id').eq('username', username).neq('id', session.user.id).maybeSingle();
      if (taken) username = username + '_' + Math.random().toString(36).slice(2, 6);
    }

    await supabase.from('profiles').upsert({
      id: session.user.id,
      username,
      bio,
      topics: selectedTopics,
      onboarded: true,
    });

    setSaving(false);
    onComplete(username);
  }

  async function handleSkip() {
    const { data: existing } = await supabase
      .from('profiles').select('username').eq('id', session.user.id).single();
    let username = existing?.username
      || session.user.user_metadata?.username
      || session.user.email.split('@')[0];

    if (!existing?.username) {
      const { data: taken } = await supabase
        .from('profiles').select('id').eq('username', username).neq('id', session.user.id).maybeSingle();
      if (taken) username = username + '_' + Math.random().toString(36).slice(2, 6);
    }

    await supabase.from('profiles').upsert({
      id: session.user.id,
      username,
      bio: '',
      topics: [],
      onboarded: true,
    });
    onSkip(username);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Progress dots */}
        <div className={styles.dots}>
          {[1, 2, 3].map(s => (
            <div key={s} className={`${styles.dot} ${step >= s ? styles.dotActive : ''}`} />
          ))}
        </div>

        {/* ── Step 1: What is a digital garden ── */}
        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.stepIcon}><Icon name="seedling" circle size={24} /></div>
            <h2 className={styles.title}>What's a digital garden?</h2>
            <p className={styles.body}>
              A digital garden is your personal corner of the internet — not a
              polished portfolio, not a social feed, but a <em>living space</em> where
              you share what you love, what you're learning, and what makes you <em>you</em>.
            </p>
            <p className={styles.body}>
              Think of it like tending a real garden — you plant ideas, nurture them
              over time, and let others wander through. No pressure to be perfect.
              Just genuine, growing thoughts.
            </p>
            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={handleSkip}>Skip setup</button>
              <button className={styles.nextBtn} onClick={() => setStep(2)}>
                Let's grow one →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pick topics ── */}
        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.stepIcon}>🏷️</div>
            <h2 className={styles.title}>What do you want to grow?</h2>
            <p className={styles.subTitle}>
              Pick topics for your garden.
              <span className={selectedTopics.length >= 7 ? styles.limitReached : styles.limitCount}>
                {' '}{selectedTopics.length}/7
              </span>
            </p>

            <div className={styles.topicGrid}>
              {DEFAULT_TOPICS.map(topic => (
                <button
                  key={topic}
                  className={`${styles.topicBtn} ${selectedTopics.includes(topic) ? styles.topicSelected : ''}`}
                  onClick={() => toggleTopic(topic)}
                >
                  {selectedTopics.includes(topic) && <span className={styles.check}>✓ </span>}
                  {topic}
                </button>
              ))}

              {/* Custom topics added by user */}
              {selectedTopics.filter(t => !DEFAULT_TOPICS.includes(t)).map(topic => (
                <button
                  key={topic}
                  className={`${styles.topicBtn} ${styles.topicSelected}`}
                  onClick={() => toggleTopic(topic)}
                >
                  ✓ {topic}
                </button>
              ))}

              {/* Add custom */}
              {showCustomInput ? (
                <div className={styles.customInputWrap}>
                  <input
                    className={styles.customInput}
                    placeholder="e.g. Ceramics..."
                    value={customTopic}
                    onChange={e => { setCustomTopic(e.target.value); setCustomTopicError(''); }}
                    onKeyDown={e => e.key === 'Enter' && addCustomTopic()}
                    autoFocus
                  />
                  <button className={styles.customAddBtn} onClick={addCustomTopic}>Add</button>
                </div>
              ) : (
                <button className={styles.plusBtn} onClick={() => setShowCustomInput(true)}>
                  + Custom
                </button>
              )}
              {customTopicError && <p style={{fontFamily:'var(--font-sans)',fontSize:'12px',color:'hsl(0,65%,45%)',marginTop:'4px'}}>{customTopicError}</p>}
            </div>

            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={() => setStep(3)}>Skip</button>
              <button className={styles.nextBtn} onClick={() => setStep(3)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: About you ── */}
        {step === 3 && (
          <div className={styles.step}>
            <div className={styles.stepIcon}><Icon name="write" circle size={24} /></div>
            <h2 className={styles.title}>Tell us a little about you</h2>
            <p className={styles.subTitle}>This shows up on your garden page. Keep it short and personal.</p>

            <textarea
              className={styles.bioInput}
              placeholder="e.g. I make sourdough, read too much, and think about fonts obsessively..."
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 280))}
              rows={4}
            />
            <div className={styles.charCount}>
              <span className={bio.length >= 260 ? styles.charWarn : ''}>{bio.length}</span>/280
            </div>

            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={() => handleFinish()}>Skip</button>
              <button className={styles.nextBtn} onClick={handleFinish} disabled={saving}>
                {saving ? 'Planting...' : 'Open my garden'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}