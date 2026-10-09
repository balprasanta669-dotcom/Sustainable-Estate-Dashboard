import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Wind, Trash2, Droplets, Zap,
  Car, Settings, Activity, AlertTriangle, Leaf, Bell, Cpu, GraduationCap,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',                 icon: LayoutDashboard, label: 'Overview' },
  { to: '/odisha-colleges',  icon: GraduationCap,   label: 'Odisha Campuses 🏛️' },
  { to: '/air-quality',      icon: Wind,            label: 'Air Quality' },
  { to: '/waste',            icon: Trash2,          label: 'Waste Management' },
  { to: '/water',            icon: Droplets,        label: 'Water Usage' },
  { to: '/energy',           icon: Zap,             label: 'Energy' },
  { to: '/traffic',          icon: Car,             label: 'Traffic & Parking' },
  { to: '/assets',           icon: Settings,        label: 'Asset Utilization' },
  { to: '/emissions',        icon: Activity,        label: 'Emissions' },
  { to: '/safety',           icon: AlertTriangle,   label: 'Safety Incidents' },
  { to: '/sustainability',   icon: Leaf,            label: 'Sustainability' },
  { to: '/alerts',           icon: Bell,            label: 'Alerts & Actions' },
  { to: '/ml-training',      icon: Cpu,             label: 'ML Training Studio' },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚡ FacilityIQ</h1>
        <span>Sustainable Intelligence Dashboard</span>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      <nav>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item ${pathname === to ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: 6 }}>
          <span className="live-dot" style={{ marginRight: 6 }} />
          Live data feed — syncs every 30s
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem' }}>
          AIIMS Campus, New Delhi · v1.0.0
        </div>
      </div>
    </aside>
  );
}
