import { useState, useCallback } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Leaf } from 'lucide-react';
import { sustainabilityApi, aiDecisionsApi } from '../services/api';
import { usePolling, useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import { fmtNumber } from '../utils/helpers';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SustainabilityPage() {
  const scoreFn     = useCallback(() => sustainabilityApi.getScorecard(),  []);
  const scenariosFn = useCallback(() => sustainabilityApi.getScenarios(),  []);

  const { data: scorecard,  loading } = usePolling(scoreFn,     60000);
  const { data: scenarios }           = useAsync(scenariosFn);

  const [customScenario, setCustomScenario]     = useState('Add 150 kWp rooftop solar and shift HVAC cooling to night thermal storage');
  const [simResult, setSimResult]               = useState(null);
  const [simLoading, setSimLoading]             = useState(false);

  const runSim = async (overridePrompt) => {
    const prompt = overridePrompt || customScenario;
    if (!prompt) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await aiDecisionsApi.simulate(prompt);
      setSimResult(res.data?.simulation);
    } catch (e) {
      setSimResult({ error: 'Simulation failed: ' + e.message });
    } finally {
      setSimLoading(false);
    }
  };

  if (loading || !scorecard) return <div className="page"><Spinner /></div>;

  const { overall_score, grade, modules, trend, benchmark_percentile } = scorecard;

  const radarData = Object.entries(modules).map(([k, v]) => ({
    subject: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    A: v,
  }));

  const gradeColor = (g) => {
    if (g === 'A') return '#00c896';
    if (g?.startsWith('B')) return '#60a5fa';
    if (g?.startsWith('C')) return '#f59e0b';
    return '#ef4444';
  };

  const trendIcon = trend === 'Improving' ? '📈' : trend === 'Declining' ? '📉' : '➡️';

  return (
    <div className="page fade-in-up">
      {/* Score Hero */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,200,150,0.07) 0%, rgba(0,212,255,0.05) 100%)', border: '1px solid rgba(0,200,150,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: gradeColor(grade), lineHeight: 1 }}>{grade}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Sustainability Grade</div>
          </div>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
              {fmtNumber(overall_score, 0)}<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
              {trendIcon} {trend} · Better than {benchmark_percentile}% of comparable facilities
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {Object.entries(modules).map(([k, v]) => (
              <div key={k} style={{ fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}: </span>
                <span style={{ fontWeight: 600, color: v >= 70 ? '#00c896' : v >= 50 ? '#f59e0b' : '#ef4444' }}>{fmtNumber(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Radar Chart */}
        <div className="card">
          <div className="card-title">🎯 Module Sustainability Scores</div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8b99b5', fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#4a5568', fontSize: 9 }} />
              <Radar dataKey="A" stroke="#00c896" fill="#00c896" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Module Scores Bars */}
        <div className="card">
          <div className="card-title">📊 Individual Module Scores</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {Object.entries(modules).map(([k, v]) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 5 }}>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                  </span>
                  <span style={{ fontWeight: 700, color: v >= 70 ? '#00c896' : v >= 50 ? '#f59e0b' : '#ef4444' }}>{fmtNumber(v)}/100</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{
                    width: `${v}%`,
                    background: v >= 70 ? '#00c896' : v >= 50 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Scenario Simulator */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="#38bdf8" />
            Gemini Generative Scenario Simulator — What-If Engineering
          </div>
          <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '3px 8px', borderRadius: 12, fontWeight: 600 }}>
            Powered by Google Gemini
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Hypothesize any operational intervention in natural language. Gemini models physical thermodynamic savings, Indian commercial tariffs, Capex, and payback.
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            "Add 150 kWp rooftop solar and shift HVAC cooling to night thermal storage",
            "Recycle 80% greywater through campus STP and install smart sensor aerators",
            "Optimize peak summer HVAC setpoint from 22°C to 24.5°C across admin wards",
            "Convert campus fleet to 25 EV shuttle vans with on-site charging"
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => { setCustomScenario(preset); runSim(preset); }}
              className="btn btn-outline"
              style={{ fontSize: '0.72rem', padding: '4px 10px', background: 'rgba(15, 23, 42, 0.4)' }}
            >
              ✦ {preset.slice(0, 38)}…
            </button>
          ))}
        </div>

        {/* Input prompt */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
          <input
            type="text"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="Type your hypothesis (e.g. Install 200kW solar, replace DG with battery bank)..."
            style={{
              flex: 1,
              background: 'var(--color-bg-base)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 16px',
              fontSize: '0.88rem',
              outline: 'none'
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') runSim(); }}
          />
          <button
            className="btn btn-primary"
            onClick={() => runSim()}
            disabled={!customScenario || simLoading}
            style={{ padding: '10px 20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {simLoading ? <span className="spin">⚡</span> : <Sparkles size={15} />}
            {simLoading ? 'Simulating with Gemini…' : 'Simulate Hypothesis'}
          </button>
        </div>

        {simResult && !simResult.error && (
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1.05rem' }}>
                  📋 {simResult.scenario_name || customScenario}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: 2 }}>
                  Engine: {simResult.engine}
                </div>
              </div>
              <span className={`alert-badge ${simResult.feasibility_score === 'High' ? 'badge-ok' : 'badge-medium'}`} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                Feasibility: {simResult.feasibility_score || 'High'}
              </span>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: 16 }}>
              {simResult.ai_analysis}
            </p>

            {/* Metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
              {simResult.energy_saving_kwh_day !== undefined && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Daily Energy Saved</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f59e0b' }}>
                    {fmtNumber(simResult.energy_saving_kwh_day, 1)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kWh/day</span>
                  </div>
                </div>
              )}
              {simResult.cost_saving_inr_month !== undefined && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Projected Monthly Savings</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>
                    ₹{fmtNumber(simResult.cost_saving_inr_month, 0)}
                  </div>
                </div>
              )}
              {simResult.co2_reduction_kg_year !== undefined && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Annual Carbon Offset</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>
                    {fmtNumber(simResult.co2_reduction_kg_year, 0)} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>kg CO₂</span>
                  </div>
                </div>
              )}
              {simResult.estimated_capex_inr !== undefined && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Estimated CapEx</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#e2e8f0' }}>
                    ₹{fmtNumber(simResult.estimated_capex_inr / 100000, 1)}L
                  </div>
                </div>
              )}
              {simResult.payback_period_months !== undefined && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Payback Period</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>
                    {simResult.payback_period_months} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>months</span>
                  </div>
                </div>
              )}
            </div>

            {/* Implementation Steps */}
            {simResult.implementation_steps && simResult.implementation_steps.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8', marginBottom: 6 }}>
                  AI Engineering Implementation Roadmap:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {simResult.implementation_steps.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {idx + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {simResult.risks_and_mitigations && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                <strong style={{ color: '#f59e0b' }}>Operational Risk Analysis: </strong>
                {simResult.risks_and_mitigations}
              </div>
            )}
          </div>
        )}

        {simResult?.error && (
          <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem', padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
            {simResult.error}
          </div>
        )}
      </div>
    </div>
  );
}
