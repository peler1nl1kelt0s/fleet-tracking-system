-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS ve TimescaleDB kaldırıldı

-- 1. Identity & Access Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'manager', 'viewer')) DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assets (Vehicles)
CREATE TABLE vehicle_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    icao24 VARCHAR(24) UNIQUE,
    vehicle_type VARCHAR(50),
    group_id UUID REFERENCES vehicle_groups(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, maintenance, inactive
    calibration_factor DOUBLE PRECISION DEFAULT 1.0, -- For sensor calibration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Telemetry (Time-series data)
-- High frequency data: 1Hz
CREATE TABLE telemetry (
    time TIMESTAMPTZ NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION,
    heading DOUBLE PRECISION,
    altitude DOUBLE PRECISION,
    temperature DOUBLE PRECISION,
    engine_status VARCHAR(20), -- on, off, idle
    fuel_level DOUBLE PRECISION,
    on_ground BOOLEAN DEFAULT TRUE,
    metadata JSONB -- For extra sensors
);

-- Hypertable iptal edildi (Standart tablo olarak çalışacak)

-- 4. Geospatial (Geofences)
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    -- geometry GEOMETRY(POLYGON, 4326) NOT NULL, -- PostGIS iptal
    geometry_data JSONB, -- Basit saklama için JSONB
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index iptal
-- CREATE INDEX idx_geofences_geometry ON geofences USING GIST (geometry);

-- 5. Alerting Engine
CREATE TABLE alert_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'speed', 'geofence', 'temperature', 'custom'
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    condition_config JSONB NOT NULL, -- Stores thresholds logic e.g., {"min": 0, "max": 100}
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_history (
    time TIMESTAMPTZ NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_definition_id UUID REFERENCES alert_definitions(id),
    message TEXT,
    value DOUBLE PRECISION, -- The value that triggered it
    -- location GEOMETRY(POINT, 4326), -- PostGIS iptal
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMPTZ
);

-- Hypertable iptal edildi

-- 6. Pulse Chat (Sohbet)
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100),
    type VARCHAR(20) DEFAULT 'group', -- 'direct', 'group', 'vehicle' 
    related_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some initial data
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@fleet.com', 'hashed_secret', 'admin');

INSERT INTO alert_definitions (name, type, severity, condition_config) VALUES
('High Speed', 'speed', 'high', '{"limit": 120}'),
('High Temperature', 'temperature', 'critical', '{"limit": 90}'),
('Geofence Exit', 'geofence', 'medium', '{"mode": "exit"}');