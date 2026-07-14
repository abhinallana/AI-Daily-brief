import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SnapshotBar } from './components/SnapshotBar';
import { Takeaways } from './components/Takeaways';
import { ArticleFeed } from './components/ArticleFeed';
import { Preferences } from './components/Preferences';
import { AboutUs } from './components/AboutUs';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { fetchTodayReport } from './services/api';
import type { DailyReport } from './services/api';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('today');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auth states
  const [token, setToken] = useState<string | null>(localStorage.getItem('opsiai_token'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('opsiai_email'));
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // If authenticated or in demo mode, fetch data
    if (token || isDemoMode) {
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
    }
  }, [token, isDemoMode]);

  const handleLoginSuccess = (newToken: string, email: string) => {
    setToken(newToken);
    setUserEmail(email);
    localStorage.setItem('opsiai_token', newToken);
    localStorage.setItem('opsiai_email', email);
    setIsDemoMode(false);
  };

  const handleLogout = () => {
    setToken(null);
    setUserEmail(null);
    localStorage.removeItem('opsiai_token');
    localStorage.removeItem('opsiai_email');
    setIsDemoMode(false);
  };

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
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--strategic)', marginBottom: '8px' }}>API Connection Offline</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-primary"
              style={{ fontSize: '13px', padding: '10px 18px' }}
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
            <button
              className="btn-outline"
              style={{ fontSize: '13px', padding: '10px 18px' }}
              onClick={() => {
                // Load mock daily brief data
                setError(null);
                setReport({
                  date: new Date().toISOString().split('T')[0],
                  biggest_announcement: "OpenAI launched GPT-Live featuring native agentic loops and speech channels.",
                  biggest_trend: "Platform orchestrators are moving toward unified APIs to bypass heavy integration wrappers.",
                  one_thing_to_know: "GPT-Live APIs significantly reduce context loading overhead, saving up to 60% of dev runtimes.",
                  time_saved_minutes: 45,
                  articles: [
                    {
                      title: "Introducing GPT-Live Agentic Orchestrator",
                      link: "https://openai.com",
                      published_at: "July 14, 2026",
                      source: "OpenAI News",
                      icon: "🤖",
                      ai_summary: "OpenAI releases native loop APIs lowering dev integration limits.",
                      category: "OpenAI",
                      priority: "Strategic",
                      why_it_matters: "Engineers should check native agent support to streamline infrastructure pipelines.",
                      is_relevant: true,
                      reading_time: "3 min read"
                    },
                    {
                      title: "Kubernetes v1.31 Enhances Scheduling Efficiency",
                      link: "https://kubernetes.io",
                      published_at: "July 14, 2026",
                      source: "Kubernetes Blog",
                      icon: "⚓",
                      ai_summary: "Kubelet resource monitoring patches boost node scaling concurrency.",
                      category: "Kubernetes",
                      priority: "Important",
                      why_it_matters: "Directly improves scheduler performance under heavy container deployments.",
                      is_relevant: true,
                      reading_time: "5 min read"
                    }
                  ]
                });
              }}
            >
              Load Premium Sandbox Brief
            </button>
          </div>
        </div>
      );
    }

    if (!report) return null;

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {isDemoMode && (
          <div className="article-card" style={{ borderLeft: '4px solid var(--important)', padding: '12px 18px', marginBottom: '24px', background: 'rgba(245, 158, 11, 0.05)' }}>
            <p style={{ color: 'var(--important)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
              💡 Guest Demo Mode. <span style={{ textDecoration: 'underline', cursor: 'pointer', marginLeft: '4px', color: 'var(--text-color)' }} onClick={() => setIsLoginOpen(true)}>Create a free account</span> to configure daily email delivery and subscribe to categories!
            </p>
          </div>
        )}

        <div className="header-banner">
          <h1>Good Morning, {userEmail ? userEmail.split('@')[0].toUpperCase() : 'Guest'} 👋</h1>
          <p>Here are today's latest AI updates and briefings computed by OpsiAI.</p>
        </div>

        <Takeaways report={report} />
        <SnapshotBar articles={report.articles} />
        <ArticleFeed articles={report.articles} />
      </div>
    );
  };

  // If not logged in and not in guest demo mode, show Landing Page
  if (!token && !isDemoMode) {
    return (
      <>
        <LandingPage 
          onOpenLogin={() => setIsLoginOpen(true)} 
          onViewDemo={() => setIsDemoMode(true)} 
        />
        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          onLoginSuccess={handleLoginSuccess} 
        />
      </>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onLogout={handleLogout} 
        onLogoClick={handleLogout}
      />
      
      <main className="main-content">
        {activeView === 'today' && renderTodayView()}
        {activeView === 'preferences' && <Preferences />}
        {activeView === 'about' && <AboutUs />}
      </main>
    </div>
  );
};

export default App;
