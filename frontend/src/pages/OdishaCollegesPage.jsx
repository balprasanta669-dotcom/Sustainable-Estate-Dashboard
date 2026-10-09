import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Building2, Sun, Droplets, Wind, Zap,
  TreePine, Activity, MapPin, Users, Award, ExternalLink,
  RefreshCw, CheckCircle2, Layers, Search, Compass, ShieldCheck
} from 'lucide-react';
import { collegesApi } from '../services/api';
import Spinner from '../components/Spinner';
import { fmtNumber, aqiInfo } from '../utils/helpers';

export default function OdishaCollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [activeModalCollege, setActiveModalCollege] = useState(null);
  const [syncMessage, setSyncMessage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [collegesRes, statsRes] = await Promise.all([
        collegesApi.getOdishaColleges(),
        collegesApi.getStats()
      ]);
      setColleges(collegesRes.data?.colleges || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load Odisha colleges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncLive = async (college) => {
    try {
      setSyncingId(college.id);
      const res = await collegesApi.syncCollege(college.id);
      if (res.data?.success) {
        setSyncMessage(`Synced live Open-Meteo telemetry for ${college.short_name}!`);
        await fetchData();
      }
    } catch (err) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const filteredColleges = colleges.filter((c) => {
    const matchesDistrict =
      selectedDistrict === 'all' ||
      c.district.toLowerCase() === selectedDistrict.toLowerCase() ||
      c.city.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesSearch;
  });

  if (loading && !colleges.length) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="page fade-in-up">
      {/* Hero Header */}
      <div
        className="card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(124, 58, 237, 0.08) 50%, rgba(0, 200, 150, 0.06) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '1.8rem' }}>🏛️</span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Odisha Higher Education & Smart Campus Intelligence
              </h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', maxWidth: 840, lineHeight: 1.6 }}>
              Comprehensive real-time telemetry, campus microgrid energy, rooftop solar PV, wastewater treatment (STP),
              and live Open-Meteo & OSPCB air quality monitoring across Odisha's premier universities and research institutes.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              State of Odisha (OSPCB / Open-Meteo Synced)
            </span>
          </div>
        </div>

        {/* Sync Toast */}
        {syncMessage && (
          <div style={{
            marginTop: 14,
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} />
            {syncMessage}
          </div>
        )}
      </div>

      {/* State-wide Aggregate KPIs */}
      {stats && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <GraduationCap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Campuses Tracked</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {stats.institutions_tracked} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>Premier Hubs</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              Bhubaneswar, Rourkela, Cuttack, Sambalpur
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Sun size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Solar PV Capacity</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                  {fmtNumber(stats.total_solar_capacity_kwp / 1000, 1)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>MWp</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              {fmtNumber(stats.total_daily_solar_generation_kwh, 0)} kWh daily clean power
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(0, 200, 150, 0.15)', color: '#00c896' }}>
                <Droplets size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>STP Wastewater Capacity</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00c896' }}>
                  {fmtNumber(stats.total_stp_capacity_kld / 1000, 1)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>MLD</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              {fmtNumber(stats.total_stp_capacity_kld, 0)} KLD recycled effluent
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa' }}>
                <Activity size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Annual Carbon Offset</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#a78bfa' }}>
                  {fmtNumber(stats.annual_co2_offset_tons, 0)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>Tons CO₂</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
              {fmtNumber(stats.total_active_iot_sensors, 0)} active IoT telemetry nodes
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* City / District Filter Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Odisha Campuses' },
              { id: 'bhubaneswar', label: '🏛️ Bhubaneswar' },
              { id: 'khordha', label: '🌲 Khordha (Daleiput / Jatni)' },
              { id: 'rourkela', label: '⚙️ Rourkela' },
              { id: 'cuttack', label: '🏥 Cuttack' },
              { id: 'sambalpur', label: '⚡ Sambalpur / Burla' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedDistrict(f.id)}
                className={`btn ${selectedDistrict === f.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', minWidth: 260 }}>
            <Search size={15} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Search college, city, or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* College Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 20, marginBottom: 28 }}>
        {filteredColleges.map((col) => {
          const aqi = aqiInfo(col.current_live_aqi);
          const specs = col.sustainability_specs;

          return (
            <div
              key={col.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(17, 29, 53, 0.75)'
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 600,
                      display: 'inline-block',
                      marginBottom: 6
                    }}>
                      {col.type}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, lineHeight: 1.3 }}>
                      {col.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                      <MapPin size={12} color="#f59e0b" />
                      <span>{col.city}, {col.district} District · Estd {col.established_year}</span>
                    </div>
                  </div>

                  {/* AQI Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      background: `${aqi.color}22`,
                      border: `1px solid ${aqi.color}55`,
                      color: aqi.color,
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      <div>AQI {col.current_live_aqi}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 500 }}>{aqi.label}</div>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: 2, display: 'block' }}>
                      Open-Meteo Live
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: 16 }}>
                  {col.description}
                </p>

                {/* Key Metrics Chips Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#f59e0b' }}>
                      <Sun size={13} />
                      <span>Solar Microgrid</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {fmtNumber(specs.rooftop_solar_capacity_kwp, 0)} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>kWp</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      ~{fmtNumber(specs.daily_solar_generation_kwh, 0)} kWh/day
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#00c896' }}>
                      <Droplets size={13} />
                      <span>Water Recycling (STP)</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {fmtNumber(specs.stp_capacity_kld, 0)} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>KLD</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {specs.water_recycling_pct}% recycled reuse
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#38bdf8' }}>
                      <Compass size={13} />
                      <span>Campus Area & Density</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {col.campus_area_acres} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>Acres</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {fmtNumber(col.student_faculty_population, 0)} students/staff
                    </div>
                  </div>

                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#a78bfa' }}>
                      <Activity size={13} />
                      <span>IoT Sensors & Zones</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      {col.active_sensors} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>Nodes</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                      {col.zones_count} telemetry zones
                    </div>
                  </div>
                </div>

                {/* Rating badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Award size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {col.green_rating}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button
                  onClick={() => setActiveModalCollege(col)}
                  className="btn btn-outline"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Layers size={13} />
                  Campus Details & Zones
                </button>

                <button
                  onClick={() => handleSyncLive(col)}
                  disabled={syncingId === col.id}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={syncingId === col.id ? 'spin' : ''} />
                  {syncingId === col.id ? 'Syncing…' : 'Sync Live'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campus Details Modal */}
      {activeModalCollege && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#0d1526', border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh',
            overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>{activeModalCollege.type}</span>
                <h3 style={{ fontSize: '1.35rem', color: '#f8fafc', margin: '4px 0' }}>{activeModalCollege.name}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                  {activeModalCollege.address}
                </p>
              </div>
              <button
                onClick={() => setActiveModalCollege(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* GPS Coordinates & Green Badge */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, fontSize: '0.78rem' }}>
              <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', color: '#38bdf8' }}>
                📍 GPS: {activeModalCollege.lat}° N, {activeModalCollege.lon}° E
              </span>
              <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', color: '#00c896' }}>
                🏆 {activeModalCollege.green_rating}
              </span>
              <span style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-border)', color: '#f59e0b' }}>
                🌲 {activeModalCollege.sustainability_specs.annual_co2_offset_tons} Tons CO₂ Offset/yr
              </span>
            </div>

            {/* Campus Zones List */}
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={15} color="#38bdf8" />
                Campus Telemetry Zones ({activeModalCollege.zones_count} Zones)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {activeModalCollege.zones.map((z, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '6px 10px', borderRadius: 6, fontSize: '0.76rem', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.05)' }}>
                    • {z}
                  </div>
                ))}
              </div>
            </div>

            {/* Sustainability Infrastructure Specs */}
            <div style={{ marginBottom: 18 }}>
              <h4 style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} color="#00c896" />
                Green Infrastructure & Telemetry Specifications
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Rainwater Harvesting:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{activeModalCollege.sustainability_specs.rainwater_harvesting_pits} Recharge Wells</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>EV Charging Stations:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{activeModalCollege.sustainability_specs.ev_charging_points} Charging Points</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Air Quality Sensor:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{activeModalCollege.sustainability_specs.ambient_aqi_station}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: 10, borderRadius: 6 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Energy Baseline:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{activeModalCollege.sustainability_specs.energy_star_rating}</div>
                </div>
              </div>
            </div>

            {/* Institutional Contact */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
                Campus Estate & Engineering Office:
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Head: {activeModalCollege.contact.director} · {activeModalCollege.contact.estate_head}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Phone: {activeModalCollege.contact.phone} · Email: {activeModalCollege.contact.email}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setActiveModalCollege(null)}
                className="btn btn-secondary"
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
