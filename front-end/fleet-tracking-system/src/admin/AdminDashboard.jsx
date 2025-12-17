import React, { useState, useEffect } from 'react';
import { Title, useDataProvider, useNotify } from 'react-admin';
import { Card, CardContent, Typography, Grid, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

const AdminDashboard = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const [stats, setStats] = useState({ activeUsers: 0, trackedAircraft: 0, apiStatus: 'Unknown' });
    const [announcement, setAnnouncement] = useState('');
    const [announcementType, setAnnouncementType] = useState('info');

    useEffect(() => {
        dataProvider.getStats()
            .then(({ data }) => setStats(data))
            .catch(err => console.error(err));
    }, [dataProvider]);

    const handleSendAnnouncement = () => {
        if (!announcement) return;
        dataProvider.sendAnnouncement({ message: announcement, type: announcementType })
            .then(() => {
                notify('Duyuru gönderildi', { type: 'success' });
                setAnnouncement('');
            })
            .catch(() => notify('Hata oluştu', { type: 'error' }));
    };

    return (
        <Grid container spacing={2} sx={{ marginTop: 2 }}>
            <Title title="Admin Dashboard" />
            
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>Aktif Kullanıcılar</Typography>
                        <Typography variant="h3">{stats.activeUsers}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>Takip Edilen Uçak</Typography>
                        <Typography variant="h3">{stats.trackedAircraft}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography color="textSecondary" gutterBottom>API Sağlığı</Typography>
                        <Typography variant="h3" color={stats.apiStatus === 'Healthy' ? 'green' : 'red'}>
                            {stats.apiStatus}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Anlık Duyuru Gönder</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={8}>
                                <TextField 
                                    fullWidth 
                                    label="Mesajınız" 
                                    value={announcement}
                                    onChange={e => setAnnouncement(e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Tip</InputLabel>
                                    <Select 
                                        value={announcementType}
                                        label="Tip"
                                        onChange={e => setAnnouncementType(e.target.value)}
                                    >
                                        <MenuItem value="info">Bilgi</MenuItem>
                                        <MenuItem value="warning">Uyarı</MenuItem>
                                        <MenuItem value="error">Kritik</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={2}>
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    color="secondary" 
                                    onClick={handleSendAnnouncement}
                                    sx={{ height: '56px' }}
                                >
                                    GÖNDER
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default AdminDashboard;
