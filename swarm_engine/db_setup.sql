-- ============================================================
-- LC-EWS Database Setup Script
-- Run this ONCE on your Oracle Cloud PostgreSQL instance
-- ============================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL DEFAULT 'analyst',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Reports table
--    Uses lat/lon floats now; upgrade to PostGIS GEOMETRY later with:
--    ALTER TABLE reports ADD COLUMN location GEOMETRY(Point, 4326);
--    UPDATE reports SET location = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE TABLE IF NOT EXISTS reports (
    id            SERIAL PRIMARY KEY,
    report_id     VARCHAR(20)  UNIQUE NOT NULL,
    user_id       INTEGER      REFERENCES users(id),
    observer_name VARCHAR(255),
    zone          VARCHAR(255),
    risk_level    VARCHAR(50),
    description   TEXT,
    lat           FLOAT,
    lon           FLOAT,
    status        VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- 4. Swarm events snapshot table
CREATE TABLE IF NOT EXISTS swarm_events (
    id          SERIAL PRIMARY KEY,
    swarm_id    VARCHAR(50),
    lat         FLOAT,
    lon         FLOAT,
    area_km2    FLOAT,
    size        FLOAT,
    risk_level  VARCHAR(50),
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_swarm_events_recorded_at ON swarm_events(recorded_at);

-- ============================================================
-- Quick-start: insert a default admin account
-- Password is "admin123" (bcrypt hash — change after first login!)
-- ============================================================
INSERT INTO users (name, email, password_hash, role)
VALUES (
    'System Admin',
    'admin@dpp.gov.pk',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgRmOkCZBM0jJQGBMgzpim',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
