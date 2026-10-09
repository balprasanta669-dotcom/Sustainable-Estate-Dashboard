import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const dashboardApi = {
  getOverview:        (college) => api.get(`/dashboard/overview${college ? `?college=${college}` : ''}`),
  getIotTrends:       (hours = 24, college, city) =>
    api.get(`/dashboard/iot-trends?hours=${hours}${college ? `&college=${college}` : ''}${city ? `&city=${city}` : ''}`),
  injectSynthetic:    (payload) => api.post('/dashboard/synthetic/inject', payload),
  resetSynthetic:     () => api.post('/dashboard/synthetic/reset'),
  getSyntheticStatus: () => api.get('/dashboard/synthetic/status'),
};

export const airQualityApi = {
  getCurrent:   (city) => api.get(`/air-quality/current${city ? `?city=${city}` : ''}`),
  getHistory:   (hours = 168, city) => api.get(`/air-quality/history?hours=${hours}${city ? `&city=${city}` : ''}`),
  getAnomalies: (hours = 168, city) => api.get(`/air-quality/anomalies?hours=${hours}${city ? `&city=${city}` : ''}`),
  getForecast:  (steps = 24, city)  => api.get(`/air-quality/forecast?steps=${steps}${city ? `&city=${city}` : ''}`),
};

export const collegesApi = {
  getOdishaColleges: (district) => api.get(`/colleges/odisha${district ? `?district=${district}` : ''}`),
  getOdishaCollege:  (id) => api.get(`/colleges/odisha/${id}`),
  syncCollege:       (id) => api.post(`/colleges/odisha/${id}/sync`),
  getStats:          () => api.get('/colleges/odisha/stats'),
};

export const wasteApi = {
  getBins:         () => api.get('/waste/bins'),
  getHistory:      (hours = 168) => api.get(`/waste/history?hours=${hours}`),
  getOverflowRisk: () => api.get('/waste/overflow-risk'),
  getForecast:     (steps = 24)  => api.get(`/waste/forecast?steps=${steps}`),
};

export const waterApi = {
  getUsage:    (hours = 168) => api.get(`/water/usage?hours=${hours}`),
  getCurrent:  () => api.get('/water/current'),
  getAlerts:   () => api.get('/water/alerts'),
  getAnomalies:() => api.get('/water/anomalies'),
  getForecast: (steps = 24) => api.get(`/water/forecast?steps=${steps}`),
};

export const energyApi = {
  getConsumption:  (hours = 168) => api.get(`/energy/consumption?hours=${hours}`),
  getCurrent:      () => api.get('/energy/current'),
  getAnomalies:    () => api.get('/energy/anomalies'),
  getForecast:     (steps = 24) => api.get(`/energy/forecast?steps=${steps}`),
  getOptimization: () => api.get('/energy/optimization'),
};

export const trafficApi = {
  getFlow:     (hours = 48) => api.get(`/traffic/flow?hours=${hours}`),
  getParking:  () => api.get('/traffic/parking'),
  getHotspots: () => api.get('/traffic/hotspots'),
};

export const assetsApi = {
  getAll:      () => api.get('/assets/utilization'),
  getCritical: () => api.get('/assets/critical'),
};

export const emissionsApi = {
  getData:     (hours = 168) => api.get(`/emissions/data?hours=${hours}`),
  getHotspots: () => api.get('/emissions/hotspots'),
  getForecast: (steps = 24)  => api.get(`/emissions/forecast?steps=${steps}`),
};

export const safetyApi = {
  getIncidents: (days = 30) => api.get(`/safety/incidents?days=${days}`),
  getSummary:   () => api.get('/safety/summary'),
};

export const sustainabilityApi = {
  getScorecard:    () => api.get('/sustainability/scorecard'),
  getScenarios:    () => api.get('/sustainability/scenarios'),
  runSimulation:   (scenario, baseline_kw = 500) =>
    api.post('/sustainability/simulate', { scenario, baseline_kw }),
};

export const alertsApi = {
  getAll:            () => api.get('/alerts'),
  getRecommendations:() => api.get('/recommendations'),
};

export const mlApi = {
  getMetrics:    () => api.get('/ml/metrics'),
  trainModels:   () => api.post('/ml/train'),
  getDataSources:() => api.get('/ml/data-sources'),
  syncLive:      (city = 'delhi') => api.post(`/ml/sync-live?city=${city}`),
};

export const aiDecisionsApi = {
  getDecisions: () => api.get('/ai/decisions'),
  simulate:     (scenario_prompt) => api.post('/ai/simulate', { scenario_prompt }),
  getKeyStatus: () => api.get('/ai/key-status'),
  setKey:       (api_key) => api.post('/ai/set-key', { api_key }),
};

export const notificationsApi = {
  getContacts:    () => api.get('/notifications/contacts'),
  updateContacts: (data) => api.post('/notifications/contacts', data),
  sendAlertSms:   (data) => api.post('/notifications/send-sms', data),
};
