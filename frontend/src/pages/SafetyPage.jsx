import { useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { safetyApi } from '../services/api';
import { usePolling } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber, severityClass, relativeTime } from '../utils/helpers';

export default function SafetyPage() {
  const incidentsFn = useCallback(() => safetyApi.getIncidents(30), []);
  const summaryFn   = useCallback(() => safetyApi.getSummary(),      []);

  const { data: incidents, loading } = usePolling(incidentsFn, 60000);
  const { data: summary }            = usePolling(summaryFn,   60000);

  if (loading || !incidents) return <div className="page"><Spinner /></div>;

  const typeData = summary?.by_type
    ? Object.entries(summary.by_type).map(([t, c]) => ({ type: t, count: c })).sort((a,b) => b.count - a.count)
    : [];

  const sevData = summary?.by_severity
    ? Object.entries(summary.by_severity).map(([s, c]) => ({ sev: s, count: c }))
    : [];

  const sevColors = { Critical: '#ef4444', High: '#f59e0b', Medium: '#60a5fa', Low: '#8b5cf6' };

  const statusColor = (s) => s === 'Resolved' ? '#00c896' : s === 'In Progress' ? '#f59e0b' : '#ef4444';

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={AlertTriangle} label="Incidents (30d)"    value={summary?.total_incidents_30d ?? '—'} />
        <KpiCard label="Open"             value={summary?.by_status?.Open ?? 0} accentColor="#ef4444" />
        <KpiCard label="In Progress"      value={summary?.by_status?.['In Progress'] ?? 0} accentColor="#f59e0b" />
        <KpiCard label="Resolved"         value={summary?.by_status?.Resolved ?? 0} accentColor="#00c896" />
        <KpiCard label="Avg Response"     value={fmtNumber(summary?.avg_response_time_min)} unit="min" />
        <KpiCard label="Risk Score"       value={summary?.risk_score ?? '—'} unit="/ 100" accentColor={summary?.risk_score > 50 ? '#ef4444' : '#00c896'} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">📊 Incidents by Type</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#8b99b5', fontSize: 10 }} width={120} />
              <Tooltip
                formatter={(v) => [v, 'Incidents']}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="count" fill="#00d4ff" opacity={0.85} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🎯 Incidents by Severity</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sevData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="sev" tick={{ fill: '#8b99b5', fontSize: 11 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v) => [v, 'Incidents']}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {sevData.map((d, i) => (
                  <Cell key={i} fill={sevColors[d.sev] || '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="card">
        <div className="card-title">📋 Recent Safety Incidents (30 days)</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>Zone</th><th>Severity</th>
                <th>Status</th><th>Response Time</th><th>When</th>
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 25).map(inc => (
                <tr key={inc.id}>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{inc.id}</td>
                  <td style={{ color: 'var(--color-text-primary)' }}>{inc.type}</td>
                  <td>{inc.zone}</td>
                  <td><span className={`alert-badge ${severityClass(inc.severity)}`}>{inc.severity}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(inc.status), display: 'inline-block' }} />
                      {inc.status}
                    </span>
                  </td>
                  <td>{inc.response_time_min} min</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{relativeTime(inc.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
