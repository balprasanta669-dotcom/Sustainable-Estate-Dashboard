import { useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';
import { Droplets } from 'lucide-react';
import { waterApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber, severityClass, relativeTime } from '../utils/helpers';

export default function WaterPage() {
  const usageFn    = useCallback(() => waterApi.getUsage(168),   []);
  const alertsFn   = useCallback(() => waterApi.getAlerts(),     []);
  const forecastFn = useCallback(() => waterApi.getForecast(24), []);
  const anomalyFn  = useCallback(() => waterApi.getAnomalies(),  []);

  const { data: usage,    loading } = usePolling(usageFn,    30000);
  const { data: alerts  }           = usePolling(alertsFn,   30000);
  const { data: forecast }          = useAsync(forecastFn);
  const { data: anomalies }         = useAsync(anomalyFn);

  if (loading || !usage) return <div className="page"><Spinner /></div>;

  const latest = usage[usage.length - 1] || {};
  const total  = usage.reduce((s, r) => s + (r.consumption_kl || 0), 0);
  const leaks  = usage.filter(r => r.leak_detected).length;

  const chartData = usage.filter((_, i) => i % 4 === 0).map(r => ({
    t:   r.timestamp?.slice(11, 16),
    kl:  r.consumption_kl,
    ph:  r.ph,
    tds: r.tds_ppm,
  }));

  const forecastChart = (forecast || []).map(r => ({
    t:  r.timestamp?.slice(11, 16),
    kl: r.consumption_kl,
    lo: r.lower_ci,
    hi: r.upper_ci,
  }));

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Droplets} label="Current Flow"     value={fmtNumber(latest.consumption_kl)} unit="KL/hr" />
        <KpiCard label="Total (7d)"    value={fmtNumber(total, 0)}     unit="KL" />
        <KpiCard label="Pressure"      value={fmtNumber(latest.pressure_bar)} unit="bar" />
        <KpiCard label="pH Level"      value={fmtNumber(latest.ph, 2)} />
        <KpiCard label="TDS"           value={fmtNumber(latest.tds_ppm, 0)} unit="ppm" />
        <KpiCard label="Leak Events"   value={leaks} accentColor={leaks > 0 ? '#ef4444' : undefined} />
      </div>

      {/* Alerts */}
      {alerts?.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">⚠️ Active Water Alerts</div>
          {alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span className={`alert-badge ${severityClass(a.severity)}`} style={{ marginRight: 8 }}>{a.severity}</span>
                <span style={{ fontSize: '0.85rem' }}>{a.zone} — {a.type}</span>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{a.message}</div>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>{relativeTime(a.timestamp)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">💧 Water Consumption Trend</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [fmtNumber(v), n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="kl" stroke="#00d4ff" fill="url(#waterGrad)" strokeWidth={2} name="Consumption (KL)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🔮 24-Hour Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>Decision-support only — verify with field data</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={forecastChart}>
              <defs>
                <linearGradient id="wForeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c896" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00c896" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [fmtNumber(v), n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="hi"  stroke="transparent" fill="url(#wForeGrad)" name="Upper CI" />
              <Area type="monotone" dataKey="kl"  stroke="#00c896" fill="transparent" strokeWidth={2} name="Forecast KL" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Quality Chart */}
      <div className="card">
        <div className="card-title">🧪 Water Quality Parameters</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
            <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
            <Tooltip
              formatter={(v, n) => [fmtNumber(v, 2), n]}
              contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
            />
            <Line type="monotone" dataKey="ph"  stroke="#7c3aed" dot={false} strokeWidth={2} name="pH" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8 }}>Safe pH range: 6.5 – 8.5 (WHO guidelines)</div>
      </div>
    </div>
  );
}
