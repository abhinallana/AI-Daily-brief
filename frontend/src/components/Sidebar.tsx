import React from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span>OpsiAI</span>
      </div>
      <ul className="nav-links">
        <li 
          className={`nav-item ${activeView === 'today' ? 'active' : ''}`}
          onClick={() => onViewChange('today')}
        >
          <span>🏠</span> Today's Brief
        </li>
        <li 
          className={`nav-item ${activeView === 'preferences' ? 'active' : ''}`}
          onClick={() => onViewChange('preferences')}
        >
          <span>⚙️</span> Preferences
        </li>
        <li 
          className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => onViewChange('about')}
        >
          <span>ℹ️</span> About us
        </li>
      </ul>

      {onLogout && (
        <ul className="nav-links" style={{ marginTop: 'auto' }}>
          <li className="nav-item" onClick={onLogout} style={{ color: 'var(--strategic)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
            <span>🚪</span> Sign Out
          </li>
        </ul>
      )}
    </aside>
  );
};
