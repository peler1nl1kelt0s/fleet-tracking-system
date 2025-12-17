let alertConfig = {
  geofence: {
    'turkey-airspace': {
      name: 'Türkiye Hava Sahası',
      enabled: true,
      lamin: 35.5,
      lomin: 25.0,
      lamax: 42.5,
      lomax: 45.0
    }

  },
  speed_threshold: {
    enabled: true,
    max_speed_kmh: 850
  },
  altitude_threshold: {
    enabled: true,
    min_altitude_ft: 3000
  }
};

/**
 * Mevcut uyarı yapılandırmasını döndürür.
 * @returns {object} Yapılandırma nesnesi.
 */
export const getConfig = () => {
  return alertConfig;
};

/**
 * @param {object} newConfig Yeni yapılandırma nesnesi.
 * @returns {object} Güncellenmiş yapılandırma nesnesi.
 */
export const updateConfig = (newConfig) => {
  alertConfig = { ...alertConfig, ...newConfig };
  console.log('[Config] Uyarı yapılandırması güncellendi:', alertConfig);
  return alertConfig;
};
