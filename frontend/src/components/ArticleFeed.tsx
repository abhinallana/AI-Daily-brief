import React, { useState } from 'react';
import type { Article } from '../services/api';

interface ArticleFeedProps {
  articles: Article[];
  bookmarks?: Article[];
  onToggleBookmark?: (article: Article) => void;
}

export const ArticleFeed: React.FC<ArticleFeedProps> = ({ articles, bookmarks = [], onToggleBookmark }) => {
  const [filter, setFilter] = useState<'All' | 'Strategic' | 'Important' | 'Insights'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = articles.filter(art => {
    // 1. Priority filter
    let matchesPriority = true;
    if (filter !== 'All') {
      const pri = art.priority || 'Insights';
      if (filter === 'Insights') {
        matchesPriority = (pri === 'Insights' || pri === 'Informational');
      } else {
        matchesPriority = pri.toLowerCase() === filter.toLowerCase();
      }
    }

    // 2. Search query keyword filter
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const title = (art.title || '').toLowerCase();
      const category = (art.category || '').toLowerCase();
      const source = (art.source || '').toLowerCase();
      const summary = (art.summary || '').toLowerCase();
      const aiSummary = (art.ai_summary || '').toLowerCase();
      const whyItMatters = (art.why_it_matters || '').toLowerCase();

      matchesSearch = (
        title.includes(query) ||
        category.includes(query) ||
        source.includes(query) ||
        summary.includes(query) ||
        aiSummary.includes(query) ||
        whyItMatters.includes(query)
      );
    }

    return matchesPriority && matchesSearch;
  });

  const strategicArticles = filteredArticles.filter(a => a.priority === 'Strategic');
  const importantArticles = filteredArticles.filter(a => a.priority === 'Important');
  const insightsArticles = filteredArticles.filter(a => a.priority === 'Insights' || a.priority === 'Informational');

  const renderSection = (title: string, cssClass: string, sectionArticles: Article[]) => {
    if (sectionArticles.length === 0) return null;
    return (
      <div key={title} style={{ marginBottom: '35px' }}>
        <h2 className={`section-title ${cssClass}`}>{title}</h2>
        <div className="feed-grid">
          {sectionArticles.map((art, idx) => {
            const isBookmarked = bookmarks.some(b => b.link === art.link);
            return (
              <div key={art.link_hash || idx} className="article-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="article-header">
                    <div className="badge-group">
                      <span className={`badge ${cssClass}`}>{art.priority}</span>
                      {art.category && <span className="badge category">{art.category}</span>}
                    </div>
                    {art.reading_time && <span className="article-read-time">{art.reading_time}</span>}
                  </div>
                  <h3 className="article-title">
                    <a href={art.link} target="_blank" rel="noopener noreferrer">
                      {art.title}
                    </a>
                  </h3>
                  <div className="article-meta-row">
                    <div>
                      <div className="meta-field-label">Source</div>
                      <div className="meta-field-value">{art.icon} {art.source || 'Unknown'}</div>
                    </div>
                    <div>
                      <div className="meta-field-label">Why it matters</div>
                      <div className="meta-field-value">
                        {art.why_it_matters && art.why_it_matters !== 'None'
                          ? art.why_it_matters
                          : 'Key service updates and architectural shifts relevant to engineering pipelines.'}
                      </div>
                    </div>
                  </div>
                </div>

                {onToggleBookmark && (
                  <div className="article-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                    <a href={art.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Read Article ↗
                    </a>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="icon-action-btn"
                        onClick={() => onToggleBookmark(art)}
                        style={{
                          background: isBookmarked ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: 'var(--text-color)',
                          transition: 'all 0.2s'
                        }}
                        title={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
                      >
                        {isBookmarked ? '🔖' : '🗂️'}
                      </button>
                      <button
                        className="icon-action-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(art.link);
                          alert('Article link copied to clipboard!');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: 'var(--text-color)',
                          transition: 'all 0.2s'
                        }}
                        title="Copy Link"
                      >
                        📤
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <div className="feed-filter-bar">
        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>AI Updates Feed</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search keyword (e.g. OpenAI, CNCF, k8s)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            {(['All', 'Strategic', 'Important', 'Insights'] as const).map(tab => (
              <button
                key={tab}
                className={`filter-btn ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="article-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)' }}>No articles found matching this filter.</p>
        </div>
      ) : (
        <>
          {renderSection('🚨 Strategic', 'strategic', strategicArticles)}
          {renderSection('📌 Important', 'important', importantArticles)}
          {renderSection('ℹ️ Insights', 'insights', insightsArticles)}
        </>
      )}
    </div>
  );
};
