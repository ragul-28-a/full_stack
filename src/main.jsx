import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { isLiveSupabaseConfigured } from './lib/supabaseClient.js';

const ConfigurationNotice = () => (
  <main
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem',
      background: 'radial-gradient(ellipse at top, #172554 0%, #090d16 55%)',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}
  >
    <section
      role="alert"
      style={{
        width: 'min(100%, 620px)',
        padding: '2rem',
        border: '1px solid rgba(148, 163, 184, 0.24)',
        borderRadius: '1rem',
        background: 'rgba(15, 23, 42, 0.86)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)'
      }}
    >
      <p style={{ color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        NexusSpace setup required
      </p>
      <h1 style={{ margin: '0.75rem 0', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)' }}>
        Connect your Supabase project
      </h1>
      <p style={{ color: '#cbd5e1', lineHeight: 1.65 }}>
        The site is running, but its Supabase environment variables are missing or invalid.
        Add the values in Vercel, then redeploy this project.
      </p>
      <ol style={{ color: '#cbd5e1', lineHeight: 1.9, paddingLeft: '1.4rem' }}>
        <li>In Vercel, open this project’s Settings → Environment Variables.</li>
        <li>
          Set <code>VITE_SUPABASE_URL</code> to the Supabase Project URL
          (for example, <code>https://your-project.supabase.co</code>).
        </li>
        <li>
          Set <code>VITE_SUPABASE_ANON_KEY</code> to the Supabase Publishable key
          (<code>sb_publishable_…</code>), never a Secret key.
        </li>
        <li>Apply the variables to Production and redeploy the latest commit.</li>
      </ol>
      <p style={{ marginBottom: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
        These frontend variables are included in the public site bundle. Only use a publishable key here.
      </p>
    </section>
  </main>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLiveSupabaseConfigured ? <App /> : <ConfigurationNotice />}
  </React.StrictMode>
);
