import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, LogIn } from 'lucide-react';

export const ProtectedRoute = ({ children, onOpenAuth }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
        <div className="skeleton" style={{ width: '200px', height: '24px', margin: '0 auto' }}></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '540px', margin: '3rem auto' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          background: 'rgba(99, 102, 241, 0.15)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem',
          color: '#818cf8',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <Lock className="w-8 h-8" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          Please log in or register to access protected projects, relational tasks, file uploads, and Supabase RLS features.
        </p>
        <button onClick={onOpenAuth} className="btn btn-primary" style={{ width: '100%', maxWidth: '260px' }}>
          <LogIn className="w-4 h-4" /> Sign In / Register
        </button>
      </div>
    );
  }

  return children;
};
