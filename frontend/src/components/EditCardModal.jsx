import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import styles from './EditCardModal.module.css';
import addStyles from './AddCardModal.module.css';

const SIZE_OPTIONS = [
  { value: '1x1', label: '1×1', desc: 'Default', cols: 1, rows: 1 },
  { value: '1x2', label: '1×2', desc: 'Tall',    cols: 1, rows: 2 },
  { value: '2x1', label: '2×1', desc: 'Wide',    cols: 2, rows: 1 },
  { value: '2x2', label: '2×2', desc: 'Large',   cols: 2, rows: 2 },
];

export default function EditCardModal({ card, onClose, onCardUpdated, onCardDeleted }) {
  const [title, setTitle]           = useState(card.title || '');
  const [content, setContent]       = useState(card.content || '');
  const [size, setSize]             = useState(card.size || '1x1');
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(card.image_url || null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]           = useState(null);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!title.trim()) { setError('Please add a title.'); return; }
    setSaving(true); setError(null);

    let imageUrl = card.image_url;
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const path = `${card.user_id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('card-images').upload(path, imageFile);
      if (uploadError) { setError('Image upload failed.'); setSaving(false); return; }
      const { data } = supabase.storage.from('card-images').getPublicUrl(path);
      imageUrl = data.publicUrl;
    }
    if (!imagePreview) imageUrl = null;

    const { data, error: dbError } = await supabase
      .from('cards')
      .update({ title: title.trim(), content: content.trim(), image_url: imageUrl, size })
      .eq('id', card.id).select().single();

    setSaving(false);
    if (dbError) { setError('Something went wrong.'); return; }
    onCardUpdated(data);
    onClose();
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from('cards').delete().eq('id', card.id);
    setDeleting(false);
    onCardDeleted(card.id);
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <button className={styles.close} onClick={onClose}>✕</button>
        <h2 className={styles.title}>Edit card</h2>
        <p className={styles.sub}>Update your card content.</p>

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input className={styles.input} placeholder="What's this about?"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Content</label>
          <textarea className={styles.textarea} placeholder="Write something..."
            value={content} onChange={e => setContent(e.target.value)} rows={4} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Card size</label>
          <div className={addStyles.sizePicker}>
            {SIZE_OPTIONS.map(opt => (
              <button key={opt.value} type="button"
                className={`${addStyles.sizeBtn} ${size === opt.value ? addStyles.sizeBtnActive : ''}`}
                onClick={() => setSize(opt.value)}
              >
                <div className={addStyles.sizePreview}>
                  <div className={addStyles.sizeBlock}
                    style={{ gridColumn: `span ${opt.cols}`, gridRow: `span ${opt.rows}` }} />
                </div>
                <span className={addStyles.sizeBtnLabel}>{opt.label}</span>
                <span className={addStyles.sizeBtnDesc}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Image</label>
          {imagePreview ? (
            <div className={styles.previewWrap}>
              <img src={imagePreview} alt="preview" className={styles.preview} />
              <button className={styles.removeImg}
                onClick={() => { setImageFile(null); setImagePreview(null); }}>
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
            {saving ? 'Saving...' : 'Save changes ✓'}
          </button>
        </div>

        {/* Delete section */}
        <div className={styles.deleteSection}>
          {!confirmDelete ? (
            <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
              🗑 Delete this card
            </button>
          ) : (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>Are you sure?</span>
              <button className={styles.confirmYes} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
              <button className={styles.confirmNo} onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}