import { useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LineChart, Line,
} from 'recharts';
import { Wind } from 'lucide-react';
import { airQualityApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber, aqiInfo } from '../utils/helpers';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#111d35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', fontSize: '0.8rem' }}>
      <div style={{ color: '#8b99b5', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || '#00d4ff' }}>
          {p.name}: <strong>{fmtNumber(p.value)}</strong>
        </div>
      ))}
    </div>
  );
};

export default function AirQualityPage() {
  const histFn     = useCallback(() => airQualityApi.getHistory(168), []);
  const forecastFn = useCallback(() => airQualityApi.getForecast(24),  []);
  const anomalyFn  = useCallback(() => airQualityApi.getAnomalies(168),[]);

  const { data: history,  loading } = usePolling(histFn,     30000);
  const { data: forecast }          = useAsync(forecastFn);
  const { data: anomalies }         = useAsync(anomalyFn);

  if (loading || !history) return <div className="page"><Spinner /></div>;

  const latest    = history[history.length - 1] || {};
  const aqi       = aqiInfo(latest.aqi || 0);
  const anomCount = anomalies?.filter(a => a.is_anomaly).length || 0;

  // Sample every 4 points for chart readability
  const chartData = history.filter((_, i) => i % 4 === 0).map(r => ({
    t:    r.timestamp?.slice(11, 16),
    aqi:  r.aqi,
    pm25: r.pm25,
    pm10: r.pm10,
    anomaly: r.is_anomaly ? r.aqi : null,
  }));

  const forecastChart = (forecast || []).map(r => ({
    t:   r.timestamp?.slice(11, 16),
    aqi: r.aqi,
    lo:  r.lower_ci,
    hi:  r.upper_ci,
  }));

  return (
    <div className="page fade-in-up">
      {/* KPIs */}
      <div className="kpi-grid">
        <KpiCard icon={Wind} label="Current AQI" value={fmtNumber(latest.aqi, 0)} unit={aqi.label} accentColor={aqi.color} />
        <KpiCard label="PM2.5" value={fmtNumber(latest.pm25)} unit="µg/m³" />
        <KpiCard label="PM10"  value={fmtNumber(latest.pm10)} unit="µg/m³" />
        <KpiCard label="NO₂"   value={fmtNumber(latest.no2)}  unit="µg/m³" />
        <KpiCard label="CO"    value={fmtNumber(latest.co)}   unit="mg/m³" />
        <KpiCard label="Anomalies (7d)" value={anomCount} />
      </div>

      {/* AQI Category banner */}
      <div className="card" style={{ marginBottom: 20, borderColor: aqi.color + '44', background: aqi.color + '0d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: aqi.color, flexShrink: 0 }} />
          <div>
            <strong style={{ color: aqi.color }}>{aqi.label}</strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginLeft: 12 }}>
              {aqi.label === 'Good' && 'Air quality is satisfactory, and air pollution poses little or no risk.'}
              {aqi.label === 'Satisfactory' && 'Air quality is acceptable. Sensitive individuals may experience minor effects.'}
              {aqi.label === 'Moderate' && 'Members of sensitive groups may experience health effects. Increase ventilation.'}
              {aqi.label === 'Poor' && 'Everyone may begin to experience health effects. Activate indoor air filtration.'}
              {(aqi.label === 'Very Poor' || aqi.label === 'Severe') && 'Health alert: everyone may experience serious health effects. Restrict outdoor activity.'}
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">📈 7-Day AQI History</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={200} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Poor', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10 }} />
              <Area type="monotone" dataKey="aqi" stroke="#00d4ff" fill="url(#aqiGrad)" strokeWidth={2} name="AQI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">🔮 24-Hour AQI Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
            Shaded area shows 95% confidence interval · Decision-support only
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={forecastChart}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
              <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hi"  stroke="transparent" fill="url(#forecastGrad)" name="Upper CI" />
              <Area type="monotone" dataKey="aqi" stroke="#7c3aed" fill="transparent" strokeWidth={2} name="Forecast AQI" />
              <Area type="monotone" dataKey="lo"  stroke="transparent" fill="#111d35" name="Lower CI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Particulate Chart */}
      <div className="card">
        <div className="card-title">🌫️ PM2.5 vs PM10 Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="t" tick={{ fill: '#4a5568', fontSize: 10 }} />
            <YAxis tick={{ fill: '#4a5568', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="pm25" stroke="#00c896" dot={false} strokeWidth={2} name="PM2.5 (µg/m³)" />
            <Line type="monotone" dataKey="pm10" stroke="#f59e0b" dot={false} strokeWidth={2} name="PM10 (µg/m³)" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: '0.75rem' }}>
          <span style={{ color: '#00c896' }}>● PM2.5</span>
          <span style={{ color: '#f59e0b' }}>● PM10</span>
        </div>
      </div>
    </div>
  );
}
