'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function GlobalDateFilter() {
  const { lang, dateFilter, setDateFilter, customDateRange, setCustomDateRange } = useApp();
  const isAr = lang === 'ar';

  const [localCustom, setLocalCustom] = useState(customDateRange);

  const periods = [
    { id: 'all', ar: 'الكل', en: 'All Time' },
    { id: 'today', ar: 'اليوم', en: 'Today' },
    { id: 'week', ar: 'هذا الأسبوع', en: 'This Week' },
    { id: 'month', ar: 'هذا الشهر', en: 'This Month' },
    { id: 'year', ar: 'هذه السنة', en: 'This Year' },
    { id: 'custom', ar: 'مخصص', en: 'Custom' }
  ];

  const handleCustomApply = () => {
    setCustomDateRange(localCustom);
  };

  return (
    <div className="glass-panel" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
          {isAr ? 'فلتر الفترة الزمنية:' : 'Time Filter:'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setDateFilter(p.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: dateFilter === p.id ? 'var(--accent-blue)' : 'var(--glass-bg)',
              color: dateFilter === p.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: dateFilter === p.id ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isAr ? p.ar : p.en}
          </button>
        ))}
      </div>

      {dateFilter === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="date" 
            className="glass-input" 
            value={localCustom.start} 
            onChange={e => setLocalCustom({ ...localCustom, start: e.target.value })}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'إلى' : 'to'}</span>
          <input 
            type="date" 
            className="glass-input" 
            value={localCustom.end} 
            onChange={e => setLocalCustom({ ...localCustom, end: e.target.value })}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          />
          <button 
            className="glass-button" 
            onClick={handleCustomApply}
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '12px' }}
          >
            {isAr ? 'تطبيق' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  );
}
