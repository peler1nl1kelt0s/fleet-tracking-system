import React, { useState } from 'react';
import { Title, useDataProvider, useNotify } from 'react-admin';
import { Card, CardContent, Button, TextField, Typography, Alert } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const Broadcast = () => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!message) return;

        setSending(true);
        try {
            await dataProvider.sendAnnouncement({ message });
            notify('Announcement sent successfully', { type: 'success' });
            setMessage('');
        } catch (error) {
            notify('Failed to send announcement', { type: 'error' });
        } finally {
            setSending(false);
        }
    };

    return (
        <Card sx={{ mt: 2, maxWidth: 600 }}>
            <Title title="System Broadcast" />
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Send Global Announcement
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    This message will appear instantly in the chat panel of all connected users.
                </Typography>
                
                <form onSubmit={handleSend}>
                    <TextField
                        label="Message"
                        fullWidth
                        multiline
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        variant="outlined"
                        placeholder="e.g. System maintenance in 10 minutes..."
                        sx={{ mb: 2 }}
                    />
                    <Button 
                        variant="contained" 
                        color="primary" 
                        endIcon={<SendIcon />}
                        type="submit"
                        disabled={sending || !message}
                    >
                        {sending ? 'Sending...' : 'Broadcast'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default Broadcast;
