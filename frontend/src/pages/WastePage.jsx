import { useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Trash2 } from 'lucide-react';
import { wasteApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber, fillColor } from '../utils/helpers';

export default function WastePage() {
  const binsFn     = useCallback(() => wasteApi.getBins(),         []);
  const riskFn     = useCallback(() => wasteApi.getOverflowRisk(), []);
  const forecastFn = useCallback(() => wasteApi.getForecast(24),   []);

  const { data: bins,     loading } = usePolling(binsFn, 30000);
  const { data: risk }              = usePolling(riskFn, 30000);
  const { data: forecast }          = useAsync(forecastFn);

  if (loading || !bins) return <div className="page"><Spinner /></div>;

  const critical = bins.filter(b => b.status === 'Critical').length;
  const warning  = bins.filter(b => b.status === 'Warning').length;
  const avgFill  = bins.reduce((s, b) => s + b.fill_level, 0) / bins.length;

  const forecastChart = (forecast || []).map(r => ({
    t:  r.timestamp?.slice(11, 16),
    kg: r.total_kg,
    lo: r.lower_ci,
    hi: r.upper_ci,
  }));

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Trash2} label="Total Bins"      value={bins.length} />
        <KpiCard label="Critical Bins"  value={critical} accentColor="#ef4444" />
        <KpiCard label="Warning Bins"   value={warning}  accentColor="#f59e0b" />
        <KpiCard label="Avg Fill Level" value={fmtNumber(avgFill)} unit="%" />
        <KpiCard label="At-Risk Bins"   value={risk?.at_risk_count ?? '—'} />
      </div>

      {risk?.at_risk_count > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="alert-badge badge-critical pulse-critical">⚠ OVERFLOW RISK</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              {risk.at_risk_count} bins above 75% capacity — {risk.recommendation}
            </span>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Bin Fill Levels */}
        <div className="card">
          <div className="card-title">🗑️ Bin Fill Levels</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bins.slice(0, 15)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis type="category" dataKey="id" tick={{ fill: '#8b99b5', fontSize: 10 }} width={60} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Fill Level']}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="fill_level" radius={[0, 4, 4, 0]}>
                {bins.slice(0, 15).map((b, i) => (
                  <Cell key={i} fill={fillColor(b.fill_level)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast */}
        <div className="card">
          <div className="card-title">🔮 24-Hour Waste Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Projected waste generation (kg) · Decision-support only
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={forecastChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [fmtNumber(v), n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="kg" fill="#7c3aed" opacity={0.85} radius={[4, 4, 0, 0]} name="Forecast kg" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bins Table */}
      <div className="card">
        <div className="card-title">📋 All Bins Status</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Bin ID</th><th>Zone</th><th>Type</th>
                <th>Fill Level</th><th>Capacity</th><th>Status</th><th>Last Collected</th>
              </tr>
            </thead>
            <tbody>
              {bins.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{b.id}</td>
                  <td>{b.zone}</td>
                  <td>{b.type}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ width: 80 }}>
                        <div className="progress-bar-fill" style={{ width: `${b.fill_level}%`, background: fillColor(b.fill_level) }} />
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>{b.fill_level}%</span>
                    </div>
                  </td>
                  <td>{b.capacity_liters}L</td>
                  <td>
                    <span className={`alert-badge ${b.status === 'Critical' ? 'badge-critical' : b.status === 'Warning' ? 'badge-high' : 'badge-ok'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>{new Date(b.last_collected).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
