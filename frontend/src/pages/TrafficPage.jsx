import { useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Car } from 'lucide-react';
import { trafficApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber } from '../utils/helpers';

export default function TrafficPage() {
  const flowFn    = useCallback(() => trafficApi.getFlow(48),    []);
  const parkingFn = useCallback(() => trafficApi.getParking(),   []);
  const hotFn     = useCallback(() => trafficApi.getHotspots(),  []);

  const { data: flow,    loading } = usePolling(flowFn,    30000);
  const { data: parking }          = usePolling(parkingFn, 30000);
  const { data: hotspots }         = useAsync(hotFn);

  if (loading || !flow) return <div className="page"><Spinner /></div>;

  const avgVehicles = flow.length ? Math.round(flow.reduce((s,r)=>s+r.vehicle_count,0)/flow.length) : 0;
  const peakVehicles = Math.max(...flow.map(r=>r.vehicle_count));
  const highCongestion = flow.filter(r=>r.congestion_level==='High').length;

  const chartData = flow.filter((_, i) => i % 2 === 0).map(r => ({
    t:       r.timestamp?.slice(11, 16),
    vehicles: r.vehicle_count,
    speed:   r.avg_speed_kmh,
  }));

  const parkingUtil = (parking || []).reduce((s,l)=>s+l.occupied, 0);
  const parkingTotal = (parking || []).reduce((s,l)=>s+l.total_spaces, 0);

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Car} label="Avg Vehicles/Hr" value={avgVehicles} />
        <KpiCard label="Peak Count"     value={peakVehicles} />
        <KpiCard label="High Congestion Events" value={highCongestion} accentColor="#ef4444" />
        <KpiCard label="Parking Occupied" value={parkingUtil} unit={`/ ${parkingTotal}`} />
        <KpiCard label="Parking Util."    value={fmtNumber(parkingUtil/Math.max(parkingTotal,1)*100, 0)} unit="%" />
      </div>

      {hotspots?.hotspot_events > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
          <span className="alert-badge badge-high" style={{ marginRight: 8 }}>🚗 CONGESTION</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            {hotspots.hotspot_events} high-congestion events detected · {hotspots.recommendation}
          </span>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title">🚗 Vehicle Flow (48h)</div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="vehicles" stroke="#00d4ff" fill="url(#trafficGrad)" strokeWidth={2} name="Vehicles/30min" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Parking Lots */}
        <div className="card">
          <div className="card-title">🅿️ Parking Utilization</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {(parking || []).map(lot => (
              <div key={lot.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{lot.name}</span>
                  <span>
                    <span className={`alert-badge ${lot.status === 'Full' ? 'badge-critical' : lot.status === 'Almost Full' ? 'badge-high' : 'badge-ok'}`}>
                      {lot.status}
                    </span>
                    <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)', fontSize: '0.78rem' }}>
                      {lot.occupied}/{lot.total_spaces} · {lot.utilization_pct}%
                    </span>
                  </span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{
                    width: `${lot.utilization_pct}%`,
                    background: lot.utilization_pct >= 95 ? '#ef4444' : lot.utilization_pct >= 80 ? '#f59e0b' : '#00c896',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Traffic Table */}
      <div className="card">
        <div className="card-title">📋 Recent Traffic Events</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Time</th><th>Gate</th><th>Vehicles</th><th>Avg Speed</th><th>Congestion</th></tr>
            </thead>
            <tbody>
              {flow.slice(-20).reverse().map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: '0.78rem' }}>{r.timestamp?.slice(11, 16)}</td>
                  <td>{r.gate}</td>
                  <td>{r.vehicle_count}</td>
                  <td>{r.avg_speed_kmh} km/h</td>
                  <td>
                    <span className={`alert-badge ${r.congestion_level === 'High' ? 'badge-critical' : r.congestion_level === 'Medium' ? 'badge-high' : 'badge-ok'}`}>
                      {r.congestion_level}
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
