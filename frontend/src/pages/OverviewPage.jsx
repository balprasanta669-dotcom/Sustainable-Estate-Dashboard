import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Wind, Droplets, Zap, Trash2, AlertTriangle, Leaf, Activity, Car, Award,
  Sparkles, Sliders, RefreshCw, CheckCircle2, TrendingUp, TrendingDown,
  RotateCcw, ShieldAlert, Cpu, Layers, Sun, Gauge
} from 'lucide-react';
import { dashboardApi, alertsApi } from '../services/api';
import { usePolling } from '../hooks/useAsync';
import KpiCard   from '../components/KpiCard';
import Spinner   from '../components/Spinner';
import { fmtNumber, aqiInfo, severityClass, severityColor, relativeTime, truncate } from '../utils/helpers';

export default function OverviewPage() {
  const [campusId, setCampusId] = useState(() => localStorage.getItem('active_campus_id') || '');

  // IoT Sensory Trend State
  const [trendWindow, setTrendWindow] = useState(24);
  const [activeMetricTab, setActiveMetricTab] = useState('energy'); // 'energy', 'air', 'water', 'traffic', 'waste'
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Synthetic Data Injection State
  const [showSyntheticModal, setShowSyntheticModal] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [syntheticStatus, setSyntheticStatus] = useState(null);
  const [customSensorType, setCustomSensorType] = useState('energy');
  const [customPattern, setCustomPattern] = useState('spike');
  const [customMultiplier, setCustomMultiplier] = useState(1.6);
  const [customDuration, setCustomDuration] = useState(12);
  const [customNote, setCustomNote] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleFacilityChange = () => {
      setCampusId(localStorage.getItem('active_campus_id') || '');
    };
    window.addEventListener('facility_changed', handleFacilityChange);
    return () => window.removeEventListener('facility_changed', handleFacilityChange);
  }, []);

  const overviewFn = useCallback(() => dashboardApi.getOverview(campusId), [campusId]);
  const alertsFn   = useCallback(() => alertsApi.getAll(), []);
  const recsFn     = useCallback(() => alertsApi.getRecommendations(), []);

  const { data: overview, loading: ovLoad, refresh: refreshOverview } = usePolling(overviewFn, 20000);
  const { data: alertsData } = usePolling(alertsFn, 25000);
  const { data: recs }       = usePolling(recsFn,   45000);

  // Fetch IoT Sensory Trends
  const fetchTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const res = await dashboardApi.getIotTrends(trendWindow, campusId);
      setTrendsData(res.data);
      if (res.data?.synthetic_details) {
        setSyntheticStatus(res.data.synthetic_details);
      } else {
        setSyntheticStatus(null);
      }
    } catch (e) {
      console.error('Failed to fetch IoT trends:', e);
    } finally {
      setTrendsLoading(false);
    }
  }, [trendWindow, campusId]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Handle Synthetic Injection
  const handleInjectSynthetic = async (scenarioKey = 'custom') => {
    try {
      setSyntheticLoading(true);
      const payload = scenarioKey === 'custom'
        ? {
            scenario: 'custom',
            sensor_type: customSensorType,
            pattern: customPattern,
            multiplier: parseFloat(customMultiplier),
            duration_hours: parseInt(customDuration, 10),
            description: customNote.trim() || undefined
          }
        : { scenario: scenarioKey };

      const res = await dashboardApi.injectSynthetic(payload);
      if (res.data?.success) {
        setToastMessage(`⚡ Synthetic Telemetry Injected: ${res.data.synthetic_state?.scenario_name}`);
        setShowSyntheticModal(false);
        await Promise.all([refreshOverview(), fetchTrends()]);
      }
    } catch (err) {
      setToastMessage(`Injection error: ${err.message}`);
    } finally {
      setSyntheticLoading(false);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Handle Reset to Real Baseline
  const handleResetSynthetic = async () => {
    try {
      setSyntheticLoading(true);
      await dashboardApi.resetSynthetic();
      setSyntheticStatus(null);
      setToastMessage('✅ Reset to authentic real telemetry baseline.');
      setShowSyntheticModal(false);
      await Promise.all([refreshOverview(), fetchTrends()]);
    } catch (err) {
      setToastMessage(`Reset error: ${err.message}`);
    } finally {
      setSyntheticLoading(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  if (ovLoad && !overview) return <div className="page"><Spinner /></div>;

  const { kpis, facility, alerts_summary } = overview || {};
  const isSyntheticActive = Boolean(overview?.synthetic_telemetry?.is_active || syntheticStatus?.is_active);
  const synthInfo = overview?.synthetic_telemetry || syntheticStatus;
  const aqi = aqiInfo(kpis?.aqi_current || 95);

  // Radar data for module health
  const radarData = [
    { subject: 'Air Quality',  A: 100 - ((kpis?.aqi_current || 90) / 5) },
    { subject: 'Energy',       A: 100 - ((kpis?.energy_kw || 400) / 10) },
    { subject: 'Water',        A: 100 - ((kpis?.water_kl_today || 300) / 10) },
    { subject: 'Waste',        A: 100 - ((kpis?.waste_kg_today || 300) / 7) },
    { subject: 'Safety',       A: 100 - (kpis?.open_incidents || 0) * 5 },
    { subject: 'Sustainability', A: kpis?.sustainability_score || 80 },
  ].map(d => ({ ...d, A: Math.max(0, Math.min(100, d.A)) }));

  // Trend Metric Configurations
  const METRIC_CONFIGS = {
    energy: {
      label: 'Energy & Solar Microgrid',
      unit: 'kW',
      primaryKey: 'energy_kw',
      secondaryKey: 'solar_kw',
      primaryColor: '#38bdf8',
      secondaryColor: '#f59e0b',
      fillGrad: 'url(#energyGrad)',
      icon: Zap,
      summary: trendsData?.metrics_summary?.energy
    },
    air: {
      label: 'Air Quality Telemetry',
      unit: 'AQI Index',
      primaryKey: 'aqi',
      secondaryKey: 'pm25',
      primaryColor: '#00c896',
      secondaryColor: '#f43f5e',
      fillGrad: 'url(#airGrad)',
      icon: Wind,
      summary: trendsData?.metrics_summary?.air_quality
    },
    water: {
      label: 'Campus Water & Quality',
      unit: 'KL/h',
      primaryKey: 'water_kl',
      secondaryKey: 'water_tds',
      primaryColor: '#00d4ff',
      secondaryColor: '#a855f7',
      fillGrad: 'url(#waterGrad)',
      icon: Droplets,
      summary: trendsData?.metrics_summary?.water
    },
    traffic: {
      label: 'Campus Gate ANPR Traffic',
      unit: 'veh/h',
      primaryKey: 'traffic_count',
      primaryColor: '#f59e0b',
      fillGrad: 'url(#trafficGrad)',
      icon: Car,
      summary: trendsData?.metrics_summary?.traffic
    },
    waste: {
      label: 'Smart Waste Bin Fill Level',
      unit: '% Fill',
      primaryKey: 'waste_fill_pct',
      primaryColor: '#8b5cf6',
      fillGrad: 'url(#wasteGrad)',
      icon: Trash2,
      summary: trendsData?.metrics_summary?.waste
    }
  };

  const activeMetric = METRIC_CONFIGS[activeMetricTab];

  return (
    <div className="page fade-in-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 99999,
          background: '#0d1526', border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#38bdf8', padding: '12px 18px', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.85rem', fontWeight: 600
        }}>
          <CheckCircle2 size={16} color="#38bdf8" />
          {toastMessage}
        </div>
      )}

      {/* Facility Banner */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,212,255,0.07) 0%, rgba(124,58,237,0.07) 100%)', border: '1px solid rgba(0,212,255,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{facility?.name}</h2>
              {facility?.state === 'Odisha' && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(0, 200, 150, 0.15)', color: '#00c896', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                  🏛️ Odisha Higher Ed Network
                </span>
              )}
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
              {facility?.type} · {facility?.city} · {facility?.area_sqm?.toLocaleString()} m² · {facility?.zones} zones · {facility?.active_sensors} sensors active
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Synthetic Data Studio Trigger Button */}
            <button
              onClick={() => setShowSyntheticModal(true)}
              className={`btn ${isSyntheticActive ? 'btn-primary' : 'btn-outline'}`}
              style={{
                fontSize: '0.8rem',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: isSyntheticActive ? '0 0 16px rgba(0, 212, 255, 0.35)' : 'none'
              }}
            >
              <Cpu size={15} color={isSyntheticActive ? '#fff' : '#38bdf8'} />
              <span>{isSyntheticActive ? '⚡ Synthetic Telemetry Active' : '🧪 Add Synthetic Data'}</span>
            </button>

            {Object.entries(alerts_summary || {}).map(([sev, count]) => (
              count > 0 && (
                <div key={sev} className={`alert-badge badge-${sev === 'critical' ? 'critical' : sev === 'high' ? 'high' : sev === 'medium' ? 'medium' : 'low'} ${sev === 'critical' ? 'pulse-critical' : ''}`}>
                  {count} {sev}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Synthetic Overlay Active Banner */}
        {isSyntheticActive && (
          <div style={{
            marginTop: 14,
            padding: '10px 16px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldAlert size={18} color="#f59e0b" />
              <div>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.84rem' }}>
                  SYNTHETIC OVERLAY ACTIVE: {synthInfo?.scenario_name || 'Custom Telemetry Surge'}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1', marginLeft: 8 }}>
                  ({synthInfo?.multiplier}x multiplier on {synthInfo?.sensor_type} sensors · {synthInfo?.duration_hours}h window)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowSyntheticModal(true)}
                className="btn btn-outline"
                style={{ fontSize: '0.74rem', padding: '4px 10px', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}
              >
                Modify Scenario
              </button>
              <button
                onClick={handleResetSynthetic}
                disabled={syntheticLoading}
                className="btn btn-secondary"
                style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RotateCcw size={12} />
                Reset to Real Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <KpiCard icon={Wind}          label="AQI" value={fmtNumber(kpis?.aqi_current, 0)} unit={aqi.label} accentColor={aqi.color} />
        <KpiCard icon={Zap}           label="Energy" value={fmtNumber(kpis?.energy_kw, 0)} unit="kW" />
        <KpiCard icon={Droplets}      label="Water Today" value={fmtNumber(kpis?.water_kl_today, 0)} unit="KL" />
        <KpiCard icon={Trash2}        label="Waste Today" value={fmtNumber(kpis?.waste_kg_today, 0)} unit="kg" />
        <KpiCard icon={Activity}      label="CO₂ Today" value={fmtNumber(kpis?.co2_today_kg, 0)} unit="kg" />
        <KpiCard icon={Leaf}          label="Sustainability" value={fmtNumber(kpis?.sustainability_score, 0)} unit="/ 100" />
        <KpiCard icon={AlertTriangle} label="Active Alerts" value={kpis?.active_alerts || 0} />
        <KpiCard icon={Car}           label="Open Incidents" value={kpis?.open_incidents || 0} />
      </div>

      {/* ============================================================
          IoT Sensory Telemetry Trends Section
          ============================================================ */}
      <div className="card" style={{ marginBottom: 20 }}>
        {/* Header with Metric Tabs and Time Window Switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                IoT Sensory Telemetry Trends & Patterns
              </h3>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              Synchronized multi-sensor telemetry stream {isSyntheticActive ? '· (Displaying Injected Synthetic Perturbations)' : '· (Real Telemetry Baseline)'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Time Window Buttons */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: 3, borderRadius: 8, border: '1px solid var(--color-border)' }}>
              {[
                { label: '24 Hours', val: 24 },
                { label: '48 Hours', val: 48 },
                { label: '7 Days', val: 168 }
              ].map(w => (
                <button
                  key={w.val}
                  onClick={() => setTrendWindow(w.val)}
                  style={{
                    background: trendWindow === w.val ? 'var(--color-primary)' : 'transparent',
                    color: trendWindow === w.val ? '#070b14' : 'var(--color-text-secondary)',
                    fontWeight: trendWindow === w.val ? 700 : 500,
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchTrends()}
              disabled={trendsLoading}
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              title="Refresh trend stream"
            >
              <RefreshCw size={12} className={trendsLoading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Sensor Metric Selector Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
          {Object.entries(METRIC_CONFIGS).map(([tabKey, config]) => {
            const Icon = config.icon;
            const isSelected = activeMetricTab === tabKey;
            const summary = config.summary;
            const isUp = summary?.direction === 'up';

            return (
              <button
                key={tabKey}
                onClick={() => setActiveMetricTab(tabKey)}
                style={{
                  background: isSelected ? 'rgba(0, 212, 255, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                  border: isSelected ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid var(--color-border)',
                  color: isSelected ? '#38bdf8' : 'var(--color-text-secondary)',
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} color={isSelected ? '#38bdf8' : 'var(--color-text-muted)'} />
                <span>{config.label}</span>
                {summary && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: isUp ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: isUp ? '#f87171' : '#4ade80',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {summary.delta_pct > 0 ? `+${summary.delta_pct}%` : `${summary.delta_pct}%`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Trend Summary Cards Bar */}
        {activeMetric.summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Current Reading</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: activeMetric.primaryColor }}>
                {fmtNumber(activeMetric.summary.current, 1)} <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{activeMetric.unit}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Period Peak</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                {fmtNumber(activeMetric.summary.peak, 1)} <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{activeMetric.unit}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Rolling Average</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#cbd5e1' }}>
                {fmtNumber(activeMetric.summary.avg, 1)} <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{activeMetric.unit}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Telemetry Trend Drift</div>
              <div style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: activeMetric.summary.direction === 'up' ? '#f87171' : activeMetric.summary.direction === 'down' ? '#4ade80' : '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {activeMetric.summary.direction === 'up' ? <TrendingUp size={16} /> : activeMetric.summary.direction === 'down' ? <TrendingDown size={16} /> : null}
                <span>{activeMetric.summary.delta_pct > 0 ? `+${activeMetric.summary.delta_pct}%` : `${activeMetric.summary.delta_pct}%`}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>vs average</span>
              </div>
            </div>
          </div>
        )}

        {/* Recharts Area Chart */}
        <div style={{ width: '100%', height: 290 }}>
          {trendsLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner />
            </div>
          ) : trendsData?.series && trendsData.series.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData.series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="airGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c896" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00c896" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" tick={{ fill: '#8b99b5', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8b99b5', fontSize: 11 }} domain={['auto', 'auto']} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          background: '#0d1526',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <span>{data.full_timestamp || data.timestamp}</span>
                            {data.is_synthetic && (
                              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem' }}>⚡ SYNTHETIC POINT</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, color: activeMetric.primaryColor }}>
                            {activeMetric.label}: {data[activeMetric.primaryKey]} {activeMetric.unit}
                          </div>
                          {activeMetric.secondaryKey && (
                            <div style={{ fontSize: '0.75rem', color: activeMetric.secondaryColor, marginTop: 2 }}>
                              Secondary: {data[activeMetric.secondaryKey]}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric.primaryKey}
                  stroke={activeMetric.primaryColor}
                  fill={activeMetric.fillGrad}
                  strokeWidth={2.5}
                />
                {activeMetric.secondaryKey && (
                  <Area
                    type="monotone"
                    dataKey={activeMetric.secondaryKey}
                    stroke={activeMetric.secondaryColor}
                    fill="transparent"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              No telemetry trend data available for current window.
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Module Health Radar */}
        <div className="card">
          <div className="card-title">🎯 Module Health Radar</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b99b5', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#4a5568', fontSize: 9 }} />
              <Radar name="Score" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts Feed */}
        <div className="card">
          <div className="card-title">🚨 Live Alert Feed</div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {alertsData?.alerts?.slice(0, 8).map(alert => (
              <div key={alert.id} className="alert-item">
                <div className="alert-dot" style={{ background: severityColor(alert.severity) }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', marginBottom: 2 }}>
                    <span className={`alert-badge ${severityClass(alert.severity)}`} style={{ marginRight: 6 }}>
                      {alert.severity}
                    </span>
                    {truncate(alert.message, 70)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                    {alert.module} · {relativeTime(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Decisions */}
      <div className="card">
        <div className="section-header">
          <div className="card-title" style={{ marginBottom: 0 }}>🤖 Google Gemini Autonomous AI Decisions</div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Generative Multi-Sensor Reasoning · Zero If/Else Rules</span>
        </div>
        <div style={{ marginTop: 16 }}>
          {(recs || []).slice(0, 4).map(rec => (
            <div key={rec.id} className="rec-card" style={{ borderLeft: '3px solid #38bdf8' }}>
              <div className="rec-card-header">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="rec-card-module">{rec.module.replace('_', ' ')}</span>
                  {rec.source && (
                    <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                      {rec.source}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`alert-badge ${severityClass(rec.priority)}`}>{rec.priority}</span>
                  <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 600 }}>
                    {rec.confidence_score || rec.confidence_pct || 92}% conf.
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
                  background: 'rgba(15, 23, 42, 0.4)',
                  padding: '6px 10px',
                  borderRadius: 6,
                  marginTop: 6,
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <strong style={{ color: '#38bdf8' }}>Gemini Reasoning: </strong>
                  {rec.ai_reasoning}
                </div>
              )}
              <div className="rec-card-impact" style={{ marginTop: 6 }}>
                ✦ {rec.expected_impact}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          Synthetic Telemetry Studio Modal
          ============================================================ */}
      {showSyntheticModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#0d1526', border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '90vh',
            overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0 }}>
                  🧪 Synthetic IoT Telemetry Studio
                </h3>
              </div>
              <button
                onClick={() => setShowSyntheticModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 18 }}>
              Inject realistic synthetic stress scenarios, sensor spikes, and drift trends to test predictive ML algorithms,
              evaluate Gemini autonomous recommendations, and stress-test campus facilities.
            </p>

            {/* Quick Presets */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#f59e0b" />
                Instant Real-World Presets (One-Click Injection)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 10 }}>
                {[
                  {
                    id: 'summer_heatwave',
                    name: '⚡ Summer Heatwave & AC Overload',
                    desc: '+65% Energy surge on chillers & HVAC at 43°C ambient',
                    type: 'Energy Microgrid',
                    color: '#f59e0b'
                  },
                  {
                    id: 'smog_inversion',
                    name: '🏭 Severe Atmospheric Smog Inversion',
                    desc: 'PM2.5 shoots to 280+ µg/m³, AQI spikes to Severe 365',
                    type: 'Air Quality CAAQMS',
                    color: '#ef4444'
                  },
                  {
                    id: 'water_pipe_burst',
                    name: '💧 Main Water Line Rupture & Leak',
                    desc: 'Night flow jumps to 42 KL/h with rapid pressure drop',
                    type: 'Water Telemetry',
                    color: '#00d4ff'
                  },
                  {
                    id: 'fest_traffic_surge',
                    name: '🚗 Convocation / Annual Fest Gate Rush',
                    desc: 'Inflow traffic surges to 320+ vehicles/hr at main gates',
                    type: 'Gate Traffic ANPR',
                    color: '#38bdf8'
                  },
                  {
                    id: 'weekend_waste_overfill',
                    name: '🗑️ Mess & Hostels Bin Overflow',
                    desc: 'Waste fill exceeds 95% critical overflow risk in mess zones',
                    type: 'Waste Sensors',
                    color: '#8b5cf6'
                  }
                ].map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleInjectSynthetic(p.id)}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = p.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  >
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.85rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 3 }}>{p.desc}</div>
                    <div style={{ fontSize: '0.7rem', color: p.color, fontWeight: 600, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>Inject Preset</span>
                      <ArrowRight size={11} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Parameter Builder */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38bdf8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={14} />
                Custom Synthetic Sensor Generator
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Target Sensor Telemetry:
                  </label>
                  <select
                    value={customSensorType}
                    onChange={e => setCustomSensorType(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid var(--color-border)',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  >
                    <option value="energy">⚡ Energy (kW / Solar)</option>
                    <option value="air_quality">🌬️ Air Quality (AQI / PM2.5)</option>
                    <option value="water">💧 Water Usage (KL / TDS)</option>
                    <option value="traffic">🚗 Campus Gate Traffic</option>
                    <option value="waste">🗑️ Solid Waste Bins</option>
                    <option value="all">🌐 All Campus Sensors (Multi-Vector)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Trend Pattern / Anomaly Shape:
                  </label>
                  <select
                    value={customPattern}
                    onChange={e => setCustomPattern(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#070b14',
                      border: '1px solid var(--color-border)',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  >
                    <option value="spike">📈 Sudden Spike (Peak Bell Curve)</option>
                    <option value="dip">📉 Sudden Drop / Sag</option>
                    <option value="drift">↗️ Linear Drift (Gradual Escalation)</option>
                    <option value="sine">🌊 Cyclic Sine Wave (Oscillation)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Magnitude Multiplier: <strong style={{ color: '#38bdf8' }}>{customMultiplier}x (+{Math.round((customMultiplier - 1) * 100)}%)</strong>
                  </label>
                  <input
                    type="range"
                    min="1.1"
                    max="3.0"
                    step="0.1"
                    value={customMultiplier}
                    onChange={e => setCustomMultiplier(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Duration Window: <strong style={{ color: '#38bdf8' }}>{customDuration} Hours</strong>
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="48"
                    step="2"
                    value={customDuration}
                    onChange={e => setCustomDuration(e.target.value)}
                    style={{ width: '100%', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                  Scenario Description / Note:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Substation Transformer 2 Cooling Oil Leak Test"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b14',
                    border: '1px solid var(--color-border)',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleInjectSynthetic('custom')}
                  disabled={syntheticLoading}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Cpu size={14} />
                  {syntheticLoading ? 'Injecting Telemetry…' : 'Inject Custom Synthetic Telemetry'}
                </button>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <button
                onClick={handleResetSynthetic}
                disabled={syntheticLoading || !isSyntheticActive}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, opacity: isSyntheticActive ? 1 : 0.5 }}
              >
                <RotateCcw size={14} />
                Reset to Real Baseline Data
              </button>

              <button
                onClick={() => setShowSyntheticModal(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.8rem', padding: '8px 16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
