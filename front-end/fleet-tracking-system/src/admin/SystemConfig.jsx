import React, { useEffect, useState } from 'react';
import { Title, useDataProvider, useNotify } from 'react-admin';
import { Card, CardContent, Button, TextField, Grid, Typography, Divider, Switch, FormControlLabel } from '@mui/material';

const SystemConfig = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(localStorage.getItem('useMockData') === 'true');

  useEffect(() => {
    dataProvider.getSystemConfig()
      .then(({ data }) => {
        setConfig(data);
        setLoading(false);
      })
      .catch(error => {
        notify('Config yüklenemedi', { type: 'error' });
        setLoading(false);
      });
  }, [dataProvider, notify]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dataProvider.updateSystemConfig(config)
      .then(() => notify('Ayarlar kaydedildi', { type: 'success' }))
      .catch(() => notify('Kaydetme başarısız', { type: 'error' }));
  };

  const handleMockChange = (event) => {
    const isChecked = event.target.checked;
    setUseMock(isChecked);
    localStorage.setItem('useMockData', isChecked);
    window.location.reload(); 
  };

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  const handleBoundsChange = (key, value) => {
    setConfig(prev => ({ 
      ...prev, 
      bounds: { ...prev.bounds, [key]: parseFloat(value) } 
    }));
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <Card>
      <Title title="Sistem Yapılandırması" />
      <CardContent>
        <FormControlLabel
          control={<Switch checked={useMock} onChange={handleMockChange} />}
          label="Mock Data Kullan (API Bağlantısı Kesikse Otomatik Devreye Girer)"
          sx={{ mb: 2 }}
        />
        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>API Ayarları</Typography>
          <Grid container spacing={3}>
             <Grid item xs={12} sm={6}>
               <TextField 
                 label="API Refresh Rate (ms)" 
                 type="number"
                 fullWidth 
                 value={config.apiRefreshRate}
                 onChange={(e) => handleChange('apiRefreshRate', parseInt(e.target.value))}
               />
             </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>Harita Sınırları (Bounding Box)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
               <TextField 
                 label="Min Lat" 
                 type="number" 
                 fullWidth
                 value={config.bounds?.lamin || ''}
                 onChange={(e) => handleBoundsChange('lamin', e.target.value)}
               />
            </Grid>
            <Grid item xs={6} sm={3}>
               <TextField 
                 label="Max Lat" 
                 type="number" 
                 fullWidth
                 value={config.bounds?.lamax || ''}
                 onChange={(e) => handleBoundsChange('lamax', e.target.value)}
               />
            </Grid>
             <Grid item xs={6} sm={3}>
               <TextField 
                 label="Min Lon" 
                 type="number" 
                 fullWidth
                 value={config.bounds?.lomin || ''}
                 onChange={(e) => handleBoundsChange('lomin', e.target.value)}
               />
            </Grid>
            <Grid item xs={6} sm={3}>
               <TextField 
                 label="Max Lon" 
                 type="number" 
                 fullWidth
                 value={config.bounds?.lomax || ''}
                 onChange={(e) => handleBoundsChange('lomax', e.target.value)}
               />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Button variant="contained" color="primary" type="submit">
            Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SystemConfig;
