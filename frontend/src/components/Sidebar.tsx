import React from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  isEmailSubscribed?: boolean;
  onEnableEmailClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  onLogout, 
  onLogoClick,
  isEmailSubscribed,
  onEnableEmailClick
}) => {
  return (
    <aside className="sidebar">
      <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
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
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <span>👤</span> Profile
        </li>
        <li 
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <span>⚙️</span> Settings
        </li>
        <li 
          className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => onViewChange('about')}
        >
          <span>ℹ️</span> About us
        </li>
      </ul>

      <div style={{ marginTop: 'auto' }}>
        {!isEmailSubscribed && onEnableEmailClick && (
          <ul className="nav-links" style={{ marginBottom: '16px' }}>
            <li className="nav-item" onClick={onEnableEmailClick} style={{ color: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
              <span>📬</span> Daily Briefs
              <span style={{ display: 'block', fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>Enable Email Reports</span>
            </li>
          </ul>
        )}

        {onLogout && (
          <ul className="nav-links">
            <li className="nav-item" onClick={onLogout} style={{ color: 'var(--strategic)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
              <span>🚪</span> Sign Out
            </li>
          </ul>
        )}
      </div>
    </aside>
  );
};
