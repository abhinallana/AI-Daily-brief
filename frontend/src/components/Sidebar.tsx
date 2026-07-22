import React from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogoClick?: () => void;
  isEmailSubscribed?: boolean;
  onEnableEmailClick?: () => void;
  isGuest?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  onLogoClick,
  isEmailSubscribed,
  onEnableEmailClick,
  isGuest
}) => {
  return (
    <aside className="sidebar">
      <div className="logo" onClick={onLogoClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/logo.jpg" alt="OpsiAI Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
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
          className={`nav-item ${activeView === 'bookmarks' ? 'active' : ''}`}
          onClick={() => onViewChange('bookmarks')}
        >
          <span>🔖</span> Bookmarks
        </li>
        <li
          className={`nav-item ${activeView === 'preferences' ? 'active' : ''}`}
          onClick={() => onViewChange('preferences')}
        >
          <span>⚙️</span> Preferences
        </li>
        {(!isEmailSubscribed || isGuest) && onEnableEmailClick && (
          <li
            className="nav-item"
            onClick={onEnableEmailClick}
            style={{ color: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px', marginTop: '4px', marginBottom: '4px' }}
          >
            <span>📬</span> Enable Email Reports
          </li>
        )}
        <li
          className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <span>👤</span> Profile
        </li>
        <li
          className={`nav-item ${activeView === 'about' ? 'active' : ''}`}
          onClick={() => onViewChange('about')}
        >
          <span>ℹ️</span> About us
        </li>
      </ul>

      <div style={{ marginTop: 'auto' }}>
        {/* Sign Out has been relocated to ProfilePage.tsx */}
      </div>
    </aside>
  );
};
