import React from 'react';
import { TaskManager } from '../tasks/TaskManager';
import { FileManager } from '../storage/FileManager';
import { 
  X, 
  Tag, 
  Calendar, 
  User, 
  Globe, 
  Lock, 
  Edit3, 
  Trash2, 
  Folder 
} from 'lucide-react';

export const ProjectDetailModal = ({ 
  project, 
  isOpen, 
  onClose, 
  tasks, 
  files,
  onAddTask, 
  onToggleTask, 
  onDeleteTask, 
  onFileUpload, 
  onFileDelete,
  onEdit, 
  onDelete, 
  currentUserId 
}) => {
  if (!isOpen || !project) return null;

  const isOwner = currentUserId && project.user_id === currentUserId;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px', width: '100%' }}>
        
        {/* Banner Cover Image */}
        <div style={{ position: 'relative', height: '170px', width: '100%', background: '#0f172a' }}>
          {project.cover_url ? (
            <img src={project.cover_url} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(6,182,212,0.25))' }}>
              <Folder className="w-12 h-12 text-indigo-400" />
            </div>
          )}

          <button 
            onClick={onClose} 
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(9, 13, 22, 0.85)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X className="w-4 h-4" />
          </button>

          <div style={{ position: 'absolute', bottom: '10px', left: '12px', right: '12px', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>{project.category || 'General'}</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>{project.status}</span>
            <span className="badge badge-rose" style={{ fontSize: '0.625rem' }}>{project.priority}</span>
            {project.is_public ? (
              <span className="badge badge-emerald" style={{ fontSize: '0.625rem' }}><Globe className="w-3 h-3" /> Public</span>
            ) : (
              <span className="badge badge-amber" style={{ fontSize: '0.625rem' }}><Lock className="w-3 h-3" /> Private</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="modal-body" style={{ padding: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>{project.title}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User className="w-3.5 h-3.5 text-cyan-400" /> {isOwner ? 'Owner: You' : 'Member Project'}
                </span>
              </div>
            </div>

            {isOwner && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button 
                  onClick={() => { onClose(); onEdit(project); }} 
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>

                <button 
                  onClick={() => { onClose(); onDelete(project.id); }} 
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
            {project.description || 'No detailed description specified for this project.'}
          </p>

          {/* Relational Tasks Management */}
          <TaskManager 
            projectId={project.id}
            tasks={tasks}
            onAddTask={onAddTask}
            onToggleTask={onToggleTask}
            onDeleteTask={onDeleteTask}
            isOwner={isOwner}
          />

          {/* Supabase Storage Files Attachment Management */}
          <FileManager 
            projectId={project.id}
            files={files}
            onFileUploaded={onFileUpload}
            onFileDeleted={onFileDelete}
            isOwner={isOwner}
          />

        </div>
      </div>
    </div>
  );
};
