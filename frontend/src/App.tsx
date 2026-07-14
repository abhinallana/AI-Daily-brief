import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SnapshotBar } from './components/SnapshotBar';
import { Takeaways } from './components/Takeaways';
import { ArticleFeed } from './components/ArticleFeed';
import { AboutUs } from './components/AboutUs';
import { LandingPage } from './components/LandingPage';
import { LoginPage, SignUpPage } from './components/AuthPages';
import { WelcomeModal } from './components/WelcomeModal';
import { SubscribeModal } from './components/SubscribeModal';
import { ProfilePage } from './components/ProfilePage';
import { GoogleSoonModal } from './components/GoogleSoonModal';
import { fetchTodayReport, getProfile, saveProfile } from './services/api';
import type { DailyReport } from './services/api';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  // Routing states
  const [activeRootView, setActiveRootView] = useState<'landing' | 'login' | 'signup' | 'dashboard'>('landing');
  const [activeView, setActiveView] = useState<string>('today');
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Data states
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auth & Profile states
  const [token, setToken] = useState<string | null>(localStorage.getItem('opsiai_token'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('opsiai_userid'));
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('opsiai_email'));
  const [userFirstName, setUserFirstName] = useState<string>(localStorage.getItem('opsiai_firstname') || 'Reader');

  // Subscriptions & Onboarding states
  const [isEmailSubscribed, setIsEmailSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('opsiai_email_subscribed') === 'true';
  });
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('opsiai_banner_dismissed') === 'true';
  });
  
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showGoogleSoon, setShowGoogleSoon] = useState(false);

  const [enabledTopics, setEnabledTopics] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('opsiai_subscriptions');
    if (saved) return JSON.parse(saved);
    return {
      'OpenAI': true,
      'Anthropic': true,
      'Meta AI': true,
      'Google Gemini': true,
      'Kubernetes': true,
      'AWS': true,
      'Google Cloud': true,
      'GitHub': true,
      'Hugging Face': true,
      'Vercel': true
    };
  });

  // URL listener and router
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const cachedToken = localStorage.getItem('opsiai_token');

      if (path === '/' || path === '') {
        setActiveRootView('landing');
      } else if (path === '/login') {
        setActiveRootView('login');
      } else if (path === '/signup') {
        setActiveRootView('signup');
      } else if (['/dashboard', '/settings', '/profile', '/topics'].includes(path)) {
        if (cachedToken) {
          setActiveRootView('dashboard');
          if (path === '/profile') setActiveView('profile');
          else if (path === '/settings' || path === '/topics') setActiveView('settings');
          else setActiveView('today');
        } else {
          // Unauthenticated redirect to Login
          setRedirectPath(path);
          setActiveRootView('login');
          window.history.pushState(null, '', '/login');
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  // Fetch report when dashboard view active
  useEffect(() => {
    if (activeRootView === 'dashboard' && token) {
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
  }, [activeRootView, token]);

  // Load first name on initialization or login
  useEffect(() => {
    if (userId && token) {
      async function loadProfile() {
        try {
          const data = await getProfile(userId!);
          if (data) {
            setUserFirstName(data.first_name);
            localStorage.setItem('opsiai_firstname', data.first_name);
          }
        } catch (err) {
          console.warn('API connection offline. Using locally cached greeting.');
        }
      }
      loadProfile();
    }
  }, [userId, token]);

  const handleLoginSuccess = async (newUserId: string, email: string) => {
    // Generate mock token for supabase session compatibility
    const mockToken = `supabase-jwt-auth-${newUserId}`;
    setToken(mockToken);
    setUserId(newUserId);
    setUserEmail(email);
    
    localStorage.setItem('opsiai_token', mockToken);
    localStorage.setItem('opsiai_userid', newUserId);
    localStorage.setItem('opsiai_email', email);

    // Fetch profile first name
    try {
      const data = await getProfile(newUserId);
      if (data) {
        setUserFirstName(data.first_name);
        localStorage.setItem('opsiai_firstname', data.first_name);
        
        // Populate local subscriptions from profile
        if (data.preferred_topics && data.preferred_topics.length > 0) {
          const loaded: Record<string, boolean> = {};
          data.preferred_topics.forEach((t: string) => {
            loaded[t] = true;
          });
          setEnabledTopics(loaded);
          localStorage.setItem('opsiai_subscriptions', JSON.stringify(loaded));
        }
        localStorage.setItem('opsiai_email_subscribed', data.newsletter_enabled ? 'true' : 'false');
        setIsEmailSubscribed(data.newsletter_enabled);
      }
    } catch (err) {
      console.warn('API backend connection offline during login sync.');
    }

    // Determine redirection routing
    if (redirectPath) {
      const path = redirectPath;
      setRedirectPath(null);
      setActiveRootView('dashboard');
      if (path === '/profile') setActiveView('profile');
      else if (path === '/settings' || path === '/topics') setActiveView('settings');
      else setActiveView('today');
      window.history.pushState(null, '', path);
    } else {
      setActiveRootView('dashboard');
      setActiveView('today');
      window.history.pushState(null, '', '/dashboard');
    }
  };

  const handleSignUpSuccess = (newUserId: string, email: string, firstName: string, _lastName: string) => {
    // Save state
    const mockToken = `supabase-jwt-auth-${newUserId}`;
    setToken(mockToken);
    setUserId(newUserId);
    setUserEmail(email);
    setUserFirstName(firstName);
    
    localStorage.setItem('opsiai_token', mockToken);
    localStorage.setItem('opsiai_userid', newUserId);
    localStorage.setItem('opsiai_email', email);
    localStorage.setItem('opsiai_firstname', firstName);

    // Navigate to dashboard
    setActiveRootView('dashboard');
    setActiveView('today');
    window.history.pushState(null, '', '/dashboard');

    // Trigger onboarding Welcome Personalization immediately after signup
    setShowWelcomeModal(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setUserFirstName('Reader');
    
    localStorage.removeItem('opsiai_token');
    localStorage.removeItem('opsiai_userid');
    localStorage.removeItem('opsiai_email');
    localStorage.removeItem('opsiai_firstname');
    localStorage.removeItem('opsiai_email_subscribed');
    localStorage.removeItem('opsiai_banner_dismissed');

    setActiveRootView('landing');
    window.history.pushState(null, '', '/');
  };

  const handleWelcomeNext = (selectedTopics: string[]) => {
    setShowWelcomeModal(false);

    if (selectedTopics.length > 0) {
      const updatedTopics: Record<string, boolean> = {
        'OpenAI': false,
        'Anthropic': false,
        'Meta AI': false,
        'Google Gemini': false,
        'Kubernetes': false,
        'AWS': false,
        'Google Cloud': false,
        'GitHub': false,
        'Hugging Face': false,
        'Vercel': false
      };
      selectedTopics.forEach(topic => {
        updatedTopics[topic] = true;
      });
      setEnabledTopics(updatedTopics);
      localStorage.setItem('opsiai_subscriptions', JSON.stringify(updatedTopics));

      // Async sync back to Postgres user profile
      if (userId && userEmail) {
        saveProfile({
          id: userId,
          first_name: userFirstName,
          email: userEmail,
          preferred_topics: selectedTopics,
          newsletter_enabled: isEmailSubscribed,
          theme: localStorage.getItem('opsiai_theme') || 'dark'
        }).catch(err => console.warn('Offline profile topics sync skipped.', err));
      }
    }

    setShowSubscribeModal(true);
  };

  const handleSubscribeConfirm = () => {
    setIsEmailSubscribed(true);
    localStorage.setItem('opsiai_email_subscribed', 'true');
    setShowSubscribeModal(false);

    if (userId && userEmail) {
      // Fetch current enabled topics from localStorage
      const topicsObj = JSON.parse(localStorage.getItem('opsiai_subscriptions') || '{}');
      const activeList = Object.keys(topicsObj).filter(k => topicsObj[k]);
      
      saveProfile({
        id: userId,
        first_name: userFirstName,
        email: userEmail,
        preferred_topics: activeList,
        newsletter_enabled: true,
        theme: localStorage.getItem('opsiai_theme') || 'dark'
      }).catch(err => console.warn('Offline profile newsletter sync skipped.', err));
    }

    localStorage.setItem(`opsiai_onboarding_${userId}`, 'true');
  };

  const handleSubscribeLater = () => {
    setShowSubscribeModal(false);
    localStorage.setItem(`opsiai_onboarding_${userId}`, 'true');
  };

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('opsiai_banner_dismissed', 'true');
  };

  const navigateToView = (view: string) => {
    setActiveView(view);
    if (view === 'profile') window.history.pushState(null, '', '/profile');
    else if (view === 'settings') window.history.pushState(null, '', '/settings');
    else window.history.pushState(null, '', '/dashboard');
  };

  const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good Morning, ${name} 👋`;
    if (hour < 17) return `Good Afternoon, ${name} 👋`;
    return `Good Evening, ${name} 👋`;
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

    // Filter articles based on enabled subscriptions
    const filteredArticles = report.articles.filter(article => {
      if (!article.category) return true;
      
      const matchKey = Object.keys(enabledTopics).find(
        key => key.toLowerCase().includes(article.category!.toLowerCase()) || 
               article.category!.toLowerCase().includes(key.toLowerCase())
      );
      
      if (matchKey !== undefined) {
        return enabledTopics[matchKey] !== false;
      }
      return true;
    });

    const filteredReport = {
      ...report,
      articles: filteredArticles
    };

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* Dismissible top subscription banner */}
        {!isEmailSubscribed && !isBannerDismissed && (
          <div 
            className="article-card" 
            style={{ 
              borderLeft: '4px solid var(--primary)', 
              padding: '12px 18px', 
              marginBottom: '24px', 
              background: 'rgba(228, 185, 91, 0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <p style={{ color: 'var(--text-color)', fontSize: '13px', fontWeight: 600, margin: 0 }}>
              💡 You're reading today's report online. Get tomorrow's report delivered automatically.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowSubscribeModal(true)}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                Enable
              </button>
              <button 
                className="btn-outline" 
                onClick={handleDismissBanner}
                style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'transparent' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="header-banner">
          <h1>{getGreeting(userFirstName)}</h1>
          <p>Here are today's latest AI updates and briefings computed by OpsiAI.</p>
        </div>

        <Takeaways report={filteredReport} />
        <SnapshotBar articles={filteredArticles} />
        <ArticleFeed articles={filteredArticles} />

        {/* Bottom Premium CTA Card if not subscribed */}
        {!isEmailSubscribed && (
          <div 
            className="cta-container" 
            style={{ 
              marginTop: '40px', 
              padding: '40px 30px', 
              background: 'linear-gradient(180deg, rgba(228, 185, 91, 0.02) 0%, rgba(0,0,0,0) 100%)',
              textAlign: 'center',
              border: '1px solid var(--border)',
              borderRadius: '12px'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>Enjoying today's report?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Receive tomorrow's report automatically in your inbox.
            </p>
            <button className="btn-primary" onClick={() => setShowSubscribeModal(true)} style={{ padding: '12px 28px' }}>
              Enable Daily Intelligence
            </button>
          </div>
        )}
      </div>
    );
  };

  // 1. Render Signup Page
  if (activeRootView === 'signup') {
    return (
      <>
        <SignUpPage 
          onNavigateToLogin={() => {
            setActiveRootView('login');
            window.history.pushState(null, '', '/login');
          }} 
          onSignUpSuccess={handleSignUpSuccess} 
          onClose={() => {
            setActiveRootView('landing');
            window.history.pushState(null, '', '/');
          }}
          onGoogleClick={() => setShowGoogleSoon(true)}
        />
        <GoogleSoonModal 
          isOpen={showGoogleSoon}
          onClose={() => setShowGoogleSoon(false)}
        />
      </>
    );
  }

  // 2. Render Login Page
  if (activeRootView === 'login') {
    return (
      <>
        <LoginPage 
          onNavigateToSignUp={() => {
            setActiveRootView('signup');
            window.history.pushState(null, '', '/signup');
          }} 
          onLoginSuccess={handleLoginSuccess} 
          onClose={() => {
            setActiveRootView('landing');
            window.history.pushState(null, '', '/');
          }}
          onGoogleClick={() => setShowGoogleSoon(true)}
        />
        <GoogleSoonModal 
          isOpen={showGoogleSoon}
          onClose={() => setShowGoogleSoon(false)}
        />
      </>
    );
  }

  // 3. Render Landing Page
  if (activeRootView === 'landing') {
    return (
      <>
        <LandingPage 
          onNavigateToLogin={() => {
            setActiveRootView('login');
            window.history.pushState(null, '', '/login');
          }}
          onNavigateToSignUp={() => {
            setActiveRootView('signup');
            window.history.pushState(null, '', '/signup');
          }} 
          onViewDemo={() => {
            // Set dummy demo params
            setToken('demo-token-opsiai');
            setUserId('demo-guest-id');
            setUserEmail('guest@opsiai.com');
            setUserFirstName('Guest');
            setActiveRootView('dashboard');
            setActiveView('today');
            window.history.pushState(null, '', '/dashboard');
          }} 
        />
      </>
    );
  }

  // 4. Render Authenticated Dashboard Shell
  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        onViewChange={navigateToView} 
        onLogout={handleLogout} 
        onLogoClick={handleLogout}
        isEmailSubscribed={isEmailSubscribed}
        onEnableEmailClick={() => setShowSubscribeModal(true)}
      />
      
      <main className="main-content">
        {activeView === 'today' && renderTodayView()}
        {activeView === 'profile' && userId && userEmail && (
          <ProfilePage 
            userId={userId} 
            userEmail={userEmail} 
            defaultView="profile"
            onProfileUpdated={setUserFirstName}
          />
        )}
        {activeView === 'settings' && userId && userEmail && (
          <ProfilePage 
            userId={userId} 
            userEmail={userEmail} 
            defaultView="settings"
            onProfileUpdated={setUserFirstName}
          />
        )}
        {activeView === 'about' && <AboutUs />}
      </main>

      {/* Global Welcome & Onboarding Overlays */}
      <WelcomeModal 
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onNext={handleWelcomeNext}
        firstName={userFirstName}
      />

      <SubscribeModal 
        isOpen={showSubscribeModal}
        onClose={handleSubscribeLater}
        onSubscribe={handleSubscribeConfirm}
      />

      <GoogleSoonModal 
        isOpen={showGoogleSoon}
        onClose={() => setShowGoogleSoon(false)}
      />
    </div>
  );
};

export default App;
