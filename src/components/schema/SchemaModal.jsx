import React, { useState } from 'react';
import { X, ShieldCheck, Database, Copy, Check, Lock, Key } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SchemaModal = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSnippet = `-- NEXUSSPACE SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Profiles Table Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects Table Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public projects or projects they own"
  ON public.projects FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert/update/delete their own projects"
  ON public.projects FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- Tasks Table Security (Relational Child)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view/modify tasks of owned projects"
  ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSnippet);
    setCopied(true);
    addToast('SQL RLS Policies copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Supabase Security & RLS Architecture</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
            NexusSpace uses <strong>Supabase Row Level Security (RLS)</strong> to enforce multi-tenant database isolation. Public projects can be read by all authenticated workspace members, while private projects, tasks, and files are strictly scoped to <code style={{ color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>auth.uid() = user_id</code>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Lock className="w-4 h-4" /> Multi-Tenant RLS
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Guarantees zero data leakage across different user accounts.
              </div>
            </div>

            <div className="glass-card" style={{ padding: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <Key className="w-4 h-4" /> Storage Security
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Storage object ownership checked via folder naming policies.
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0f1d', padding: '0.5rem 1rem', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Database className="w-3.5 h-3.5 text-cyan-400" /> SQL Editor Script (`supabase/schema.sql`)
              </span>
              <button onClick={copySql} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <pre style={{
              background: '#04070d',
              color: '#a5b4fc',
              padding: '1rem',
              borderBottomLeftRadius: 'var(--radius-md)',
              borderBottomRightRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              overflowX: 'auto',
              maxHeight: '220px',
              fontFamily: 'monospace'
            }}>
              {sqlSnippet}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
