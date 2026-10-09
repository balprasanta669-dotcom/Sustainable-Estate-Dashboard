import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Building2, Sparkles, Key, Check, AlertCircle, Phone, Send, MessageSquare, ChevronDown, GraduationCap, MapPin } from 'lucide-react';
import { aiDecisionsApi, notificationsApi } from '../services/api';

export default function TopBar({ titles = {} }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titles[pathname] || 'Dashboard';

  // Campus Switcher State
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [activeCampusId, setActiveCampusId] = useState(() => localStorage.getItem('active_campus_id') || '');
  const [activeCampusName, setActiveCampusName] = useState(() => localStorage.getItem('active_campus_name') || 'AIIMS Campus, Delhi');

  // Gemini Key Modal States
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keyStatus, setKeyStatus] = useState({ has_key: false, masked_key: null });
  const [savingKey, setSavingKey] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState(null);

  // Phone / Emergency Contacts States
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [contacts, setContacts] = useState({
    primary_admin: { name: 'Facility Director', phone: '+91 98765 43210' },
    electrical_engineer: { name: 'Electrical Engineer', phone: '+91 91234 56789' },
    safety_head: { name: 'Safety Officer', phone: '+91 99887 76655' }
  });
  const [primaryPhoneInput, setPrimaryPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneStatusMsg, setPhoneStatusMsg] = useState(null);
  const [smsSending, setSmsSending] = useState(false);

  const fetchKeyStatus = async () => {
    try {
      const res = await aiDecisionsApi.getKeyStatus();
      setKeyStatus(res.data);
    } catch (e) {
      console.error('Failed to get Gemini key status', e);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await notificationsApi.getContacts();
      if (res.data?.contacts) {
        setContacts(res.data.contacts);
        setPrimaryPhoneInput(res.data.contacts.primary_admin?.phone || '');
      }
    } catch (e) {
      console.error('Failed to get emergency contacts', e);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
    fetchContacts();
  }, []);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    setKeyStatusMsg(null);
    try {
      const res = await aiDecisionsApi.setKey(apiKeyInput.trim());
      if (res.data?.success) {
        setKeyStatusMsg({ type: 'success', text: 'Gemini API Key verified and active!' });
        fetchKeyStatus();
        setTimeout(() => setShowKeyModal(false), 1500);
      } else {
        setKeyStatusMsg({ type: 'error', text: res.data?.error || 'Verification failed.' });
      }
    } catch (e) {
      setKeyStatusMsg({ type: 'error', text: e.response?.data?.error || e.message });
    } finally {
      setSavingKey(false);
    }
  };

  const handleSavePhone = async () => {
    if (!primaryPhoneInput.trim()) return;
    setSavingPhone(true);
    setPhoneStatusMsg(null);
    try {
      const res = await notificationsApi.updateContacts({ primary_phone: primaryPhoneInput.trim() });
      if (res.data?.success) {
        setContacts(res.data.contacts);
        setPhoneStatusMsg({ type: 'success', text: 'Alert phone number updated successfully!' });
      }
    } catch (e) {
      setPhoneStatusMsg({ type: 'error', text: e.response?.data?.error || e.message });
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSendTestSms = async () => {
    setSmsSending(true);
    setPhoneStatusMsg(null);
    try {
      const res = await notificationsApi.sendAlertSms({
        phone: primaryPhoneInput.trim() || contacts.primary_admin?.phone,
        incident_type: 'AI Telemetry Test Dispatch',
        message: `[FacilityIQ ALERT] Test notification successfully delivered to ${primaryPhoneInput.trim() || contacts.primary_admin?.phone}. System active.`
      });
      if (res.data?.success) {
        setPhoneStatusMsg({ type: 'success', text: `✓ Alert SMS successfully dispatched to ${primaryPhoneInput}!` });
      }
    } catch (e) {
      setPhoneStatusMsg({ type: 'error', text: e.response?.data?.error || e.message });
    } finally {
      setSmsSending(false);
    }
  };

  const cleanDigits = (contacts.primary_admin?.phone || '').replace(/\D/g, '');

  return (
    <>
      <header className="topbar">
        <div className="topbar-title">{title}</div>
        <div className="topbar-actions">
          {/* Emergency Phone Number Chip */}
          <button
            onClick={() => setShowPhoneModal(true)}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.74rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Configure Alert Phone Number & SOS Dispatch"
          >
            <Phone size={12} />
            <span>Alert SMS: {contacts.primary_admin?.phone || '+91 98765 43210'}</span>
          </button>

          {/* Gemini AI Status Badge */}
          <button
            onClick={() => setShowKeyModal(true)}
            style={{
              background: keyStatus.has_key ? 'rgba(56, 189, 248, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              color: keyStatus.has_key ? '#38bdf8' : '#eab308',
              border: `1px solid ${keyStatus.has_key ? 'rgba(56, 189, 248, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.74rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Configure Google Gemini API Key"
          >
            <Sparkles size={13} className={keyStatus.has_key ? '' : 'spin'} />
            {keyStatus.has_key ? `Gemini 1.5 Flash (${keyStatus.masked_key})` : 'Connect Gemini API Key'}
          </button>

          <span style={{
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#4ade80',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: '0.72rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            CPCB & Campus Real IoT Data
          </span>
          <span
            className="facility-chip"
            onClick={() => setShowCampusModal(true)}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Click to switch active institutional campus"
          >
            <Building2 size={12} />
            {activeCampusName}
            <ChevronDown size={11} color="var(--color-primary)" />
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={12} />
            30s Sync
          </div>
          <span className="live-dot" title="Live data" />
        </div>
      </header>

      {/* Phone Number & SMS Alert Manager Modal */}
      {showPhoneModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 16, padding: '28px 32px', maxWidth: 480, width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: 8, borderRadius: 10 }}>
                <Phone size={20} color="#f87171" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
                Emergency Alert Phone Number & SOS
              </h3>
            </div>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 18px' }}>
              Configure administrator mobile numbers to receive automated SMS alerts for critical facility incidents (Transformer fires, Water TDS contamination, Severe AQI &gt; 400).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Primary Administrator / Control Room Mobile:
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={primaryPhoneInput}
                  onChange={(e) => setPrimaryPhoneInput(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    flex: 1,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--color-border)',
                    color: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSavePhone}
                  disabled={savingPhone || !primaryPhoneInput.trim()}
                  style={{ padding: '0 16px', fontSize: '0.82rem' }}
                >
                  {savingPhone ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Quick Speed-Dial Actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <a
                href={`tel:${cleanDigits}`}
                className="btn btn-outline"
                style={{
                  flex: 1, textDecoration: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: '0.8rem', padding: '8px 12px'
                }}
              >
                <Phone size={13} color="#22c55e" />
                Direct Call Control Room
              </a>
              <a
                href={`https://wa.me/${cleanDigits}?text=FacilityIQ%20Emergency%20Alert%20Notification`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{
                  flex: 1, textDecoration: 'none', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: '0.8rem', padding: '8px 12px'
                }}
              >
                <MessageSquare size={13} color="#38bdf8" />
                WhatsApp Dispatch
              </a>
            </div>

            {/* Test SMS Dispatch Button */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>Test SMS Gateway</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Send a live test incident alert to your number</div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleSendTestSms}
                disabled={smsSending}
                style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Send size={12} className={smsSending ? 'spin' : ''} />
                {smsSending ? 'Sending…' : 'Send Test SMS'}
              </button>
            </div>

            {phoneStatusMsg && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: 8,
                background: phoneStatusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: phoneStatusMsg.type === 'success' ? '#4ade80' : '#f87171'
              }}>
                {phoneStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {phoneStatusMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowPhoneModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini Key Config Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 16, padding: '28px 32px', maxWidth: 480, width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: 8, borderRadius: 10 }}>
                <Key size={20} color="#38bdf8" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>
                Google Gemini API Key
              </h3>
            </div>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 18px' }}>
              Power all facility recommendations, multi-sensor decision making, and what-if simulations directly with <strong>Gemini 1.5 Flash</strong>. No hardcoded if/else rules.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                Paste your Gemini API Key:
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--color-border)',
                  color: '#f8fafc',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                Get a free key from Google AI Studio at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#38bdf8' }}>aistudio.google.com</a>.
              </div>
            </div>

            {keyStatusMsg && (
              <div style={{
                padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: '0.8rem',
                display: 'flex', alignItems: 'center', gap: 8,
                background: keyStatusMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: keyStatusMsg.type === 'success' ? '#4ade80' : '#f87171'
              }}>
                {keyStatusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                {keyStatusMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowKeyModal(false)}
                disabled={savingKey}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveKey}
                disabled={savingKey || !apiKeyInput.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {savingKey ? 'Verifying with Google…' : 'Save & Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Institutional Campus Switcher Modal */}
      {showCampusModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#0d1526', border: '1px solid rgba(0, 212, 255, 0.3)',
            borderRadius: 14, width: '100%', maxWidth: 660, maxHeight: '88vh',
            overflowY: 'auto', padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={20} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem', color: '#f8fafc', margin: 0 }}>
                  Institutional Campus Switcher
                </h3>
              </div>
              <button
                onClick={() => setShowCampusModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 16 }}>
              Select any premier Odisha or National higher education campus to instantly switch active IoT telemetry, microgrid solar, and air quality models.
            </p>

            {/* Campuses List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {[
                { id: '', name: 'AIIMS Campus, Delhi', location: 'New Delhi · National Baseline', specs: '250,000 m² · 432 Sensors' },
                { id: 'iit_bbs', name: 'IIT Bhubaneswar', location: 'Argul, Jatni, Khordha, Odisha', specs: '936 Acres · 1.5 MWp Solar · 580 Sensors' },
                { id: 'aiims_bbs', name: 'AIIMS Bhubaneswar', location: 'Sijua, Patrapada, Bhubaneswar, Odisha', specs: '100 Acres · 1.0 MWp Solar · 720 Sensors' },
                { id: 'nit_rourkela', name: 'NIT Rourkela', location: 'Sector 1, Rourkela, Sundargarh, Odisha', specs: '647 Acres · 1.8 MWp Solar · 640 Sensors' },
                { id: 'outr_bbs', name: 'OUTR Bhubaneswar (formerly CET)', location: 'Ghatikia, Bhubaneswar, Odisha', specs: '106 Acres · 500 kWp Solar · 340 Sensors' },
                { id: 'vssut_burla', name: 'VSSUT Burla', location: 'Burla, Sambalpur, Odisha', specs: '300 Acres · 400 kWp Solar · 310 Sensors' },
                { id: 'kiit_bbs', name: 'KIIT University & KIMS', location: 'Patia, Bhubaneswar, Odisha', specs: '400 Acres · 3.2 MWp Solar · 950 Sensors' },
                { id: 'scb_cuttack', name: 'SCB Medical College & Hospital', location: 'Mangalabag, Cuttack, Odisha', specs: '100 Acres · 850 kWp Solar · 520 Sensors' },
                { id: 'ravenshaw_cuttack', name: 'Ravenshaw University', location: 'College Square, Cuttack, Odisha', specs: '87 Acres · 350 kWp Solar · 220 Sensors' },
                { id: 'kmbb_khordha', name: 'KMBB College of Engineering & Technology', location: 'Daleiput, Khordha, Odisha', specs: '40 Acres · 250 kWp Solar · 180 Sensors' },
              ].map((camp) => {
                const isSelected = (activeCampusId === camp.id) || (!activeCampusId && !camp.id);
                return (
                  <div
                    key={camp.id}
                    onClick={() => {
                      setActiveCampusId(camp.id);
                      setActiveCampusName(camp.name);
                      localStorage.setItem('active_campus_id', camp.id);
                      localStorage.setItem('active_campus_name', camp.name);
                      window.dispatchEvent(new Event('facility_changed'));
                      setShowCampusModal(false);
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 212, 255, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: isSelected ? '#38bdf8' : '#f8fafc', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {camp.name}
                        {isSelected && <Check size={14} color="#38bdf8" />}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        {camp.location}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#94a3b8' }}>
                      {camp.specs}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowCampusModal(false);
                  navigate('/odisha-colleges');
                }}
                style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <GraduationCap size={14} color="#38bdf8" />
                Open Odisha Campuses Intelligence Page
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowCampusModal(false)}
                style={{ fontSize: '0.78rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
