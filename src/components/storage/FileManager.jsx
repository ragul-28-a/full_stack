import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Paperclip, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Trash2, 
  Loader2,
  ExternalLink
} from 'lucide-react';

export const FileManager = ({ projectId, files = [], onFileUploaded, onFileDeleted, isOwner }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const projectFiles = files.filter(f => f.project_id === projectId);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      addToast('Authentication required to upload project attachments.', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast('File size limit is 10MB.', 'error');
      return;
    }

    setUploading(true);

    try {
      await onFileUploaded(projectId, file);
      addToast(`File "${file.name}" uploaded to Supabase Storage!`, 'success');
    } catch (err) {
      console.error('File upload error:', err);
      addToast(err.message || 'File upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <ImageIcon className="w-4 h-4 text-cyan-400" />;
    if (fileType?.includes('pdf')) return <FileText className="w-4 h-4 text-rose-400" />;
    return <File className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Paperclip className="w-5 h-5 text-indigo-400" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            Supabase Storage Attachments ({projectFiles.length})
          </h3>
        </div>

        {isOwner && (
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {projectFiles.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
            No files uploaded yet. Click Upload File to store documents on Supabase Storage.
          </div>
        ) : (
          projectFiles.map((file) => (
            <div key={file.id} className="glass-card" style={{ padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                  {getFileIcon(file.file_type)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.file_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {formatFileSize(file.file_size)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-icon btn-sm"
                  title="View / Download"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                </a>

                {isOwner && (
                  <button
                    onClick={() => onFileDeleted(file.id)}
                    className="btn btn-danger btn-icon btn-sm"
                    title="Delete File Attachment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
