import React, { useState } from 'react';
import { ProjectCard } from '../components/projects/ProjectCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import { 
  Search, 
  Plus, 
  FolderKanban, 
  X, 
  Layers, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProjectsPage = ({ 
  projects = [], 
  tasks = [], 
  loading = false, 
  onSelectProject, 
  onOpenCreate, 
  onEditProject, 
  onDeleteProject 
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categories = ['All', 'Web Dev', 'Design', 'Mobile App', 'AI / Data', 'Marketing', 'General'];

  // Search & Filter Logic
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = 
      proj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj.description && proj.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || proj.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || proj.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      await onDeleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', width: '100%' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.8rem)', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            Projects & Workspaces
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
            Showing {filteredProjects.length} of {projects.length} workspace projects
          </p>
        </div>

        <button onClick={onOpenCreate} className="btn btn-primary" style={{ width: 'auto' }}>
          <Plus className="w-4 h-4" /> Create Project
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', width: '100%' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '2.2rem', marginBottom: 0, fontSize: '0.85rem' }}
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div style={{ width: '100%' }}>
            <select
              className="input-field"
              style={{ marginBottom: 0, fontSize: '0.85rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        {/* Category Pill Tabs (Scrollable on Mobile) */}
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', width: '100%', paddingBottom: '0.2rem', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ whiteSpace: 'nowrap', borderRadius: '999px', fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Projects Grid Container */}
      {loading ? (
        <div className="grid-projects">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 1.25rem', textAlign: 'center', width: '100%' }}>
          <Layers className="w-10 h-10 text-indigo-400" style={{ margin: '0 auto 0.75rem', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>No projects found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', maxWidth: '360px', margin: '0 auto 1.25rem' }}>
            {user ? "You have no projects in this view. Click 'Create Project' to build your first project!" : "Please sign in to access your projects."}
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedStatus('All'); }} 
            className="btn btn-secondary btn-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid-projects">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              onSelect={onSelectProject}
              onEdit={onEditProject}
              onDelete={(id) => setDeleteConfirmId(id)}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>Delete Project?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              This action will permanently delete the project and associated tasks.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirmId(null)} className="btn btn-secondary btn-sm" disabled={deleting}>
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger btn-sm" disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
