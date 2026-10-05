import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, ShieldCheck, Mail, Calendar, FolderKanban, Search, User } from 'lucide-react';

export const UsersPage = ({ projects = [] }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const data = await api.get('profiles/');
        setProfiles(data || []);
      } catch (err) {
        console.error('Error fetching user profiles:', err);
        setError(err.message || 'Unable to load user profiles.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(p => 
    (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.role && p.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getUserProjectCount = (userId) => {
    return projects.filter(p => p.user_id === userId).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users className="w-7 h-7 text-indigo-400" />
            User Management Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Admin Control Panel — View all registered platform users and their workspace activity
          </p>
        </div>

        <span className="badge badge-rose" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
          <ShieldCheck className="w-4 h-4" /> Admin Authorized View
        </span>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '2.4rem', marginBottom: 0 }}
            placeholder="Search users by name, email address, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table / Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading user database...
        </div>
      ) : error ? (
        <div className="glass-card" role="alert" style={{ padding: '2rem', textAlign: 'center', color: '#fb7185' }}>
          {error}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No user profiles found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredProfiles.map((prof) => (
            <div key={prof.id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={prof.full_name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    {(prof.full_name || prof.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {prof.full_name || 'Anonymous User'}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Mail className="w-3.5 h-3.5" /> {prof.email || 'Registered User'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span className={`badge ${prof.role === 'Admin' ? 'badge-rose' : 'badge-cyan'}`}>
                  {prof.role || 'Member'}
                </span>

                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#818cf8', fontWeight: 600 }}>
                  <FolderKanban className="w-3.5 h-3.5" /> {getUserProjectCount(prof.id)} Projects Created
                </span>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
