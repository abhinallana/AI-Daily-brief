import React, { useState, useEffect } from 'react';
import { fetchTopicCounts, fetchPreferences, savePreferences } from '../services/api';
import { useToast } from './ToastContext';
import { CustomSelect } from './CustomSelect';

interface Topic {
  id: string;
  name: string;
  icon: string;
  description: string;
  countThisWeek: number;
  recommended?: boolean;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  topics: Topic[];
}

const CATEGORIES: Category[] = [
  {
    id: 'ai-models',
    title: 'AI Models & Reasoning Systems',
    icon: '🧠',
    topics: [
      { id: 'OpenAI', name: 'OpenAI', icon: '🤖', description: 'ChatGPT releases, live audio streaming & Orchestrator APIs.', countThisWeek: 0, recommended: true },
      { id: 'Anthropic', name: 'Anthropic', icon: '🧠', description: 'Claude models, Reasoning parameters & Model Context Protocol.', countThisWeek: 0, recommended: true },
      { id: 'Meta AI', name: 'Meta AI', icon: '🦙', description: 'Llama architectures, open-weights releases & PyTorch tools.', countThisWeek: 0 },
      { id: 'Google Gemini', name: 'Google Gemini', icon: '⚡', description: 'Gemini context expansions, Flash fine-tunes & Vertex platforms.', countThisWeek: 0 },
      { id: 'Mistral AI', name: 'Mistral AI', icon: '🌬️', description: 'Mixture of Experts models, codegen weights, and French AI news.', countThisWeek: 0 },
      { id: 'xAI', name: 'xAI (Grok)', icon: '🕳️', description: 'Grok models, real-time X news queries, and reasoning upgrades.', countThisWeek: 0 },
      { id: 'Cohere', name: 'Cohere', icon: '🧬', description: 'Enterprise RAG, Command models, embed APIs, and custom agent weights.', countThisWeek: 0 },
      { id: 'DeepSeek', name: 'DeepSeek', icon: '🐳', description: 'DeepSeek models, codegen benchmarks, and open-weights math releases.', countThisWeek: 0 },
      { id: 'Perplexity AI', name: 'Perplexity AI', icon: '🔍', description: 'Perplexity Pro search agents, Sonar models, and citation news.', countThisWeek: 0 },
      { id: 'Stability AI', name: 'Stability AI', icon: '🎨', description: 'Stable Diffusion, image/video model updates, and open weights releases.', countThisWeek: 0 },
      { id: 'Hugging Face Blog', name: 'Hugging Face Blog', icon: '🤗', description: 'Transformers announcements, Space demos, and new datasets.', countThisWeek: 0 },
      { id: 'Together AI', name: 'Together AI', icon: '🤝', description: 'Fast serverless model hosting, custom fine-tunes, and API status.', countThisWeek: 0 },
      { id: 'Fireworks AI', name: 'Fireworks AI', icon: '🎆', description: 'Serverless inference APIs, function calling, and structured output speed.', countThisWeek: 0 }
    ]
  },
  {
    id: 'ai-engineering',
    title: 'AI Engineering & Agents',
    icon: '🤖',
    topics: [
      { id: 'LangChain', name: 'LangChain', icon: '🦜', description: 'LLM application framework, chains, and prompt templates.', countThisWeek: 0 },
      { id: 'LangGraph', name: 'LangGraph', icon: '🕸️', description: 'Stateful, multi-agent orchestrator graphs.', countThisWeek: 0 },
      { id: 'CrewAI', name: 'CrewAI', icon: '👥', description: 'Role-playing autonomous AI agent squads.', countThisWeek: 0 },
      { id: 'LlamaIndex', name: 'LlamaIndex', icon: '🦙', description: 'Data framework for LLM indexing and RAG integrations.', countThisWeek: 0 },
      { id: 'AutoGen', name: 'AutoGen', icon: '🤖', description: 'Multi-agent conversation frameworks from Microsoft.', countThisWeek: 0 },
      { id: 'DSPy', name: 'DSPy', icon: '🧪', description: 'Declarative programming framework for LLMs.', countThisWeek: 0 },
      { id: 'Haystack', name: 'Haystack', icon: '🌾', description: 'Modular orchestration for semantic search and QA.', countThisWeek: 0 },
      { id: 'OpenRouter', name: 'OpenRouter', icon: '🔌', description: 'Unified API routing across leading open LLMs.', countThisWeek: 0 },
      { id: 'Ollama', name: 'Ollama', icon: '🦙', description: 'Run LLMs locally on desktop and server hardware.', countThisWeek: 0 },
      { id: 'MCP', name: 'MCP (Model Context Protocol)', icon: '🔌', description: 'Standardized context integrations for AI systems.', countThisWeek: 0 }
    ]
  },
  {
    id: 'devops-cloud',
    title: 'Orchestration & DevOps Stack',
    icon: '⚓',
    topics: [
      { id: 'Kubernetes', name: 'Kubernetes', icon: '⚓', description: 'Kubelet schedulers, pod autoscalers & cluster control planes.', countThisWeek: 0, recommended: true },
      { id: 'CNCF', name: 'CNCF', icon: '⚓', description: 'Cloud Native Computing Foundation updates, KubeCon releases, and project status.', countThisWeek: 0 }
    ]
  },
  {
    id: 'cloud-platforms',
    title: 'Cloud & CDN Platforms',
    icon: '☁️',
    topics: [
      { id: 'AWS', name: 'AWS', icon: '☁️', description: 'Bedrock configurations, cloud serverless TPUs & IAM security.', countThisWeek: 0 },
      { id: 'Google Cloud', name: 'Google Cloud', icon: '☁️', description: 'GCP container engines, TPU clusters & Vertex endpoints.', countThisWeek: 0 },
      { id: 'Azure', name: 'Azure', icon: '☁️', description: 'Azure Kubernetes Service (AKS), AI integrations, and serverless hosts.', countThisWeek: 0 },
      { id: 'Oracle Cloud', name: 'Oracle Cloud', icon: '☁️', description: 'OCI bare metal GPU shapes, database clusters, and cloud infra.', countThisWeek: 0 },
      { id: 'Cloudflare', name: 'Cloudflare', icon: '☁️', description: 'Cloudflare Workers, Pages deployments, and security edge runs.', countThisWeek: 0 },
      { id: 'DigitalOcean', name: 'DigitalOcean', icon: '☁️', description: 'App Platform, droplets configs, and developer-friendly hosting.', countThisWeek: 0 },
      { id: 'Netlify', name: 'Netlify', icon: '☁️', description: 'JAMstack deployments, Netlify functions, and web hosting integrations.', countThisWeek: 0 }
    ]
  },
  {
    id: 'dev-tools',
    title: 'Developer Platforms & Deployment',
    icon: '💻',
    topics: [
      { id: 'GitHub', name: 'GitHub', icon: '💻', description: 'GitHub Copilot upgrades, Actions pipelines & workspace automation.', countThisWeek: 0, recommended: true },
      { id: 'Hugging Face', name: 'Hugging Face', icon: '🤗', description: 'Community Transformer libraries, Space hosting & weights downloads.', countThisWeek: 0 }
    ]
  },
  {
    id: 'startups-funding',
    title: 'Startups & Funding',
    icon: '📈',
    topics: [
      { id: 'TechCrunch AI', name: 'TechCrunch AI', icon: '🗞️', description: 'Latest AI venture deals and startup announcements.', countThisWeek: 0 },
      { id: 'YC Blog', name: 'YC Blog', icon: '🍊', description: 'Y Combinator startup launches, batches, and guides.', countThisWeek: 0 },
      { id: 'Andreessen Horowitz', name: 'Andreessen Horowitz', icon: '🅰️', description: 'a16z tech investing thesis, AI startup guides, and general briefs.', countThisWeek: 0 },
      { id: 'Sequoia', name: 'Sequoia', icon: '🌲', description: 'Sequoia Capital portfolio fundings, builder profiles, and AI strategies.', countThisWeek: 0 },
      { id: 'AI Startup Funding', name: 'AI Startup Funding', icon: '💰', description: 'General venture capital fundings, seed rounds, and M&A deals in AI.', countThisWeek: 0 }
    ]
  }
];

const DEFAULT_TOPICS = [
  'OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 'Mistral AI', 'xAI', 
  'Cohere', 'DeepSeek', 'Perplexity AI', 'Stability AI', 'Hugging Face Blog', 
  'Together AI', 'Fireworks AI', 'LangChain', 'LangGraph', 'CrewAI', 
  'LlamaIndex', 'AutoGen', 'DSPy', 'Haystack', 'OpenRouter', 'Ollama', 
  'MCP', 'Kubernetes', 'CNCF', 'AWS', 'Google Cloud', 'Azure', 
  'Oracle Cloud', 'Cloudflare', 'DigitalOcean', 'Netlify', 'GitHub', 'Hugging Face',
  'TechCrunch AI', 'YC Blog', 'Andreessen Horowitz', 'Sequoia', 'AI Startup Funding'
];

const PRESETS = [
  { id: 'ai-engineer', name: 'AI Engineer', icon: '🧠', topics: ['OpenAI', 'Anthropic', 'Meta AI', 'Google Gemini', 'Mistral AI', 'xAI', 'Cohere', 'DeepSeek', 'Perplexity AI', 'Stability AI', 'Hugging Face Blog', 'Together AI', 'Fireworks AI', 'LangChain', 'LangGraph', 'CrewAI', 'LlamaIndex', 'AutoGen', 'DSPy', 'Haystack', 'OpenRouter', 'Ollama', 'MCP', 'GitHub', 'Hugging Face'] },
  { id: 'devops', name: 'DevOps Specialist', icon: '⚓', topics: ['Kubernetes', 'CNCF', 'GitHub', 'AWS', 'Google Cloud', 'Azure', 'Cloudflare'] },
  { id: 'cloud', name: 'Cloud Architect', icon: '☁️', topics: ['AWS', 'Google Cloud', 'Azure', 'Oracle Cloud', 'Cloudflare', 'DigitalOcean', 'Netlify', 'Kubernetes', 'CNCF'] },
  { id: 'founder', name: 'Founder & Investor', icon: '📈', topics: ['TechCrunch AI', 'YC Blog', 'Andreessen Horowitz', 'Sequoia', 'AI Startup Funding', 'OpenAI', 'Anthropic', 'xAI', 'Perplexity AI', 'LangChain', 'CrewAI'] },
  { id: 'general', name: 'General Reader', icon: '🌐', topics: ['OpenAI', 'Anthropic', 'Google Gemini', 'Kubernetes', 'AWS', 'TechCrunch AI', 'YC Blog', 'AI Startup Funding', 'Hugging Face', 'GitHub'] },
  { id: 'all', name: 'Select All', icon: '✨', topics: DEFAULT_TOPICS }
];

interface PreferencesProps {
  enabledTopics?: Record<string, boolean>;
  onSave?: (updated: Record<string, boolean>) => void;
  userEmail?: string | null;
  isEmailSubscribed?: boolean;
  onSetEmailSubscribed?: (subscribed: boolean) => void;
}

export const Preferences: React.FC<PreferencesProps> = ({ 
  enabledTopics, 
  onSave, 
  userEmail,
  isEmailSubscribed,
  onSetEmailSubscribed
}) => {
  const [localTopics, setLocalTopics] = useState<Record<string, boolean>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
    'dev-tools': false,
    'devops-cloud': false,
    'ai-models': false
  });
  
  // Newsletter delivery preferences states
  const [emailEnabled, setEmailEnabled] = useState(isEmailSubscribed ?? false);
  const [deliveryTime, setDeliveryTime] = useState(localStorage.getItem('opsiai_delivery_time') || '03:00 PM');
  const [frequency, setFrequency] = useState(localStorage.getItem('opsiai_delivery_frequency') || 'Daily');
  const [collapsedNewsletter, setCollapsedNewsletter] = useState(false);

  const [saving, setSaving] = useState(false);
  const [dbCounts, setDbCounts] = useState<Record<string, number>>({});
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const { showToast } = useToast();
  const [initialState, setInitialState] = useState<{
    localTopics: Record<string, boolean>;
    emailEnabled: boolean;
    deliveryTime: string;
    frequency: string;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!initialState && Object.keys(localTopics).length > 0) {
      setInitialState({
        localTopics: { ...localTopics },
        emailEnabled,
        deliveryTime,
        frequency
      });
    }
  }, [localTopics, emailEnabled, deliveryTime, frequency]);

  const isDirty = React.useMemo(() => {
    if (!initialState) return false;
    return JSON.stringify(localTopics) !== JSON.stringify(initialState.localTopics) ||
           emailEnabled !== initialState.emailEnabled ||
           deliveryTime !== initialState.deliveryTime ||
           frequency !== initialState.frequency;
  }, [localTopics, emailEnabled, deliveryTime, frequency, initialState]);

  useEffect(() => {
    let matchedPreset: string | null = null;
    const activeKeys = Object.keys(localTopics).filter(k => localTopics[k]);
    if (activeKeys.length > 0) {
      for (const pack of PRESETS) {
        if (pack.topics.length === activeKeys.length && pack.topics.every(t => localTopics[t])) {
          matchedPreset = pack.id;
          break;
        }
      }
    }
    setActivePresetId(matchedPreset);
  }, [localTopics]);

  useEffect(() => {
    async function loadCounts() {
      try {
        const counts = await fetchTopicCounts();
        setDbCounts(counts);
      } catch (err) {
        console.warn('Failed to load real-time topic counts:', err);
      }
    }
    loadCounts();
  }, []);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function syncDBPrefs() {
      const email = userEmail || localStorage.getItem('opsiai_email');
      if (email) {
        try {
          const prefs = await fetchPreferences(email);
          if (prefs && prefs.length > 0) {
            const loaded: Record<string, boolean> = {};
            DEFAULT_TOPICS.forEach((topicId: string) => {
              loaded[topicId] = false;
            });
            prefs.forEach((topicId: string) => {
              loaded[topicId] = true;
            });
            setLocalTopics(loaded);
            if (onSave) onSave(loaded);
          }
        } catch (err) {
          console.warn('Failed to sync DB preferences on Preferences mount:', err);
        }
      }
    }
    syncDBPrefs();
  }, [userEmail]);

  useEffect(() => {
    if (enabledTopics) {
      setLocalTopics(enabledTopics);
    } else {
      const saved = localStorage.getItem('opsiai_subscriptions');
      if (saved) {
        setLocalTopics(JSON.parse(saved));
      } else {
        const initial: Record<string, boolean> = {};
        CATEGORIES.forEach(cat => {
          cat.topics.forEach(t => {
            initial[t.id] = true;
          });
        });
        setLocalTopics(initial);
      }
    }
  }, [enabledTopics]);

  useEffect(() => {
    if (isEmailSubscribed !== undefined) {
      setEmailEnabled(isEmailSubscribed);
    }
  }, [isEmailSubscribed]);

  const toggleCategory = (id: string) => {
    setCollapsedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleTopic = (topicId: string) => {
    setLocalTopics(prev => ({
      ...prev,
      [topicId]: prev[topicId] === undefined ? false : !prev[topicId]
    }));
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveStatus('idle');

    // Save active subscriptions
    localStorage.setItem('opsiai_subscriptions', JSON.stringify(localTopics));
    
    // Save email notifications configs
    localStorage.setItem('opsiai_email_subscribed', emailEnabled ? 'true' : 'false');
    localStorage.setItem('opsiai_delivery_time', deliveryTime);
    localStorage.setItem('opsiai_delivery_frequency', frequency);

    if (onSave) {
      onSave(localTopics);
    }
    if (onSetEmailSubscribed) {
      onSetEmailSubscribed(emailEnabled);
    }

    // Call backend API if user is authenticated
    const email = userEmail || localStorage.getItem('opsiai_email');
    if (email) {
      try {
        const activeList = Object.keys(localTopics).filter(k => localTopics[k]);
        await savePreferences(email, activeList, deliveryTime);
      } catch (err) {
        console.warn('Backend server offline. Settings saved locally.', err);
        setSaving(false);
        setErrorMsg('Unable to save your preferences. Please try again.');
        return;
      }
    }

    setInitialState({ localTopics: { ...localTopics }, emailEnabled, deliveryTime, frequency });
    setSaving(false);
    setSaveStatus('saved');
    showToast('Preferences saved successfully', 'success');
    
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'left'
          }}
        >
          <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '8px' }}>
            ⚡ Quick-Select Presets
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
            Select a pre-configured pack to instantly toggle interest checkboxes below.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PRESETS.map(pack => (
              <button
                key={pack.id}
                type="button"
                onClick={() => {
                  const loaded: Record<string, boolean> = {};
                  DEFAULT_TOPICS.forEach(topicId => {
                    loaded[topicId] = pack.topics.includes(topicId);
                  });
                  setLocalTopics(loaded);
                  if (onSave) onSave(loaded);
                  setAppliedPresetId(pack.id);
                  setTimeout(() => setAppliedPresetId(null), 600);
                  showToast(`${pack.name} preset applied! Click Save Preferences below to persist.`, 'success');
                }}
                className={`preset-chip ${appliedPresetId === pack.id ? 'applied-pulse' : ''} ${activePresetId === pack.id ? 'active' : ''}`}
              >
                <span>{pack.icon}</span>
                {pack.name}
              </button>
            ))}
          </div>
        </div>

        {/* Categories toggler block */}
        <div className="mobile-topics-section">
          {CATEGORIES.map(category => (
            <div className="mobile-category-block" key={category.id}>
              <h2>{category.icon} {category.title}</h2>
              <div className="mobile-chips-grid">
                {category.topics.map(topic => {
                  const isEnabled = localTopics[topic.id] !== false;
                  return (
                    <div 
                      key={topic.id}
                      className={`mobile-topic-chip ${isEnabled ? 'active' : ''}`}
                      onClick={() => handleToggleTopic(topic.id)}
                    >
                      <span className="icon">{topic.icon}</span>
                      <span>{topic.name}</span>
                      {topic.recommended && <span style={{ fontSize: '8px', color: 'var(--primary)', fontWeight: 800 }}>★</span>}
                      <span className="metrics">{topic.countThisWeek}w</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Email Delivery Options */}
        <div className="mobile-settings-group" style={{ marginTop: '10px' }}>
          <div className="mobile-settings-group-title">Newsletter & Digests</div>
          
          <div className="mobile-settings-row">
            <div className="mobile-settings-left">
              <span className="icon">📬</span>
              <span>Enable Daily Briefing</span>
            </div>
            <label className="ios-switch">
              <input 
                type="checkbox" 
                checked={emailEnabled} 
                onChange={() => setEmailEnabled(!emailEnabled)} 
              />
              <span className="ios-slider" />
            </label>
          </div>

          {emailEnabled && (
            <>
              <div className="mobile-settings-row">
                <div className="mobile-settings-left">
                  <span className="icon">⏰</span>
                  <span>Delivery Time</span>
                </div>
                <CustomSelect 
                  value={deliveryTime} 
                  onChange={setDeliveryTime}
                  align="right"
                  options={[
                    { value: "03:00 PM", label: "03:00 PM" },
                    { value: "06:00 AM", label: "06:00 AM", disabled: true },
                    { value: "08:00 AM", label: "08:00 AM", disabled: true },
                    { value: "10:00 AM", label: "10:00 AM", disabled: true },
                    { value: "12:00 PM", label: "12:00 PM", disabled: true }
                  ]}
                  style={{ fontSize: '13px', fontWeight: 600, width: '120px' }}
                />
              </div>

              <div className="mobile-settings-row">
                <div className="mobile-settings-left">
                  <span className="icon">📅</span>
                  <span>Frequency</span>
                </div>
                <select 
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value)}
                  style={{ border: 'none', background: 'none', color: 'var(--text-color)', fontSize: '13px', fontWeight: 600, outline: 'none', textAlign: 'right' }}
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekdays Only">Mon-Fri</option>
                  <option value="Weekly Digest">Weekly</option>
                </select>
              </div>
            </>
          )}
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--strategic)', fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
            {errorMsg}
          </div>
        )}
        <button 
          className={`btn-primary ${saving ? 'btn-loading' : ''} ${saveStatus === 'saved' ? 'btn-success' : ''}`} 
          onClick={handleSave} 
          disabled={!isDirty || saving}
          style={{ minHeight: '48px', width: '100%', borderRadius: '12px', marginTop: '10px', fontSize: '15px', fontWeight: 700 }}
        >
          {saving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Preferences'}
        </button>
      </div>
    );
  }

  return (
    <div className="preferences-panel" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="preferences-intro">
        <h2>Configure Intelligence Feed</h2>
        <p>Your selections directly filter your Reports and Daily E-mail updates.</p>
      </div>

      <div 
        style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', marginBottom: '12px' }}>
          ⚡ Quick-Select Presets
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
          Select a pre-configured pack to instantly toggle interest checkboxes below.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {PRESETS.map(pack => (
            <button
              key={pack.id}
              onClick={() => {
                const loaded: Record<string, boolean> = {};
                DEFAULT_TOPICS.forEach(topicId => {
                  loaded[topicId] = pack.topics.includes(topicId);
                });
                setLocalTopics(loaded);
                if (onSave) onSave(loaded);
                setAppliedPresetId(pack.id);
                setTimeout(() => setAppliedPresetId(null), 600);
                showToast(`${pack.name} preset applied! Click Save Preferences below to persist.`, 'success');
              }}
              className={`preset-chip ${appliedPresetId === pack.id ? 'applied-pulse' : ''} ${activePresetId === pack.id ? 'active' : ''}`}
            >
              <span>{pack.icon}</span>
              {pack.name}
            </button>
          ))}
        </div>
      </div>

      <div className="preferences-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Newsletter Delivery Settings Collapsible Card */}
        <div className="flow-node" style={{ textAlign: 'left', padding: '20px', borderRadius: '10px', borderColor: 'var(--primary)', boxShadow: '0 0 10px rgba(228, 185, 91, 0.05)' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setCollapsedNewsletter(!collapsedNewsletter)}
          >
            <span style={{ fontSize: '20px', marginRight: '10px' }}>📬</span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
              Newsletter & Email Delivery Preferences
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
              {collapsedNewsletter ? 'Expand ▼' : 'Collapse ▲'}
            </span>
          </div>

          {!collapsedNewsletter && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto', 
                  gap: '16px', 
                  alignItems: 'center', 
                  padding: '16px',
                  background: 'rgba(0,0,0,0.15)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Enable Email Briefings</span>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                    Receive a clean editorial summary of your whitelisted categories directly in your inbox.
                  </p>
                </div>
                <label className="switch" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={() => setEmailEnabled(!emailEnabled)}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              {emailEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="auth-label" style={{ fontSize: '11px' }}>Preferred Delivery Time</label>
                    <CustomSelect 
                      value={deliveryTime} 
                      onChange={setDeliveryTime}
                      className="auth-input"
                      options={[
                        { value: "03:00 PM", label: "03:00 PM (IST)" },
                        { value: "06:00 AM", label: "06:00 AM (IST)", disabled: true },
                        { value: "08:00 AM", label: "08:00 AM (IST)", disabled: true },
                        { value: "10:00 AM", label: "10:00 AM (IST)", disabled: true },
                        { value: "12:00 PM", label: "12:00 PM (IST)", disabled: true }
                      ]}
                      style={{ background: 'var(--bg-color)', border: '1px solid var(--border)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="auth-label" style={{ fontSize: '11px' }}>Frequency</label>
                    <select 
                      value={frequency} 
                      onChange={(e) => setFrequency(e.target.value)}
                      className="auth-input"
                      style={{ background: 'var(--bg-color)', color: 'var(--text-color)', border: '1px solid var(--border)' }}
                    >
                      <option value="Daily">Daily (Every Day)</option>
                      <option value="Weekdays Only">Weekdays Only (Mon-Fri)</option>
                      <option value="Weekly Digest">Weekly Digest (Saturdays)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Subscriptions Lists */}
        {CATEGORIES.map(category => {
          const isCollapsed = collapsedCategories[category.id];
          return (
            <div key={category.id} className="flow-node" style={{ textAlign: 'left', padding: '20px', borderRadius: '10px' }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleCategory(category.id)}
              >
                <span style={{ fontSize: '20px', marginRight: '10px' }}>{category.icon}</span>
                <h3 style={{ fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                  {category.title}
                </h3>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {isCollapsed ? 'Expand ▼' : 'Collapse ▲'}
                </span>
              </div>

              {!isCollapsed && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease-out' }}>
                  {category.topics.map(topic => {
                    const isEnabled = localTopics[topic.id] !== false;
                    return (
                      <div 
                        key={topic.id} 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'auto 1fr auto', 
                          gap: '16px', 
                          alignItems: 'center', 
                          padding: '16px',
                          background: 'rgba(0,0,0,0.15)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          transition: 'var(--transition)'
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{topic.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{topic.name}</span>
                            {topic.recommended && (
                              <span style={{ fontSize: '9px', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>Recommended</span>
                            )}
                             <span style={{ fontFamily: 'var(--font-stats)', fontSize: '11px', color: 'var(--accent)', marginLeft: 'auto' }}>
                               {dbCounts[topic.id] !== undefined ? dbCounts[topic.id] : 0} this week
                             </span>
                          </div>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                            {topic.description}
                          </p>
                        </div>

                        <label className="switch" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleTopic(topic.id)}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
        {errorMsg && (
          <span style={{ color: 'var(--strategic)', fontSize: '13px', fontWeight: 600 }}>{errorMsg}</span>
        )}
        <button 
          className={`btn-primary ${saving ? 'btn-loading' : ''} ${saveStatus === 'saved' ? 'btn-success' : ''}`} 
          onClick={handleSave} 
          disabled={!isDirty || saving} 
          style={{ padding: '14px 28px' }}
        >
          {saving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
