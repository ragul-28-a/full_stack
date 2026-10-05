import React from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  ListTodo, 
  Plus, 
  Sparkles, 
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = ({ projects = [], tasks = [], files = [], onOpenCreate, setActiveTab }) => {
  const { user, profile } = useAuth();

  const totalProjects = projects.length;
  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.is_completed).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ padding: 'clamp(1.25rem, 4vw, 2rem)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)', position: 'relative', overflow: 'hidden', width: '100%' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '999px', fontSize: '0.725rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Powered by React & Supabase
          </div>
          
          <h1 style={{ fontSize: 'clamp(1.35rem, 5vw, 2.1rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem', lineHeight: 1.25 }}>
            Welcome back, <span className="gradient-text">{profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Workspace Member')}</span> 👋
          </h1>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
            Manage full-stack projects, handle relational tasks, upload assets to Supabase Storage, and organize your workspace effortlessly across mobile and laptop.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={onOpenCreate} className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" /> Create New Project
            </button>
            <button onClick={() => setActiveTab('projects')} className="btn btn-secondary btn-sm">
              <FolderKanban className="w-4 h-4" /> View All Projects
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem', width: '100%' }}>
        
        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.65rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-md)', color: '#818cf8', flexShrink: 0 }}>
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Projects</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{totalProjects}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', borderRadius: 'var(--radius-md)', color: '#22d3ee', flexShrink: 0 }}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>In Progress</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{inProgressProjects}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', color: '#34d399', flexShrink: 0 }}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{completedProjects}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.65rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: 'var(--radius-md)', color: '#c084fc', flexShrink: 0 }}>
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tasks Completed</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{completedTasks}/{totalTasks}</div>
          </div>
        </div>

      </div>

      {/* Recent Activity / Projects Overview */}
      <div className="glass-card" style={{ padding: '1.25rem', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Active Projects Quick Glance</h2>
          <button onClick={() => setActiveTab('projects')} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {projects.slice(0, 3).map((p) => (
            <div 
              key={p.id} 
              className="glass-card" 
              style={{ padding: '0.85rem', cursor: 'pointer', background: 'rgba(0,0,0,0.25)' }}
              onClick={() => setActiveTab('projects')}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                {p.category}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{p.title}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>{p.status}</span>
                <span className="badge badge-rose" style={{ fontSize: '0.625rem' }}>{p.priority} Priority</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
