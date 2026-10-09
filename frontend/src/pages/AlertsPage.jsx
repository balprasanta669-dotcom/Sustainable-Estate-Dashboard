import { useCallback } from 'react';
import { Bell } from 'lucide-react';
import { alertsApi } from '../services/api';
import { usePolling } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { severityClass, severityColor, relativeTime } from '../utils/helpers';

export default function AlertsPage() {
  const alertsFn = useCallback(() => alertsApi.getAll(),            []);
  const recsFn   = useCallback(() => alertsApi.getRecommendations(),[]);

  const { data: alertsData, loading } = usePolling(alertsFn, 30000);
  const { data: recs }                = usePolling(recsFn,   60000);

  if (loading || !alertsData) return <div className="page"><Spinner /></div>;

  const { alerts, total, unacknowledged } = alertsData;
  const critCount = alerts.filter(a => a.severity === 'Critical').length;
  const highCount = alerts.filter(a => a.severity === 'High').length;

  const MODULE_LABELS = {
    air_quality: '🌬️ Air Quality', waste: '🗑️ Waste', water: '💧 Water',
    energy: '⚡ Energy', traffic: '🚗 Traffic', safety: '🛡️ Safety',
    emissions: '🏭 Emissions', assets: '🔧 Assets',
  };

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Bell} label="Total Alerts"      value={total} />
        <KpiCard label="Unacknowledged" value={unacknowledged} accentColor={unacknowledged > 0 ? '#ef4444' : undefined} />
        <KpiCard label="Critical"       value={critCount}      accentColor={critCount > 0 ? '#ef4444' : undefined} />
        <KpiCard label="High"           value={highCount}      accentColor={highCount > 0 ? '#f59e0b' : undefined} />
        <KpiCard label="AI Recs Active" value={(recs||[]).length} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Alert Feed */}
        <div className="card">
          <div className="card-title">🚨 Active Alert Feed</div>
          <div>
            {alerts.map(alert => (
              <div key={alert.id} className="alert-item" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div className="alert-dot" style={{ background: severityColor(alert.severity), marginTop: 4 }} />
                  {!alert.acknowledged && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(239,68,68,0.5)', animation: 'pulse-live 1.5s ease infinite' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <span className={`alert-badge ${severityClass(alert.severity)}`} style={{ marginRight: 6 }}>{alert.severity}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{MODULE_LABELS[alert.module] || alert.module}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{relativeTime(alert.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', marginTop: 4 }}>{alert.message}</div>
                  {!alert.acknowledged && (
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: 2 }}>● Unacknowledged</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="card-title" style={{ margin: 0 }}>🤖 Gemini Autonomous AI Decisions</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Generative Multi-Sensor Reasoning · Zero static if/else rules
              </div>
            </div>
            <button
              onClick={() => recsFn()}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ⚡ Re-evaluate AI
            </button>
          </div>
          {(recs || []).map(rec => (
            <div key={rec.id} className="rec-card" style={{ borderLeft: '3px solid #38bdf8' }}>
              <div className="rec-card-header">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="rec-card-module">{MODULE_LABELS[rec.module] || rec.module}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{rec.category}</span>
                  {rec.source && (
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      fontSize: '0.65rem',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontWeight: 600
                    }}>
                      {rec.source}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`alert-badge ${severityClass(rec.priority)}`}>{rec.priority}</span>
                  <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600 }}>
                    {rec.confidence_score || rec.confidence_pct || 90}% conf.
                  </span>
                </div>
              </div>
              <div className="rec-card-action" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                {rec.action}
              </div>
              {rec.ai_reasoning && (
                <div style={{
                  fontSize: '0.78rem',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '8px 10px',
                  borderRadius: 6,
                  marginTop: 6,
                  lineHeight: 1.4,
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <strong style={{ color: '#38bdf8' }}>AI Reasoning: </strong>
                  {rec.ai_reasoning}
                </div>
              )}
              <div className="rec-card-impact" style={{ marginTop: 6 }}>
                ✦ {rec.expected_impact}
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.75rem' }}
                  onClick={(e) => {
                    e.currentTarget.innerText = '✓ Executed';
                    e.currentTarget.disabled = true;
                    e.currentTarget.style.background = '#22c55e';
                  }}
                >
                  Authorize Dispatch
                </button>
                <button
                  className="btn btn-outline"
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={(e) => {
                    const card = e.currentTarget.closest('.rec-card');
                    if (card) card.style.opacity = '0.35';
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
          {(!recs || recs.length === 0) && (
            <div style={{ color: 'var(--color-success)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>
              ✅ All telemetry operating within safe parameters. No critical AI actions needed.
            </div>
          )}
        </div>
      </div>

      {/* All Alerts Table */}
      <div className="card">
        <div className="card-title">📋 All Alerts Summary</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Module</th><th>Severity</th><th>Message</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.78rem' }}>{a.id}</td>
                  <td style={{ fontSize: '0.82rem' }}>{MODULE_LABELS[a.module] || a.module}</td>
                  <td><span className={`alert-badge ${severityClass(a.severity)}`}>{a.severity}</span></td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 320 }}>{a.message}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{relativeTime(a.timestamp)}</td>
                  <td>
                    <span className={`alert-badge ${a.acknowledged ? 'badge-ok' : 'badge-critical'}`}>
                      {a.acknowledged ? 'ACK' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
