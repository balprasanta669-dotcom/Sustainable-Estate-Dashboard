import { useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { Activity } from 'lucide-react';
import { emissionsApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber } from '../utils/helpers';

export default function EmissionsPage() {
  const dataFn     = useCallback(() => emissionsApi.getData(168),   []);
  const hotFn      = useCallback(() => emissionsApi.getHotspots(),  []);
  const forecastFn = useCallback(() => emissionsApi.getForecast(24),[]);

  const { data: emissions, loading } = usePolling(dataFn, 60000);
  const { data: hotspots }           = usePolling(hotFn,  60000);
  const { data: forecast }           = useAsync(forecastFn);

  if (loading || !emissions) return <div className="page"><Spinner /></div>;

  const totalCO2  = emissions.reduce((s,r)=>s+r.co2_kg,0);
  const totalNOx  = emissions.reduce((s,r)=>s+r.nox_kg,0);
  const totalSOx  = emissions.reduce((s,r)=>s+r.sox_kg,0);
  const avgCO2    = totalCO2 / emissions.length;

  const chartData = emissions.filter((_, i) => i % 4 === 0).map(r => ({
    t:   r.timestamp?.slice(11, 16),
    co2: r.co2_kg,
    nox: r.nox_kg,
    sox: r.sox_kg,
  }));

  const forecastChart = (forecast || []).map(r => ({
    t:   r.timestamp?.slice(11, 16),
    co2: r.co2_kg,
  }));

  const riskColor = (r) => r === 'High' ? '#ef4444' : r === 'Medium' ? '#f59e0b' : '#00c896';
  const riskClass = (r) => r === 'High' ? 'badge-critical' : r === 'Medium' ? 'badge-high' : 'badge-ok';

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Activity} label="Total CO₂ (7d)"    value={fmtNumber(totalCO2, 0)} unit="kg" />
        <KpiCard label="Avg CO₂/hr"    value={fmtNumber(avgCO2, 1)} unit="kg/hr" />
        <KpiCard label="Total NOₓ (7d)" value={fmtNumber(totalNOx, 1)} unit="kg" />
        <KpiCard label="Total SOₓ (7d)" value={fmtNumber(totalSOx, 1)} unit="kg" />
        <KpiCard label="Hotspot Zones"  value={hotspots?.length ?? '—'} />
        <KpiCard label="High-Risk Zones" value={(hotspots||[]).filter(h=>h.risk==='High').length} accentColor="#ef4444" />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">🏭 CO₂ Emission Trend (7d)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [`${fmtNumber(v)} kg`, n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="co2" stroke="#ef4444" fill="url(#co2Grad)" strokeWidth={2} name="CO₂ (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🔮 24-Hour CO₂ Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>Decision-support only</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={forecastChart}>
              <defs>
                <linearGradient id="co2ForeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [`${fmtNumber(v)} kg`, n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="co2" stroke="#8b5cf6" fill="url(#co2ForeGrad)" strokeWidth={2} name="Forecast CO₂" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NOx / SOx chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">🧪 NOₓ & SOₓ Trend</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.slice(-24)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
            <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
            <Tooltip
              formatter={(v, n) => [`${fmtNumber(v, 3)} kg`, n]}
              contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
            />
            <Bar dataKey="nox" fill="#f59e0b" opacity={0.85} radius={[3,3,0,0]} name="NOₓ (kg)" />
            <Bar dataKey="sox" fill="#8b5cf6" opacity={0.85} radius={[3,3,0,0]} name="SOₓ (kg)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hotspots Table */}
      <div className="card">
        <div className="card-title">📍 Pollution Hotspot Zones</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Zone</th><th>CO₂ Level (ppm)</th><th>Risk</th><th>Coordinates</th></tr>
            </thead>
            <tbody>
              {(hotspots || []).map((h, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{h.zone}</td>
                  <td>
                    <span style={{ color: riskColor(h.risk), fontWeight: 600 }}>{fmtNumber(h.co2_level_ppm, 0)}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>ppm</span>
                  </td>
                  <td><span className={`alert-badge ${riskClass(h.risk)}`}>{h.risk}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{h.lat}°N, {h.lng}°E</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
