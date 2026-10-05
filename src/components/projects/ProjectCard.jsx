import React from 'react';
import { 
  Folder, 
  CheckSquare, 
  Eye, 
  Edit3, 
  Trash2, 
  Tag, 
  Globe, 
  Lock,
  ArrowUpRight
} from 'lucide-react';

export const ProjectCard = ({ project, tasks = [], onSelect, onEdit, onDelete, currentUserId }) => {
  const isOwner = currentUserId && project.user_id === currentUserId;

  // Task Progress Calculation
  const projectTasks = tasks.filter(t => t.project_id === project.id);
  const completedTasks = projectTasks.filter(t => t.is_completed).length;
  const progressPercent = projectTasks.length > 0 
    ? Math.round((completedTasks / projectTasks.length) * 100) 
    : 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed': return 'badge-emerald';
      case 'In Progress': return 'badge-cyan';
      case 'Planning': return 'badge-primary';
      case 'On Hold': return 'badge-amber';
      default: return 'badge-primary';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent': return 'badge-rose';
      case 'High': return 'badge-amber';
      case 'Medium': return 'badge-primary';
      default: return 'badge-cyan';
    }
  };

  return (
    <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Cover Image Container */}
      <div style={{ position: 'relative', height: '140px', width: '100%', overflow: 'hidden', background: '#0f172a' }}>
        {project.cover_url ? (
          <img 
            src={project.cover_url} 
            alt={project.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))' }}>
            <Folder className="w-10 h-10 text-indigo-400" />
          </div>
        )}

        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: '70%' }}>
          <span className={`badge ${getStatusBadge(project.status)}`} style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}>
            {project.status}
          </span>
          <span className={`badge ${getPriorityBadge(project.priority)}`} style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}>
            {project.priority}
          </span>
        </div>

        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          {project.is_public ? (
            <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}><Globe className="w-3 h-3" /> Public</span>
          ) : (
            <span className="badge badge-amber" style={{ fontSize: '0.625rem', padding: '0.15rem 0.45rem' }}><Lock className="w-3 h-3" /> Private</span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Tag className="w-3 h-3 text-cyan-400" /> {project.category || 'General'}
          </div>

          <h3 
            onClick={() => onSelect(project)} 
            style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', lineHeight: '1.3' }}
            className="hover:text-indigo-400 transition-colors"
          >
            {project.title}
          </h3>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
            {project.description || 'No description provided.'}
          </p>
        </div>

        <div>
          {/* Progress Bar */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckSquare className="w-3 h-3 text-indigo-400" /> Tasks ({completedTasks}/{projectTasks.length})
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: '5px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progressPercent}%`, 
                  background: 'linear-gradient(90deg, #6366f1, #06b6d4)', 
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }} 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => onSelect(project)} 
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
            >
              <Eye className="w-3.5 h-3.5" /> View Project <ArrowUpRight className="w-3 h-3 text-indigo-400" />
            </button>

            {isOwner && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button 
                  onClick={() => onEdit(project)} 
                  className="btn btn-secondary btn-icon btn-sm" 
                  title="Edit Project"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                </button>

                <button 
                  onClick={() => onDelete(project.id)} 
                  className="btn btn-danger btn-icon btn-sm" 
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
