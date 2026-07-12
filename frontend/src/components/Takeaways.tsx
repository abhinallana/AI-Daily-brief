import React, { useState } from 'react';
import type { DailyReport } from '../services/api';

interface TakeawaysProps {
  report: DailyReport;
}

export const Takeaways: React.FC<TakeawaysProps> = ({ report }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="takeaways-section">
      <div className="takeaways-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2><span>🎯</span> Today's Takeaways</h2>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
        </span>
      </div>
      
      {isExpanded && (
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <div className="takeaway-label">🚀 Biggest Announcement</div>
            <div className="takeaway-value">{report.biggest_announcement}</div>
          </div>
          <div className="takeaway-card">
            <div className="takeaway-label">📈 Biggest Trend</div>
            <div className="takeaway-value">{report.biggest_trend}</div>
          </div>
          <div className="takeaway-card">
            <div className="takeaway-label">💡 Key Insight</div>
            <div className="takeaway-value">{report.one_thing_to_know}</div>
          </div>
          <div className="takeaway-card">
            <div className="takeaway-label">⏳ Time Saved</div>
            <div className="takeaway-value highlight">{report.time_saved_minutes} minutes</div>
          </div>
        </div>
      )}
    </div>
  );
};
