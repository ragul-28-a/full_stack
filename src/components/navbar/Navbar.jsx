import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Rocket, 
  LayoutDashboard, 
  FolderKanban, 
  User, 
  LogOut, 
  LogIn, 
  Database, 
  Menu, 
  X,
  Users
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenProfile }) => {
  const { user, profile, signOut, isLiveSupabase } = useAuth();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'Admin';
  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      addToast(error.message || 'Unable to sign out.', 'error');
      return;
    }
    addToast('Signed out successfully.', 'success');
    setMobileMenuOpen(false);
  };

  return (
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100, width: '100%', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flexShrink: 0 }} onClick={() => setActiveTab('projects')}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }} className="gradient-text">NexusSpace</span>
              {isAdmin && <span className="badge badge-rose" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>Admin</span>}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hide-on-mobile">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>{isLiveSupabase ? 'Cloud Supabase' : 'Supabase Active'}</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          <button
            onClick={() => setActiveTab('projects')}
            className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <FolderKanban className="w-4 h-4" /> Projects & Tasks
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
            >
              <Users className="w-4 h-4 text-indigo-400" /> Users Directory
            </button>
          )}
        </nav>

        {/* Desktop Auth Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="desktop-nav">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={onOpenProfile} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                    {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{profile?.full_name || user.email.split('@')[0]}</span>
                <span className={`badge ${isAdmin ? 'badge-rose' : 'badge-cyan'}`} style={{ fontSize: '0.6rem' }}>
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </button>

              <button 
                onClick={signOut} 
                className="btn btn-danger btn-icon btn-sm" 
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary" style={{ fontSize: '0.825rem' }}>
              <LogIn className="w-4 h-4" /> Sign In / Register
            </button>
          )}
        </div>

        {/* Mobile View Toggle & Quick Profile trigger */}
        <div style={{ display: 'none' }} className="mobile-toggle-group">
          {user ? (
            <button 
              onClick={onOpenProfile} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                  {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          ) : null}

          <button 
            className="btn btn-secondary btn-icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{ padding: '0.4rem' }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#090d16', width: '100%' }}>
          
          {user ? (
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="User" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{profile?.full_name || user.email.split('@')[0]}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
              <span className={`badge ${isAdmin ? 'badge-rose' : 'badge-cyan'}`}>
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          ) : (
            <button 
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} 
              className="btn btn-primary"
              style={{ justifyContent: 'center', width: '100%', marginBottom: '0.5rem' }}
            >
              <LogIn className="w-4 h-4" /> Sign In / Register
            </button>
          )}

          <button
            onClick={() => { setActiveTab('projects'); setMobileMenuOpen(false); }}
            className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <FolderKanban className="w-4 h-4" /> Projects & Tasks
          </button>

          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>

          {isAdmin && (
            <button
              onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', width: '100%' }}
            >
              <Users className="w-4 h-4 text-indigo-400" /> Users Directory
            </button>
          )}

          {user && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => { onOpenProfile(); setMobileMenuOpen(false); }} 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <User className="w-4 h-4" /> Profile Settings
              </button>
              
              <button 
                onClick={handleSignOut}
                className="btn btn-danger btn-icon"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hide-on-mobile { display: none !important; }
          .mobile-toggle-group { display: flex !important; alignItems: center; gap: 0.5rem; }
        }
      `}</style>
    </header>
  );
};
