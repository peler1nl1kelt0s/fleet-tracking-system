import redis from '../redis/redisClient.js';
import { query } from '../db/index.js';

const BATCH_SIZE = 50;
const PROCESS_INTERVAL = 1000; // 1 second

async function processQueue(key) {
    const aircraftId = key.split(':')[1];
    let processed = 0;

    // Process a batch
    while (processed < BATCH_SIZE) {
        // Pop from right (FIFO) or Left?
        // In mqttClient we used: redis.lpush (Left Push)
        // So we should use rpop (Right Pop) to process oldest first.
        const item = await redis.rpop(key);

        if (!item) break;

        try {
            const data = JSON.parse(item);
            await saveTelemetry(aircraftId, data);
            processed++;
        } catch (err) {
            console.error(`Error processing telemetry for ${aircraftId}:`, err);
            // Optional: push back to dead letter queue
        }
    }
}

async function saveTelemetry(aircraftId, data) {
    const client = await import('../db/index.js').then(m => m.getClient());

    try {
        await client.query('BEGIN');

        // 1. Ensure Vehicle Exists (Upsert)
        // In a real high-throughput scenario, we might cache this check.
        const vehicleRes = await client.query(
            `INSERT INTO vehicles (plate_number, vehicle_type, status)
       VALUES ($1, 'aircraft', 'active')
       ON CONFLICT (plate_number) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
            [aircraftId]
        );

        const vehicleId = vehicleRes.rows[0].id;

        // 2. Insert Telemetry
        await client.query(
            `INSERT INTO telemetry (
         time, vehicle_id, latitude, longitude, speed, altitude, heading, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                new Date(data.timestamp),
                vehicleId,
                data.lat,
                data.lng,
                data.speed,
                data.altitude,
                data.true_track,
                {
                    items: data
                }
            ]
        );

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

export async function startWorker() {
    console.log('👷 Telemetry Worker Started');

    setInterval(async () => {
        try {
            // Scan for all telemetry queues
            const keys = await redis.keys('telemetry:*');

            for (const key of keys) {
                await processQueue(key);
            }
        } catch (err) {
            console.error('Worker Loop Error:', err);
        }
    }, PROCESS_INTERVAL);
}
