import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { X, LogIn, UserPlus, Lock, Mail, User, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose }) => {
  const { signIn, signUp } = useAuth();
  const { addToast } = useToast();

  // Role Type selection: 'user' | 'admin'
  const [roleType, setRoleType] = useState('user');
  
  // Auth Mode for User: 'login' | 'register'
  const [mode, setMode] = useState('login'); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Form Validation
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid User ID or Email Address.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }
    if (roleType === 'user' && mode === 'register' && !fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (roleType === 'admin') {
        // Admin Sign In Attempt
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg('Access Denied: Invalid Admin User ID or Password.');
          addToast('Admin authentication failed.', 'error');
        } else {
          const profile = await api.get('profiles/me/');
          if (profile?.role !== 'Admin') {
            setErrorMsg('This account does not have administrator access.');
            addToast('Administrator access is required.', 'error');
            return;
          }
          addToast('Admin authenticated successfully! Accessing admin workspace.', 'success');
          onClose();
        }
      } else {
        // User Login or Register
        if (mode === 'login') {
          const { error } = await signIn(email.trim(), password);
          if (error) {
            setErrorMsg('Invalid User ID or Password. Please check your credentials or create a new account.');
            addToast('Login failed. Invalid credentials.', 'error');
          } else {
            addToast('Successfully signed in!', 'success');
            onClose();
          }
        } else {
          const { error } = await signUp(email.trim(), password, fullName.trim());
          if (error) {
            setErrorMsg(error.message || 'Registration failed.');
            addToast('Registration failed.', 'error');
          } else {
            addToast('Account created successfully! Welcome to NexusSpace.', 'success');
            onClose();
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        
        {/* Modal Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem 0.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>NexusSpace Portal</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Select Login Type (User vs Admin) */}
        <div style={{ padding: '0 1.25rem 1rem' }}>
          <label className="input-label" style={{ marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
            Select Login Portal Type:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => { setRoleType('user'); setErrorMsg(''); setMode('login'); }}
              className={`btn ${roleType === 'user' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <User className="w-4 h-4" /> User Portal
            </button>

            <button
              type="button"
              onClick={() => { setRoleType('admin'); setErrorMsg(''); }}
              className={`btn ${roleType === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 0.85rem', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Portal
            </button>
          </div>
        </div>

        {/* User Mode Tabs (Sign In vs Create Account) */}
        {roleType === 'user' && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)' }}>
            <button
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                color: mode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: mode === 'login' ? '2px solid var(--primary)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
              onClick={() => { setMode('login'); setErrorMsg(''); }}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>

            <button
              style={{
                flex: 1,
                padding: '0.75rem',
                background: 'none',
                border: 'none',
                color: mode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                borderBottom: mode === 'register' ? '2px solid var(--primary)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
              onClick={() => { setMode('register'); setErrorMsg(''); }}
            >
              <UserPlus className="w-4 h-4" /> Create New Account
            </button>
          </div>
        )}

        {/* Form Area */}
        <form onSubmit={handleSubmit} className="modal-body" style={{ paddingTop: '1.25rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {roleType === 'admin' 
                ? 'Administrator Login' 
                : mode === 'login' 
                  ? 'User Account Login' 
                  : 'Create a New Account'}
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {roleType === 'admin'
                ? 'Enter your private Admin User ID and Password'
                : mode === 'login'
                  ? 'Enter your registered User ID and Password'
                  : 'Sign up for a new account to start managing your projects'}
            </p>
          </div>

          {/* Explicit Error Display */}
          {errorMsg && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name field for New User Registration */}
          {roleType === 'user' && mode === 'register' && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* User ID / Email Input */}
          <div className="input-group">
            <label className="input-label">{roleType === 'admin' ? 'Admin User ID / Email' : 'User ID / Email'}</label>
            <div style={{ position: 'relative' }}>
              <Mail className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                placeholder={roleType === 'admin' ? 'admin@your-domain.com' : 'user@domain.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : roleType === 'admin' ? (
              <>
                <ShieldCheck className="w-4 h-4" /> Login as Admin
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In as User
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Register New Account
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
