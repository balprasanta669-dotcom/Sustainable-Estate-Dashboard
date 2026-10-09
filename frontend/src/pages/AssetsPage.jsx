import { useCallback } from 'react';
import { Settings } from 'lucide-react';
import { assetsApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import KpiCard from '../components/KpiCard';
import Spinner from '../components/Spinner';
import { fmtNumber } from '../utils/helpers';

export default function AssetsPage() {
  const allFn      = useCallback(() => assetsApi.getAll(),      []);
  const criticalFn = useCallback(() => assetsApi.getCritical(), []);

  const { data: assets,   loading } = usePolling(allFn,      60000);
  const { data: critical }          = usePolling(criticalFn, 60000);

  if (loading || !assets) return <div className="page"><Spinner /></div>;

  const operational = assets.filter(a => a.status === 'Operational').length;
  const degraded    = assets.filter(a => a.status === 'Degraded').length;
  const down        = assets.filter(a => a.status === 'Down').length;
  const avgHealth   = assets.reduce((s,a)=>s+a.health_score, 0) / assets.length;
  const avgUptime   = assets.reduce((s,a)=>s+a.uptime_pct,   0) / assets.length;

  const statusColor = (s) => s === 'Operational' ? '#00c896' : s === 'Degraded' ? '#f59e0b' : '#ef4444';
  const healthColor = (h) => h >= 80 ? '#00c896' : h >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page fade-in-up">
      <div className="kpi-grid">
        <KpiCard icon={Settings} label="Total Assets"   value={assets.length} />
        <KpiCard label="Operational"  value={operational} accentColor="#00c896" />
        <KpiCard label="Degraded"     value={degraded}    accentColor="#f59e0b" />
        <KpiCard label="Down"         value={down}        accentColor={down > 0 ? '#ef4444' : undefined} />
        <KpiCard label="Avg Health"   value={fmtNumber(avgHealth)} unit="/ 100" />
        <KpiCard label="Avg Uptime"   value={fmtNumber(avgUptime)} unit="%" />
      </div>

      {critical?.count > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
          <div className="card-title" style={{ marginBottom: 10 }}>⚠️ Critical Assets Requiring Attention</div>
          {critical.assets.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, marginRight: 10 }}>{a.id}</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{a.name}</span>
                <span style={{ color: 'var(--color-text-muted)', marginLeft: 8, fontSize: '0.75rem' }}>{a.zone}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Next maintenance: {a.next_maintenance}</span>
                <span className={`alert-badge ${a.status === 'Down' ? 'badge-critical' : 'badge-high'}`}>{a.status}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--color-warning)' }}>
            💡 {critical.recommendation}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">🔧 All Assets</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Type</th><th>Zone</th>
                <th>Status</th><th>Uptime</th><th>Health</th>
                <th>Last Maint.</th><th>Next Maint.</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{a.id}</td>
                  <td style={{ color: 'var(--color-text-primary)' }}>{a.name}</td>
                  <td>{a.type}</td>
                  <td>{a.zone}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(a.status), flexShrink: 0, display: 'inline-block' }} />
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress-bar-wrap" style={{ width: 60 }}>
                        <div className="progress-bar-fill" style={{ width: `${a.uptime_pct}%`, background: statusColor(a.status) }} />
                      </div>
                      <span style={{ fontSize: '0.78rem' }}>{a.uptime_pct}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: healthColor(a.health_score), fontWeight: 600 }}>{a.health_score}</span>
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>{a.last_maintenance}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--color-warning)' }}>{a.next_maintenance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
