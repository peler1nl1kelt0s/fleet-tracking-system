import aedes from 'aedes';
import net from 'net';

const broker = aedes();
const server = net.createServer(broker.handle);

const PORT = 1883;

server.listen(PORT, () => {
  console.log(`MQTT Broker running on port ${PORT}`);
});
