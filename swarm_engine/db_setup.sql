-- ============================================================
-- LC-EWS Database Setup Script
-- Run automatically by Docker on first start via docker-entrypoint-initdb.d
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
CREATE TABLE IF NOT EXISTS reports (
    id              SERIAL PRIMARY KEY,
    report_id       VARCHAR(20)  UNIQUE NOT NULL,
    user_id         INTEGER      REFERENCES users(id),
    observer_name   VARCHAR(255),
    zone            VARCHAR(255),
    risk_level      VARCHAR(50),
    estimated_size  VARCHAR(50),
    description     TEXT,
    lat             FLOAT,
    lon             FLOAT,
    status          VARCHAR(50)  NOT NULL DEFAULT 'Pending',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
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

-- NOTE: No hardcoded admin user.
-- Register your first admin account via:  POST /auth/register
-- with role: "admin"

-- 5. Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id          SERIAL PRIMARY KEY,
    type        VARCHAR(50)  NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
