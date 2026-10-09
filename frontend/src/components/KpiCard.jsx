/** Reusable KPI metric card */
export default function KpiCard({ label, value, unit, trend, trendDir, accentColor, icon: Icon }) {
  return (
    <div className="kpi-card fade-in-up" style={accentColor ? { '--kpi-accent': accentColor } : {}}>
      <div className="kpi-label">
        {Icon && <Icon size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
        {label}
      </div>
      <div className="kpi-value">
        {value ?? '—'}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      {trend && (
        <div className={`kpi-trend ${trendDir || 'flat'}`}>
          {trendDir === 'up' ? '▲' : trendDir === 'down' ? '▼' : '—'} {trend}
        </div>
      )}
    </div>
  );
}
