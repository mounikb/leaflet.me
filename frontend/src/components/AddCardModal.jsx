import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './AddCardModal.module.css';

export default function AddCardModal({ session, topics, onClose, onCardAdded }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState(topics[0] || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim()) { setError('Please add a title.'); return; }
    setSaving(true);
    setError(null);

    let imageUrl = null;

    // Upload image if present
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(path, imageFile);

      if (uploadError) {
        setError('Image upload failed. Try again.');
        setSaving(false);
        return;
      }

      const { data } = supabase.storage.from('card-images').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    // Get current max position for this topic so new card goes to the end
    const { data: existing } = await supabase
      .from('cards')
      .select('position')
      .eq('user_id', session.user.id)
      .eq('topic', topic)
      .order('position', { ascending: false })
      .limit(1);
    const nextPosition = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

    // Save card to DB
    const { data, error: dbError } = await supabase.from('cards').insert({
      user_id: session.user.id,
      title: title.trim(),
      content: content.trim(),
      topic,
      image_url: imageUrl,
      position: nextPosition,
    }).select().single();

    setSaving(false);

    if (dbError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    onCardAdded(data);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Add a card</h2>
        <p className={styles.sub}>Plant a new idea in your garden.</p>

        {/* Topic */}
        <div className={styles.field}>
          <label className={styles.label}>Topic</label>
          <select
            className={styles.select}
            value={topic}
            onChange={e => setTopic(e.target.value)}
          >
            {topics.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Title */}
        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input
            className={styles.input}
            placeholder="What's this about?"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className={styles.field}>
          <label className={styles.label}>Content</label>
          <textarea
            className={styles.textarea}
            placeholder="Write something... a note, a thought, a recipe."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
          />
        </div>

        {/* Image */}
        <div className={styles.field}>
          <label className={styles.label}>Image (optional)</label>
          {imagePreview ? (
            <div className={styles.previewWrap}>
              <img src={imagePreview} alt="preview" className={styles.preview} />
              <button className={styles.removeImg} onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Remove
              </button>
            </div>
          ) : (
            <label className={styles.uploadBtn}>
              📎 Attach image
              <input type="file" accept="image/*" onChange={handleImage} hidden />
            </label>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Planting...' : 'Plant this card 🌱'}
          </button>
        </div>

      </div>
    </div>
  );
}