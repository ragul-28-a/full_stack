import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { X, Upload, Image, Loader2, Save, FolderPlus, Globe, Lock } from 'lucide-react';

export const ProjectFormModal = ({ isOpen, onClose, onSave, projectToEdit }) => {
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Dev');
  const [status, setStatus] = useState('In Progress');
  const [priority, setPriority] = useState('Medium');
  const [isPublic, setIsPublic] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title || '');
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || 'Web Dev');
      setStatus(projectToEdit.status || 'In Progress');
      setPriority(projectToEdit.priority || 'Medium');
      setIsPublic(projectToEdit.is_public !== false);
      setCoverUrl(projectToEdit.cover_url || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Web Dev');
      setStatus('In Progress');
      setPriority('Medium');
      setIsPublic(true);
      setCoverUrl('');
    }
    setErrorMsg('');
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  // Django stores the image in the Supabase project-assets bucket.
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be under 5MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');

    try {
      const uploaded = await api.upload('storage/upload/', file, { kind: 'cover' });
      setCoverUrl(uploaded.public_url);
      addToast('Cover image uploaded to Supabase Storage!', 'success');
    } catch (err) {
      console.error('Storage upload error:', err);
      setErrorMsg(err.message || 'Failed to upload cover image.');
      addToast('Cover image upload failed.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Project title is required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const projectData = {
      title: title.trim(),
      description: description.trim(),
      category,
      status,
      priority,
      is_public: isPublic,
      cover_url: coverUrl
    };

    try {
      await onSave(projectData, projectToEdit?.id);
      addToast(
        projectToEdit ? 'Project updated successfully!' : 'New project created successfully!', 
        'success'
      );
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save project.');
      addToast('Error saving project.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FolderPlus className="w-5 h-5 text-indigo-400" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {projectToEdit ? 'Edit Project Details' : 'Create New Project'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {errorMsg && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div className="input-group">
              <label className="input-label">Project Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. AI-Powered Analytics Platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Category & Status Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Web Dev">Web Dev</option>
                  <option value="Design">Design</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="AI / Data">AI / Data</option>
                  <option value="Marketing">Marketing</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            {/* Priority & RLS Visibility */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Priority Level</label>
                <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">RLS Security Visibility</label>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`btn ${isPublic ? 'btn-secondary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'space-between', padding: '0.7rem 0.9rem', fontSize: '0.85rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                    {isPublic ? 'Public Project' : 'Private (Owner Only)'}
                  </span>
                  <span className={`badge ${isPublic ? 'badge-emerald' : 'badge-amber'}`}>
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Brief summary of project goals, features, and target metrics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Supabase Storage Cover Image Upload */}
            <div className="input-group">
              <label className="input-label">Cover Artwork (Supabase Storage)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {coverUrl ? (
                  <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={coverUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => setCoverUrl('')}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '60px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    <Image className="w-6 h-6" />
                  </div>
                )}

                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploadingImage} />
                </label>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploadingImage}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : projectToEdit ? 'Update Project' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
