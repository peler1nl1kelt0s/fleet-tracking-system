import 'dotenv/config';
import app from './app.js';
import './mqtt/broker.js'; 
import './mqtt/mqttClient.js';
import './mqtt/openskyFetcher.js';
import './ws/socket.js';

const PORT = process.env.API_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
