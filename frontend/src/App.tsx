import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SnapshotBar } from './components/SnapshotBar';
import { Takeaways } from './components/Takeaways';
import { ArticleFeed } from './components/ArticleFeed';
import { Preferences } from './components/Preferences';
import { AboutUs } from './components/AboutUs';
import { fetchTodayReport } from './services/api';
import type { DailyReport } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('today');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTodayReport();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report from OpsiAI API.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const renderTodayView = () => {
    if (loading) {
      return (
        <div className="loader-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)' }}>Fetching today's AI updates...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="article-card" style={{ borderLeft: '4px solid var(--strategic)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--strategic)', marginBottom: '8px' }}>API Error</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
          <button 
            className="filter-btn active" 
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                const data = await fetchTodayReport();
                setReport(data);
              } catch (err: any) {
                setError(err.message || 'Failed to reload report.');
              } finally {
                setLoading(false);
              }
            }}
          >
            Retry Connection
          </button>
        </div>
      );
    }

    if (!report) return null;

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div className="header-banner">
          <h1>Good Morning, Abhi 👋</h1>
          <p>Here are today's latest AI updates and briefings computed by OpsiAI.</p>
        </div>

        <Takeaways report={report} />
        <SnapshotBar articles={report.articles} />
        <ArticleFeed articles={report.articles} />
      </div>
    );
  };

  return (
    <div className="app-container">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="main-content">
        {activeView === 'today' && renderTodayView()}
        {activeView === 'preferences' && <Preferences />}
        {activeView === 'about' && <AboutUs />}
      </main>
    </div>
  );
};

export default App;
