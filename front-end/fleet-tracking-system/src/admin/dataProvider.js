import { fetchUtils } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const fetchJson = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  return fetchUtils.fetchJson(url, options);
};

const baseDataProvider = simpleRestProvider('http://localhost:3000/api/admin', fetchJson);

// --- Mock Data Store ---
const mockStore = {
  'chat-scenarios': [
    { id: 1, name: 'Emergency Landing', triggers: ['engine_failure'], script: 'Pilot: Mayday...' },
    { id: 2, name: 'Routine Check', triggers: ['interval_1h'], script: 'Tower: Status check...' },
    { id: 3, name: 'Turbulence', triggers: ['weather_bad'], script: 'Pilot: Requesting altitude change...' },
  ],
  'squawk-codes': [
    { id: '7500', code: '7500', description: 'Unlawful Interference (Hijacking)', severity: 'critical', message: 'HIJACKING REPORTED', color: '#ff0000' },
    { id: '7600', code: '7600', description: 'Radio Failure', severity: 'warning', message: 'RADIO FAILURE', color: '#ffa500' },
    { id: '7700', code: '7700', description: 'General Emergency', severity: 'critical', message: 'EMERGENCY DECLARED', color: '#ff0000' }
  ],
  'system-config': {
    id: 'system',
    apiRefreshRate: 5000,
    bounds: { lamin: 34.0, lamax: 42.0, lomin: 26.0, lomax: 45.0 }
  },
  'stats': {
    activePlanes: 24,
    totalFlights: 156,
    avgDelay: 12,
    alertsToday: 3
  }
};

// --- Helper for Mock Logic ---
const withMockFallback = async (operationName, executionFn, mockFn) => {
  const useMock = localStorage.getItem('useMockData') === 'true';
  
  if (useMock) {
    console.log(`[MockProvider] Forcing mock for ${operationName}`);
    return mockFn();
  }

  try {
    return await executionFn();
  } catch (error) {
    console.warn(`[MockProvider] API failed for ${operationName}, falling back to mock.`, error);
    return mockFn();
  }
};

const customDataProvider = {
  ...baseDataProvider,

  // --- Standard Methods Wrappers ---
  getList: (resource, params) => {
    return withMockFallback(
      `getList ${resource}`,
      () => baseDataProvider.getList(resource, params),
      () => {
        if (mockStore[resource]) {
          // Simple pagination/sort simulation could be added here if needed
          return Promise.resolve({ 
            data: mockStore[resource], 
            total: mockStore[resource].length 
          });
        }
        return Promise.reject(new Error(`No mock data for resource ${resource}`));
      }
    );
  },
  
  getOne: (resource, params) => {
     return withMockFallback(
      `getOne ${resource}`,
      () => baseDataProvider.getOne(resource, params),
      () => {
        const item = mockStore[resource]?.find(i => i.id == params.id);
        return item ? Promise.resolve({ data: item }) : Promise.reject(new Error('Not found'));
      }
     );
  },

  update: (resource, params) => {
    return withMockFallback(
      `update ${resource}`,
      () => baseDataProvider.update(resource, params),
      () => {
        const index = mockStore[resource]?.findIndex(i => i.id == params.id);
        if (index > -1) {
          mockStore[resource][index] = { ...mockStore[resource][index], ...params.data };
          return Promise.resolve({ data: mockStore[resource][index] });
        }
        return Promise.resolve({ data: params.data }); // Optimistic return
      }
    );
  },

  create: (resource, params) => {
     return withMockFallback(
      `create ${resource}`,
      () => baseDataProvider.create(resource, params),
      () => {
        const newItem = { id: params.data.id || Math.random(), ...params.data };
        if(mockStore[resource]) mockStore[resource].push(newItem);
        return Promise.resolve({ data: newItem });
      }
     );
  },

  delete: (resource, params) => {
    return withMockFallback(
      `delete ${resource}`,
      () => baseDataProvider.delete(resource, params),
      () => {
        if(mockStore[resource]) {
           mockStore[resource] = mockStore[resource].filter(i => i.id != params.id);
        }
        return Promise.resolve({ data: { id: params.id } });
      }
    );
  },

  // --- Custom Methods ---
  getSystemConfig: () => {
    return withMockFallback(
      'getSystemConfig',
      () => fetchJson('http://localhost:3000/api/admin/system-config').then(({ json }) => ({
        data: { id: 'system', ...json }
      })),
      () => Promise.resolve({ data: mockStore['system-config'] })
    );
  },

  updateSystemConfig: (data) => {
    return withMockFallback(
      'updateSystemConfig',
      () => fetchJson('http://localhost:3000/api/admin/system-config', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(({ json }) => ({ data: { id: 'system', ...json } })),
      () => {
        mockStore['system-config'] = { ...mockStore['system-config'], ...data };
        return Promise.resolve({ data: mockStore['system-config'] });
      }
    );
  },

  sendAnnouncement: (data) => {
    return withMockFallback(
      'sendAnnouncement',
      () => fetchJson('http://localhost:3000/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(({ json }) => ({ data: json })),
      () => Promise.resolve({ data: { status: 'mock_sent', ...data } })
    );
  },

  getStats: () => {
     return withMockFallback(
       'getStats',
       () => fetchJson('http://localhost:3000/api/admin/stats').then(({ json }) => ({ data: json })),
       () => Promise.resolve({ data: mockStore['stats'] })
     );
  }
};

export default customDataProvider;
