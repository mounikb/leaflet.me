import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './EditProfileModal.module.css';

const DEFAULT_TOPICS = [
  'Writing', 'Photography', 'Reading', 'Code',
  'Art', 'Cooking', 'Travel', 'Music'
];

export default function EditProfileModal({ profile, initialTab = 'bio', onClose, onSaved }) {
  const [tab, setTab]                 = useState(initialTab);
  const [bio, setBio]                 = useState(profile?.bio || '');
  const [topics, setTopics]           = useState(profile?.topics || []);
  const [customTopic, setCustomTopic] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving]           = useState(false);
  // Topics pending removal — need user confirmation
  const [pendingRemove, setPendingRemove] = useState(null); // topic name

  function toggleTopic(topic) {
    if (topics.includes(topic)) {
      // Removing — show warning first
      setPendingRemove(topic);
    } else {
      if (topics.length >= 7) return;
      setTopics(prev => [...prev, topic]);
    }
  }

  async function confirmRemove() {
    const topic = pendingRemove;
    // Delete all cards for this topic
    const { data: prof } = await supabase
      .from('profiles').select('id').eq('id', profile.id).single();
    if (prof) {
      await supabase.from('cards')
        .delete()
        .eq('user_id', profile.id)
        .eq('topic', topic);
    }
    setTopics(prev => prev.filter(t => t !== topic));
    setPendingRemove(null);
  }

  const [customTopicError, setCustomTopicError] = useState('');

  function addCustomTopic() {
    const t = customTopic.trim();
    if (!t) return;
    const normalized = t.toLowerCase();
    const isDuplicate = DEFAULT_TOPICS.some(d => d.toLowerCase() === normalized) ||
      topics.some(existing => existing.toLowerCase() === normalized);
    if (isDuplicate) {
      setCustomTopicError('This topic already exists.');
      return;
    }
    if (topics.length >= 7) { setCustomTopicError('Max 7 topics.'); return; }
    setTopics(prev => [...prev, t]);
    setCustomTopic('');
    setCustomTopicError('');
    setShowCustomInput(false);
  }

  async function handleSave() {
    setSaving(true);
    const { data } = await supabase
      .from('profiles')
      .update({ bio: bio.trim(), topics })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    onSaved(data);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Edit your garden</h2>

        {/* ── Topic removal warning ── */}
        {pendingRemove && (
          <div className={styles.warningBox}>
            <p className={styles.warningTitle}>⚠️ Delete "{pendingRemove}"?</p>
            <p className={styles.warningText}>
              All cards in <strong>{pendingRemove}</strong> will be permanently deleted.
              This cannot be undone.
            </p>
            <div className={styles.warningActions}>
              <button className={styles.warningCancel} onClick={() => setPendingRemove(null)}>
                Keep topic
              </button>
              <button className={styles.warningConfirm} onClick={confirmRemove}>
                Yes, delete everything
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'bio' ? styles.tabActive : ''}`} onClick={() => setTab('bio')}>Bio</button>
          <button className={`${styles.tab} ${tab === 'topics' ? styles.tabActive : ''}`} onClick={() => setTab('topics')}>Topics</button>
        </div>

        {/* Bio tab */}
        {tab === 'bio' && (
          <div className={styles.section}>
            <p className={styles.hint}>This shows on your garden page. Keep it short and personal.</p>
            <textarea
              className={styles.textarea}
              placeholder="e.g. I make sourdough, read too much, and think about fonts obsessively..."
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 280))}
              rows={5}
            />
            <div className={styles.charCount}>
              <span className={bio.length >= 260 ? styles.charWarn : ''}>{bio.length}</span>/280
            </div>
          </div>
        )}

        {/* Topics tab */}
        {tab === 'topics' && (
          <div className={styles.section}>
            <p className={styles.hint}>
              Select topics for your garden.{' '}
              <span className={topics.length >= 7 ? styles.limitReached : styles.limitCount}>
                {topics.length}/7
              </span>
            </p>
            <div className={styles.topicGrid}>
              {DEFAULT_TOPICS.map(t => (
                <button key={t}
                  className={`${styles.topicBtn} ${topics.includes(t) ? styles.topicSelected : ''}`}
                  onClick={() => toggleTopic(t)}>
                  {topics.includes(t) && <span>✓ </span>}{t}
                </button>
              ))}
              {topics.filter(t => !DEFAULT_TOPICS.includes(t)).map(t => (
                <button key={t}
                  className={`${styles.topicBtn} ${styles.topicSelected}`}
                  onClick={() => toggleTopic(t)}>
                  ✓ {t}
                </button>
              ))}
              {showCustomInput ? (
                <div className={styles.customWrap}>
                  <input className={styles.customInput} placeholder="e.g. Ceramics..."
                    value={customTopic} onChange={e => { setCustomTopic(e.target.value); setCustomTopicError(''); }}
                    onKeyDown={e => e.key === 'Enter' && addCustomTopic()} autoFocus />
                  <button className={styles.customAddBtn} onClick={addCustomTopic}>Add</button>
                </div>
              ) : (
                <button className={styles.plusBtn} onClick={() => setShowCustomInput(true)}>+ Custom</button>
              )}
              {customTopicError && <p style={{fontFamily:'var(--font-sans)',fontSize:'12px',color:'hsl(0,65%,45%)',marginTop:'4px'}}>{customTopicError}</p>}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes ✓'}
          </button>
        </div>

      </div>
    </div>
  );
}