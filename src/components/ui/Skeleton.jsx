import React from 'react';

export const SkeletonCard = () => (
  <div className="glass-card" style={{ padding: '1.25rem' }}>
    <div className="skeleton" style={{ height: '180px', width: '100%', marginBottom: '1rem' }}></div>
    <div className="skeleton" style={{ height: '24px', width: '70%', marginBottom: '0.75rem' }}></div>
    <div className="skeleton" style={{ height: '16px', width: '100%', marginBottom: '0.5rem' }}></div>
    <div className="skeleton" style={{ height: '16px', width: '85%', marginBottom: '1.25rem' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="skeleton" style={{ height: '28px', width: '90px', borderRadius: '999px' }}></div>
      <div className="skeleton" style={{ height: '28px', width: '70px', borderRadius: '999px' }}></div>
    </div>
  </div>
);

export const SkeletonRow = () => (
  <div className="glass-card" style={{ padding: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
      <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
      <div className="skeleton" style={{ height: '20px', width: '50%' }}></div>
    </div>
    <div className="skeleton" style={{ height: '24px', width: '80px', borderRadius: '999px' }}></div>
  </div>
);
