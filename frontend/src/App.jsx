import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import Sidebar from './components/Sidebar';
import TopBar  from './components/TopBar';

import OverviewPage       from './pages/OverviewPage';
import AirQualityPage     from './pages/AirQualityPage';
import WastePage          from './pages/WastePage';
import WaterPage          from './pages/WaterPage';
import EnergyPage         from './pages/EnergyPage';
import TrafficPage        from './pages/TrafficPage';
import AssetsPage         from './pages/AssetsPage';
import EmissionsPage      from './pages/EmissionsPage';
import SafetyPage         from './pages/SafetyPage';
import SustainabilityPage from './pages/SustainabilityPage';
import AlertsPage         from './pages/AlertsPage';
import MLTrainingPage     from './pages/MLTrainingPage';
import OdishaCollegesPage from './pages/OdishaCollegesPage';

const PAGE_TITLES = {
  '/':                 'Overview Dashboard',
  '/odisha-colleges':  'Odisha Campuses & Colleges Intelligence',
  '/air-quality':      'Air Quality Monitor',
  '/waste':            'Waste Management',
  '/water':            'Water Usage',
  '/energy':           'Energy Consumption',
  '/traffic':          'Traffic & Parking',
  '/assets':           'Asset Utilization',
  '/emissions':        'Emissions Tracker',
  '/safety':           'Safety Incidents',
  '/sustainability':   'Sustainability Scorecard',
  '/alerts':           'Alerts & Recommendations',
  '/ml-training':      'AI/ML Model Training & Telemetry',
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">
          <TopBar titles={PAGE_TITLES} />
          <Routes>
            <Route path="/"               element={<OverviewPage />} />
            <Route path="/odisha-colleges" element={<OdishaCollegesPage />} />
            <Route path="/air-quality"    element={<AirQualityPage />} />
            <Route path="/waste"          element={<WastePage />} />
            <Route path="/water"          element={<WaterPage />} />
            <Route path="/energy"         element={<EnergyPage />} />
            <Route path="/traffic"        element={<TrafficPage />} />
            <Route path="/assets"         element={<AssetsPage />} />
            <Route path="/emissions"      element={<EmissionsPage />} />
            <Route path="/safety"         element={<SafetyPage />} />
            <Route path="/sustainability" element={<SustainabilityPage />} />
            <Route path="/alerts"         element={<AlertsPage />} />
            <Route path="/ml-training"    element={<MLTrainingPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
