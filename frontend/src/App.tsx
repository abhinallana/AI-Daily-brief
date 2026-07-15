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
import { Preferences } from './components/Preferences';
import { GoogleSoonModal } from './components/GoogleSoonModal';
import { fetchTodayReport, getProfile, saveProfile, fetchOpsiMetrics } from './services/api';
import type { DailyReport, Article } from './services/api';
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

  // Mobile Native Shell States
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState<'dashboard' | 'reports' | 'topics' | 'bookmarks' | 'profile'>('dashboard');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('opsiai_recent_searches');
    return saved ? JSON.parse(saved) : ["Claude 3.5", "K8s Autoscalers", "AWS Bedrock"];
  });
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  
  // Bookmarks & Metrics State
  const [bookmarks, setBookmarks] = useState<Article[]>(() => 
    JSON.parse(localStorage.getItem('opsiai_bookmarks') || '[]')
  );
  const [metrics, setMetrics] = useState<any>(null);

  // Filters State
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');

  // Theme State
  const [theme, setThemeState] = useState<string>(localStorage.getItem('opsiai_theme') || 'dark');

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('opsiai_theme', newTheme);
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  };

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }, [theme]);

  // Sync isMobile with window resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        if (activeView === 'today') setMobileTab('dashboard');
        else if (activeView === 'preferences') setMobileTab('topics');
        else if (activeView === 'profile') setMobileTab('profile');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView]);

  // Fetch metrics for mobile dashboard
  useEffect(() => {
    if (activeRootView === 'dashboard' && token) {
      async function loadMetrics() {
        try {
          const m = await fetchOpsiMetrics();
          setMetrics(m);
        } catch (e) {
          console.warn("Failed to load metrics, fallbacks will be used.");
        }
      }
      loadMetrics();
    }
  }, [activeRootView, token]);

  const toggleBookmark = (article: Article) => {
    const isBookmarked = bookmarks.some(b => b.link === article.link);
    let updated;
    if (isBookmarked) {
      updated = bookmarks.filter(b => b.link !== article.link);
    } else {
      updated = [...bookmarks, article];
    }
    setBookmarks(updated);
    localStorage.setItem('opsiai_bookmarks', JSON.stringify(updated));
  };

  const handleMobileTabChange = (tab: 'dashboard' | 'reports' | 'topics' | 'bookmarks' | 'profile') => {
    setMobileTab(tab);
    if (tab === 'dashboard') {
      setActiveView('today');
      window.history.pushState(null, '', '/dashboard');
    } else if (tab === 'topics') {
      setActiveView('preferences');
      window.history.pushState(null, '', '/settings');
    } else if (tab === 'profile') {
      setActiveView('profile');
      window.history.pushState(null, '', '/profile');
    } else {
      window.history.pushState(null, '', '/dashboard');
    }
  };

  const handleSearchSubmit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    setSearchQuery(q);
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('opsiai_recent_searches', JSON.stringify(updated));
    setShowSearch(false);
    setMobileTab('reports');
  };

  const handleLogoClick = () => {
    const cachedToken = token || localStorage.getItem('opsiai_token');
    if (cachedToken) {
      setActiveRootView('dashboard');
      setActiveView('today');
      setMobileTab('dashboard');
      window.history.pushState(null, '', '/dashboard');
    } else {
      setActiveRootView('landing');
      window.history.pushState(null, '', '/');
    }
  };

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

  // Supabase Auth state listener and initial session loader (Single Source of Truth)
  useEffect(() => {
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const email = session.user.email || '';
        const userId = session.user.id;
        const mockToken = `supabase-jwt-auth-${userId}`;
        
        setToken(mockToken);
        setUserId(userId);
        setUserEmail(email);
        
        localStorage.setItem('opsiai_token', mockToken);
        localStorage.setItem('opsiai_userid', userId);
        localStorage.setItem('opsiai_email', email);

        // Fetch profile first name
        try {
          const profileData = await getProfile(userId);
          if (profileData) {
            setUserFirstName(profileData.first_name);
            localStorage.setItem('opsiai_firstname', profileData.first_name);
            
            if (profileData.preferred_topics && profileData.preferred_topics.length > 0) {
              const loaded: Record<string, boolean> = {};
              profileData.preferred_topics.forEach((t: string) => {
                loaded[t] = true;
              });
              setEnabledTopics(loaded);
              localStorage.setItem('opsiai_subscriptions', JSON.stringify(loaded));
            }
            localStorage.setItem('opsiai_email_subscribed', profileData.newsletter_enabled ? 'true' : 'false');
            setIsEmailSubscribed(profileData.newsletter_enabled);
          }
        } catch (err) {
          console.warn('API backend connection offline during session mount sync.');
        }

        // Apply path routing for authenticated user
        const path = window.location.pathname;
        if (['/', '', '/login', '/signup'].includes(path)) {
          setActiveRootView('dashboard');
          setActiveView('today');
          window.history.pushState(null, '', '/dashboard');
        } else if (['/dashboard', '/settings', '/profile', '/topics', '/reports'].includes(path) || path.startsWith('/article/')) {
          setActiveRootView('dashboard');
          if (path === '/profile') {
            setActiveView('profile');
            setMobileTab('profile');
          } else if (path === '/settings' || path === '/topics') {
            setActiveView('preferences');
            setMobileTab('topics');
          } else if (path === '/reports') {
            setActiveView('today');
            setMobileTab('reports');
          } else {
            setActiveView('today');
            setMobileTab('dashboard');
          }
        }
      } else {
        // No authenticated session
        const path = window.location.pathname;
        if (['/dashboard', '/settings', '/profile', '/topics', '/reports'].includes(path) || path.startsWith('/article/')) {
          setRedirectPath(path);
          setActiveRootView('login');
          window.history.pushState(null, '', '/login');
        } else if (path === '/login') {
          setActiveRootView('login');
        } else if (path === '/signup') {
          setActiveRootView('signup');
        } else {
          setActiveRootView('landing');
        }
      }
    };

    syncSession();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && session.user) {
        const email = session.user.email || '';
        const userId = session.user.id;
        const mockToken = `supabase-jwt-auth-${userId}`;
        
        setToken(mockToken);
        setUserId(userId);
        setUserEmail(email);
        
        localStorage.setItem('opsiai_token', mockToken);
        localStorage.setItem('opsiai_userid', userId);
        localStorage.setItem('opsiai_email', email);
      } else {
        // Logged out
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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle client-side popstate actions (Browser Back, Forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const cachedToken = localStorage.getItem('opsiai_token');

      if (['/', '', '/landing'].includes(path)) {
        if (cachedToken) {
          // Never force logged in users back to landing!
          setActiveRootView('dashboard');
          setActiveView('today');
          window.history.pushState(null, '', '/dashboard');
        } else {
          setActiveRootView('landing');
        }
      } else if (path === '/login') {
        if (cachedToken) {
          setActiveRootView('dashboard');
          setActiveView('today');
          window.history.pushState(null, '', '/dashboard');
        } else {
          setActiveRootView('login');
        }
      } else if (path === '/signup') {
        if (cachedToken) {
          setActiveRootView('dashboard');
          setActiveView('today');
          window.history.pushState(null, '', '/dashboard');
        } else {
          setActiveRootView('signup');
        }
      } else if (['/dashboard', '/settings', '/profile', '/topics', '/reports'].includes(path) || path.startsWith('/article/')) {
        if (cachedToken) {
          setActiveRootView('dashboard');
          if (path === '/profile') {
            setActiveView('profile');
            setMobileTab('profile');
          } else if (path === '/settings' || path === '/topics') {
            setActiveView('preferences');
            setMobileTab('topics');
          } else if (path === '/reports') {
            setActiveView('today');
            setMobileTab('reports');
          } else {
            setActiveView('today');
            setMobileTab('dashboard');
          }
        } else {
          setRedirectPath(path);
          setActiveRootView('login');
          window.history.pushState(null, '', '/login');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
      else if (path === '/settings' || path === '/topics') setActiveView('preferences');
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
    else if (view === 'preferences') window.history.pushState(null, '', '/settings');
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
          isAuthenticated={!!token}
          onNavigateToDashboard={handleLogoClick}
          onLogout={handleLogout}
          onNavigateToTab={(tab) => {
            setActiveRootView('dashboard');
            if (tab === 'reports') {
              if (isMobile) {
                setMobileTab('reports');
              } else {
                setActiveView('today');
              }
              window.history.pushState(null, '', '/dashboard');
            } else if (tab === 'topics') {
              if (isMobile) {
                setMobileTab('topics');
              } else {
                setActiveView('preferences');
              }
              window.history.pushState(null, '', '/settings');
            } else if (tab === 'profile') {
              if (isMobile) {
                setMobileTab('profile');
              } else {
                setActiveView('profile');
              }
              window.history.pushState(null, '', '/profile');
            }
          }}
        />
      </>
    );
  }

  // 4. Render Authenticated Dashboard Shell
  if (isMobile) {
    // Filter articles based on whitelisted topics, search query, and bottom drawer filters
    const allArticles = report?.articles || [];
    const filteredArticles = allArticles.filter(art => {
      // Whitelist filter
      if (art.category && enabledTopics) {
        const hasTopic = Object.keys(enabledTopics).some(topic => 
          enabledTopics[topic] && 
          (art.category!.toLowerCase().includes(topic.toLowerCase()) || 
           topic.toLowerCase().includes(art.category!.toLowerCase()))
        );
        if (!hasTopic) return false;
      }
      
      // Search query filter
      if (searchQuery) {
        const matchesSearch = 
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (art.ai_summary && art.ai_summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (art.category && art.category.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesSearch) return false;
      }

      // Bottom drawer categories/priorities/sources filters
      if (filterCategory !== 'All' && art.category !== filterCategory) return false;
      if (filterPriority !== 'All' && art.priority !== filterPriority) return false;
      if (filterSource !== 'All' && art.source !== filterSource) return false;

      return true;
    });

    const uniqueCategories = Array.from(new Set(allArticles.map(a => a.category).filter(Boolean))) as string[];
    const uniqueSources = Array.from(new Set(allArticles.map(a => a.source).filter(Boolean))) as string[];

    return (
      <div className="mobile-app-shell">
        {/* Top App Bar */}
        <header className="mobile-top-bar">
          <div className="brand" onClick={handleLogoClick}>
            <img src="/logo.jpg" alt="OpsiAI Logo" />
            <span>OpsiAI</span>
          </div>
          <div className="actions">
            <button className="mobile-icon-btn" onClick={() => setShowSearch(true)}>🔍</button>
            <button className="mobile-icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="mobile-avatar-btn" onClick={() => handleMobileTabChange('profile')}>
              <img 
                src={userFirstName === 'Abhi' 
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' 
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                alt="Avatar" 
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="mobile-content-area">
          {/* Skeleton Loaders */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              <div className="skeleton-loading skeleton-article" />
              <div className="skeleton-loading skeleton-article" />
              <div className="skeleton-loading skeleton-article" />
            </div>
          )}

          {!loading && mobileTab === 'dashboard' && (
            <>
              <div className="mobile-dashboard-header">
                <h1>{getGreeting(userFirstName)}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Let's personalize your AI Intelligence experience.</p>
              </div>
              <div className="mobile-pulse-banner">
                <div className="text">
                  <h2>Today's AI Pulse</h2>
                  <p>Time Saved this week</p>
                </div>
                <div className="value">
                  +{report?.time_saved_minutes || 45}m
                </div>
              </div>
              <div className="mobile-stats-grid">
                <div className="mobile-stat-card">
                  <span className="label">Articles</span>
                  <span className="value">{metrics?.articles_analyzed || 1420}</span>
                </div>
                <div className="mobile-stat-card">
                  <span className="label">Sources</span>
                  <span className="value">{metrics?.trusted_sources || 42}</span>
                </div>
                <div className="mobile-stat-card">
                  <span className="label">Strategic</span>
                  <span className="value">{metrics?.strategic_insights || 180}</span>
                </div>
                <div className="mobile-stat-card">
                  <span className="label">Saved (Hrs)</span>
                  <span className="value">{metrics?.time_saved_hours || 32}h</span>
                </div>
              </div>

              {/* Dismissible subscription card */}
              {!isEmailSubscribed && !isBannerDismissed && (
                <div className="mobile-article-card" style={{ borderLeft: '4px solid var(--primary)', background: 'linear-gradient(135deg, rgba(228, 185, 91, 0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700 }}>📬 Get Daily AI Intelligence</h3>
                  <p className="summary-text">Receive one concise AI Intelligence Report in your inbox every morning. Strategic insights, why it matters explanations, reading time saved.</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                    <button className="btn-primary" onClick={() => setShowSubscribeModal(true)} style={{ padding: '8px 16px', fontSize: '12px', minHeight: '36px' }}>Subscribe</button>
                    <button className="btn-outline" onClick={handleDismissBanner} style={{ padding: '8px 16px', fontSize: '12px', borderColor: 'transparent', minHeight: '36px' }}>Dismiss</button>
                  </div>
                </div>
              )}

              {/* Horizontal screenshots card carousel */}
              <div style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '12px', fontWeight: 800 }}>Onboarding Carousel</h3>
                <div className="mobile-swipe-carousel-wrap">
                  <div className="mobile-swipe-card">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" alt="Dashboard customization" />
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>1. Choose your technical interests</p>
                  </div>
                  <div className="mobile-swipe-card">
                    <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=400&q=80" alt="Concise Briefings" />
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>2. Get concise reports every morning</p>
                  </div>
                  <div className="mobile-swipe-card">
                    <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80" alt="Privacy First" />
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-color)', margin: 0 }}>3. Dynamic toggles respect your privacy</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && mobileTab === 'reports' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Today's AI Feed</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {searchQuery && (
                    <button className="mobile-badge category" style={{ border: 'none', background: 'rgba(255, 90, 95, 0.15)', color: 'var(--strategic)' }} onClick={() => setSearchQuery('')}>
                      Clear Search ✕
                    </button>
                  )}
                  <button className="mobile-icon-btn" style={{ width: '38px', height: '38px' }} onClick={() => setShowFilterDrawer(true)}>⚙️</button>
                </div>
              </div>

              {filteredArticles.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📰</div>
                  <h3>No matching articles</h3>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Verify your whitelisted topic subscriptions in the Topics tab or clear your filters.</p>
                </div>
              ) : (
                <div className="mobile-feed-container">
                  {filteredArticles.map(article => {
                    const isBookmarked = bookmarks.some(b => b.link === article.link);
                    return (
                      <div className="mobile-article-card" key={article.link}>
                        <div className="meta-badges">
                          {article.category && <span className="mobile-badge category">{article.category}</span>}
                          {article.priority && (
                            <span className={`mobile-badge priority-${article.priority.toLowerCase()}`}>
                              {article.priority}
                            </span>
                          )}
                          {article.reading_time && <span className="mobile-badge category">{article.reading_time}</span>}
                        </div>
                        <h3>{article.title}</h3>
                        {article.ai_summary && <p className="summary-text">{article.ai_summary}</p>}
                        {article.why_it_matters && (
                          <div className="why-matters-box">
                            <strong>Why It Matters</strong>
                            <p>{article.why_it_matters}</p>
                          </div>
                        )}
                        <div className="mobile-card-actions">
                          <a href={article.link} target="_blank" rel="noopener noreferrer" className="mobile-read-link">
                            Read Article ↗
                          </a>
                          <div className="mobile-action-buttons">
                            <button 
                              className="mobile-icon-btn" 
                              style={{ width: '36px', height: '36px', backgroundColor: isBookmarked ? 'var(--primary-glow)' : '' }} 
                              onClick={() => toggleBookmark(article)}
                            >
                              {isBookmarked ? '🔖' : '🗂️'}
                            </button>
                            <button 
                              className="mobile-icon-btn" 
                              style={{ width: '36px', height: '36px' }} 
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ title: article.title, url: article.link }).catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(article.link);
                                  alert('Article link copied to clipboard!');
                                }
                              }}
                            >
                              📤
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && mobileTab === 'topics' && (
            <div className="mobile-topics-section">
              <div style={{ marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Configure Intelligence Feed</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Your selections directly filter your dashboard reports and daily email updates.</p>
              </div>
              <Preferences 
                enabledTopics={enabledTopics} 
                onSave={setEnabledTopics} 
                userEmail={userEmail} 
                isEmailSubscribed={isEmailSubscribed}
                onSetEmailSubscribed={setIsEmailSubscribed}
              />
            </div>
          )}

          {!loading && mobileTab === 'bookmarks' && (
            <>
              <div style={{ marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Saved Briefings</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Offline-ready bookmarks you have saved for reading.</p>
              </div>

              {bookmarks.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔖</div>
                  <h3>No Saved Briefings</h3>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>Tap the folder icon on any article card to save it here for later reading.</p>
                </div>
              ) : (
                <div className="mobile-feed-container">
                  {bookmarks.map(article => {
                    return (
                      <div className="mobile-article-card" key={article.link}>
                        <div className="meta-badges">
                          {article.category && <span className="mobile-badge category">{article.category}</span>}
                          {article.priority && (
                            <span className={`mobile-badge priority-${article.priority.toLowerCase()}`}>
                              {article.priority}
                            </span>
                          )}
                          {article.reading_time && <span className="mobile-badge category">{article.reading_time}</span>}
                        </div>
                        <h3>{article.title}</h3>
                        {article.ai_summary && <p className="summary-text">{article.ai_summary}</p>}
                        {article.why_it_matters && (
                          <div className="why-matters-box">
                            <strong>Why It Matters</strong>
                            <p>{article.why_it_matters}</p>
                          </div>
                        )}
                        <div className="mobile-card-actions">
                          <a href={article.link} target="_blank" rel="noopener noreferrer" className="mobile-read-link">
                            Read Article ↗
                          </a>
                          <div className="mobile-action-buttons">
                            <button 
                              className="mobile-icon-btn" 
                              style={{ width: '36px', height: '36px', backgroundColor: 'var(--primary-glow)' }} 
                              onClick={() => toggleBookmark(article)}
                            >
                              🔖
                            </button>
                            <button 
                              className="mobile-icon-btn" 
                              style={{ width: '36px', height: '36px' }} 
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({ title: article.title, url: article.link }).catch(() => {});
                                } else {
                                  navigator.clipboard.writeText(article.link);
                                  alert('Article link copied to clipboard!');
                                }
                              }}
                            >
                              📤
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!loading && mobileTab === 'profile' && userId && userEmail && (
            <div className="mobile-settings-container">
              <div style={{ marginBottom: '4px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Account Settings</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Configure your identity, appearance theme, and subscriptions.</p>
              </div>
              <ProfilePage 
                userId={userId} 
                userEmail={userEmail} 
                defaultView="profile"
                onProfileUpdated={setUserFirstName}
              />
              <button 
                className="btn-outline" 
                onClick={handleLogout} 
                style={{ 
                  marginTop: '10px', 
                  borderColor: 'var(--strategic)', 
                  color: 'var(--strategic)', 
                  minHeight: '48px', 
                  borderRadius: '12px',
                  fontWeight: 700 
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </main>

        {/* Bottom Nav Bar */}
        <nav className="mobile-bottom-nav">
          <button className={`mobile-nav-item ${mobileTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleMobileTabChange('dashboard')}>
            <div className="icon">🏠</div>
            <span>Home</span>
          </button>
          <button className={`mobile-nav-item ${mobileTab === 'reports' ? 'active' : ''}`} onClick={() => handleMobileTabChange('reports')}>
            <div className="icon">📰</div>
            <span>Feed</span>
          </button>
          <button className={`mobile-nav-item ${mobileTab === 'topics' ? 'active' : ''}`} onClick={() => handleMobileTabChange('topics')}>
            <div className="icon">💡</div>
            <span>Topics</span>
          </button>
          <button className={`mobile-nav-item ${mobileTab === 'bookmarks' ? 'active' : ''}`} onClick={() => handleMobileTabChange('bookmarks')}>
            <div className="icon">🔖</div>
            <span>Saved</span>
          </button>
          <button className={`mobile-nav-item ${mobileTab === 'profile' ? 'active' : ''}`} onClick={() => handleMobileTabChange('profile')}>
            <div className="icon">⚙️</div>
            <span>Settings</span>
          </button>
        </nav>

        {/* Full Screen Search Overlay */}
        {showSearch && (
          <div className="mobile-search-overlay">
            <div className="mobile-search-header">
              <div className="mobile-search-input-wrap">
                <input 
                  type="text" 
                  placeholder="Search articles or categories..." 
                  autoFocus 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearchSubmit(e.currentTarget.value);
                  }}
                />
              </div>
              <button className="mobile-search-close-text" onClick={() => setShowSearch(false)}>Cancel</button>
            </div>
            <div className="mobile-search-content">
              <div>
                <h3 className="mobile-search-section-title">Recent Searches</h3>
                <ul className="mobile-search-list">
                  {recentSearches.map(q => (
                    <li className="mobile-search-item" key={q} onClick={() => handleSearchSubmit(q)}>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mobile-search-section-title">Trending Topics</h3>
                <div className="mobile-search-tags">
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Claude 3.5 Sonnet')}>Claude 3.5 Sonnet</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Reasoning Models')}>Reasoning Models</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Orchestrator APIs')}>Orchestrator APIs</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('TPU clusters')}>TPU clusters</span>
                </div>
              </div>
              <div>
                <h3 className="mobile-search-section-title">Popular Companies</h3>
                <div className="mobile-search-tags">
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('OpenAI')}>OpenAI</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Anthropic')}>Anthropic</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Google')}>Google</span>
                  <span className="mobile-search-tag" onClick={() => handleSearchSubmit('Meta AI')}>Meta AI</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Drawer Filters */}
        {showFilterDrawer && (
          <>
            <div className="drawer-backdrop" onClick={() => setShowFilterDrawer(false)} />
            <div className="bottom-drawer">
              <div className="drawer-drag-handle" />
              <h3 className="drawer-title">Filter Feed</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Category</label>
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', padding: '0 12px' }}
                  >
                    <option value="All">All Categories</option>
                    {uniqueCategories.map(cat => <option value={cat} key={cat}>{cat}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Priority</label>
                  <select 
                    value={filterPriority} 
                    onChange={(e) => setFilterPriority(e.target.value)}
                    style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', padding: '0 12px' }}
                  >
                    <option value="All">All Priorities</option>
                    <option value="Strategic">Strategic Only</option>
                    <option value="Important">Important Only</option>
                    <option value="Insights">Insights Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Source</label>
                  <select 
                    value={filterSource} 
                    onChange={(e) => setFilterSource(e.target.value)}
                    style={{ width: '100%', height: '44px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', padding: '0 12px' }}
                  >
                    <option value="All">All Sources</option>
                    {uniqueSources.map(src => <option value={src} key={src}>{src}</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    className="btn-outline" 
                    onClick={() => {
                      setFilterCategory('All');
                      setFilterPriority('All');
                      setFilterSource('All');
                      setShowFilterDrawer(false);
                    }}
                    style={{ flex: 1, minHeight: '44px', borderRadius: '8px' }}
                  >
                    Reset
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => setShowFilterDrawer(false)}
                    style={{ flex: 1, minHeight: '44px', borderRadius: '8px' }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Global Overlays */}
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
  }

  // 4. Render Authenticated Dashboard Shell
  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        onViewChange={navigateToView} 
        onLogout={handleLogout} 
        onLogoClick={handleLogoClick}
        isEmailSubscribed={isEmailSubscribed}
        onEnableEmailClick={() => setShowSubscribeModal(true)}
      />
      
      <main className="main-content">
        {activeView === 'today' && renderTodayView()}
        {activeView === 'preferences' && (
          <Preferences 
            enabledTopics={enabledTopics} 
            onSave={setEnabledTopics} 
            userEmail={userEmail} 
            isEmailSubscribed={isEmailSubscribed}
            onSetEmailSubscribed={setIsEmailSubscribed}
          />
        )}
        {activeView === 'profile' && userId && userEmail && (
          <ProfilePage 
            userId={userId} 
            userEmail={userEmail} 
            defaultView="profile"
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
