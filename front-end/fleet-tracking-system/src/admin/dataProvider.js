import { fetchUtils } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const fetchJson = (url, options = {}) => {
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  // If we need auth token
  // options.headers.set('Authorization', 'Bearer ...');
  return fetchUtils.fetchJson(url, options);
};

const dataProvider = simpleRestProvider('http://localhost:3000/api/admin', fetchJson);

const customDataProvider = {
  ...dataProvider,
  // Custom method for system-config singleton
  getSystemConfig: () => {
    return fetchJson('http://localhost:3000/api/admin/system-config').then(({ json }) => ({
      data: { id: 'system', ...json } // React Admin needs an ID
    }));
  },
  updateSystemConfig: (data) => {
    return fetchJson('http://localhost:3000/api/admin/system-config', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(({ json }) => ({ data: { id: 'system', ...json } }));
  },
  sendAnnouncement: (data) => {
    return fetchJson('http://localhost:3000/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(({ json }) => ({ data: json }));
  },
  getStats: () => {
     return fetchJson('http://localhost:3000/api/admin/stats').then(({ json }) => ({ data: json }));
  }
};

export default customDataProvider;
