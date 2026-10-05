import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { X, User, Camera, Save, Loader2, Globe, Shield, Mail } from 'lucide-react';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { user, profile, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setWebsite(profile.website || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select a valid image file.', 'error');
      return;
    }

    setUploadingAvatar(true);

    try {
      const uploaded = await api.upload('storage/upload/', file, { kind: 'avatar' });
      setAvatarUrl(uploaded.public_url);
      addToast('Avatar uploaded to Supabase Storage!', 'success');
    } catch (err) {
      addToast(err.message || 'Avatar upload failed.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updates = {
      full_name: fullName.trim(),
      bio: bio.trim(),
      website: website.trim(),
      avatar_url: avatarUrl
    };

    const { error } = await updateProfile(updates);

    if (error) {
      addToast('Failed to update profile.', 'error');
    } else {
      addToast('Profile updated successfully!', 'success');
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <User className="w-5 h-5 text-indigo-400" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>User Profile & Settings</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Avatar Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                    {(fullName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--primary)', padding: '0.35rem', borderRadius: '50%', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }} title="Change Avatar">
                  {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploadingAvatar} />
                </label>
              </div>

              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{fullName || 'User'}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <span className="badge badge-primary">{profile?.role || 'Member'}</span>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bio / Tagline</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="Software engineer crafting clean user interfaces..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Website / Portfolio URL</label>
              <input
                type="url"
                className="input-field"
                placeholder="https://yourportfolio.dev"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploadingAvatar}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
