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
        The site is running, but the Supabase URL or public key is missing or invalid.
        Copy the two different values below from your Supabase project, add them in Vercel,
        then redeploy.
      </p>
      <ol style={{ color: '#cbd5e1', lineHeight: 1.9, paddingLeft: '1.4rem' }}>
        <li>
          In Supabase, open your project’s <strong>Settings → API</strong> and copy the
          <strong> Project URL</strong>. It starts with <code>https://</code>; it is not an API key.
        </li>
        <li>
          In Supabase <strong>Settings → API Keys</strong>, copy the <strong>Publishable key</strong>.
          It starts with <code>sb_publishable_</code>. Do not copy the Secret key.
        </li>
        <li>
          In Vercel, open this project’s <strong>Settings → Environment Variables</strong> and add:
          <pre style={{ overflowX: 'auto', padding: '0.85rem', borderRadius: '0.5rem', background: '#020617', lineHeight: 1.6 }}>
            <code>{'VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_YOUR_PUBLIC_KEY'}</code>
          </pre>
        </li>
        <li>
          Paste each value without quotes or placeholder text. Set both variables for
          <strong> Production</strong>, save, then redeploy the latest commit.
        </li>
      </ol>
      <p style={{ marginBottom: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
        <code>VITE_SUPABASE_URL</code> must be a URL, while <code>VITE_SUPABASE_ANON_KEY</code> must be
        a Publishable key. Never use an <code>sb_secret_</code> or <code>service_role</code> key here:
        Vite frontend variables are public.
      </p>
    </section>
  </main>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLiveSupabaseConfigured ? <App /> : <ConfigurationNotice />}
  </React.StrictMode>
);
