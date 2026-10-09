import { useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Line,
} from 'recharts';
import { Zap } from 'lucide-react';
import { energyApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber } from '../utils/helpers';

export default function EnergyPage() {
  const energyFn = useCallback(() => energyApi.getConsumption(168), []);
  const optFn    = useCallback(() => energyApi.getOptimization(),    []);
  const forecastFn = useCallback(() => energyApi.getForecast(24),   []);

  const { data: energy,   loading } = usePolling(energyFn, 30000);
  const { data: opt }               = useAsync(optFn);
  const { data: forecast }          = useAsync(forecastFn);

  if (loading || !energy) return <div className="page"><Spinner /></div>;

  const latest     = energy[energy.length - 1] || {};
  const totalKwh   = energy.reduce((s, r) => s + r.consumption_kw, 0);
  const totalSolar = energy.reduce((s, r) => s + r.solar_generation_kw, 0);
  const solarPct   = totalKwh > 0 ? (totalSolar / totalKwh * 100) : 0;

  const chartData = energy.filter((_, i) => i % 4 === 0).map(r => ({
    t:     r.timestamp?.slice(11, 16),
    total: r.consumption_kw,
    solar: r.solar_generation_kw,
    grid:  r.grid_draw_kw,
  }));

  const forecastChart = (forecast || []).map(r => ({
    t:  r.timestamp?.slice(11, 16),
    kw: r.consumption_kw,
  }));

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Zap} label="Current Draw"    value={fmtNumber(latest.consumption_kw, 0)}      unit="kW" />
        <KpiCard label="Solar Generation" value={fmtNumber(latest.solar_generation_kw, 0)} unit="kW" accentColor="#f59e0b" />
        <KpiCard label="Grid Draw"        value={fmtNumber(latest.grid_draw_kw, 0)}        unit="kW" />
        <KpiCard label="Solar Share"      value={fmtNumber(solarPct)}                      unit="%" accentColor="#00c896" />
        <KpiCard label="Cost (7d)"        value={`₹${fmtNumber(energy.reduce((s,r)=>s+r.cost_inr,0)/1000,1)}K`} />
        <KpiCard label="Power Factor"     value={fmtNumber(latest.pf, 3)} />
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Energy Stack Chart */}
        <div className="card">
          <div className="card-title">⚡ Consumption vs Solar Generation</div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [`${fmtNumber(v)} kW`, n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Bar dataKey="solar" fill="#f59e0b" opacity={0.8} radius={[2,2,0,0]} name="Solar (kW)" />
              <Line type="monotone" dataKey="total" stroke="#00d4ff" strokeWidth={2} dot={false} name="Total (kW)" />
              <Line type="monotone" dataKey="grid"  stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Grid (kW)" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 20, marginTop: 10, fontSize: '0.75rem' }}>
            <span style={{ color: '#f59e0b' }}>■ Solar</span>
            <span style={{ color: '#00d4ff' }}>— Total</span>
            <span style={{ color: '#ef4444' }}>-- Grid</span>
          </div>
        </div>

        {/* Forecast */}
        <div className="card">
          <div className="card-title">🔮 24-Hour Energy Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>Projected consumption (kW)</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={forecastChart}>
              <defs>
                <linearGradient id="enGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip
                formatter={(v, n) => [`${fmtNumber(v)} kW`, n]}
                contentStyle={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '0.8rem' }}
              />
              <Area type="monotone" dataKey="kw" stroke="#7c3aed" fill="url(#enGrad)" strokeWidth={2} name="Forecast kW" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimization Recommendations */}
      {opt && (
        <div className="card">
          <div className="section-header">
            <div className="card-title" style={{ marginBottom: 0 }}>🤖 AI Optimization Schedule</div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--color-success)' }}>
                Total saving: <strong>{fmtNumber(opt.total_daily_saving_kw)} kW · ₹{fmtNumber(opt.total_daily_saving_inr, 0)}/day · {fmtNumber(opt.co2_reduction_kg_day)} kg CO₂ saved</strong>
              </span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            {opt.recommendations.map((r, i) => (
              <div key={i} className="rec-card">
                <div className="rec-card-header">
                  <span className="rec-card-module">⏰ {r.time_slot}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>
                    Save {r.potential_saving_kw} kW · ₹{fmtNumber(r.cost_saving_inr, 0)}/day
                  </span>
                </div>
                <div className="rec-card-action">{r.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
