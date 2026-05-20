# PestiScope: AI-Powered Locust Early Warning and Control System

PestiScope is a high-fidelity web platform designed to monitor, predict, and coordinate mitigation efforts against locust swarms across Pakistan. The system integrates real-time drone operations, GIS-based mapping, predictive AI models, and role-based incident reporting to provide an end-to-end command-and-control dashboard.

---
## Architecture Overview

PestiScope is orchestrated using a multi-container Docker structure to handle production workloads with automatic HTTPS encryption, reverse-proxy routing, and single-page routing fallbacks.

```
                     ┌──────────────────────────────┐
                     │         Caddy Proxy          │
                     │  (SSL/TLS via Let's Encrypt) │
                     └──────┬────────────────┬──────┘
                            │                │
           (Path: /api/*,   │                │ (Fallback)
            Path: /auth/*)  ▼                ▼
             ┌────────────────────┐    ┌────────────────────┐
             │   FastAPI Engine   │    │   Nginx Frontend   │
             │   (Port 8001)      │    │   (Port 80)        │
             └──────────┬─────────┘    └────────────────────┘
                        │
                        ▼
             ┌────────────────────┐
             │ PostgreSQL/PostGIS │
             │ (Port 5432)        │
             └────────────────────┘
```

1. **Caddy Reverse Proxy**: Serves as the public-facing edge. It handles automatic SSL/TLS certificate management and routes traffic dynamically. Path prefixes `/api/*` and `/auth/*` are directed to the FastAPI swarm engine, while all other traffic falls back to the frontend container.
2. **FastAPI Swarm Engine**: A Python-based REST API that processes authentication, telemetry ingestion, reporting logic, and AI-driven forecasting.
3. **Nginx Frontend**: Serves pre-compiled static React Single Page Application (SPA) assets. It includes rewrite rules to redirect all virtual router paths to `index.html` to prevent 404 errors during client-side page refreshes.
4. **PostgreSQL + PostGIS**: A relational database containing geospatial extensions to manage spatial boundaries, swarm locations, drone flight trajectories, and department operations.

---

## Technical Stack

* **Frontend**: React (TypeScript, Vite, Tailwind CSS, Lucide icons, Framer Motion)
* **Backend**: FastAPI (Python 3.13, SQLAlchemy, Asyncpg, Jose JWT, Passlib)
* **Database**: PostgreSQL 15 + PostGIS 3.3
* **Routing and Proxies**: Caddy 2 + Nginx (alpine-based web servers)
* **Automation**: Docker + Docker Compose

---

## Core Algorithms and Engines

### 1. BFS Threat Modeling (`ai_module.py`)
Predictive modeling relies on regional zone adjacency lists across Pakistan. The system runs Breadth-First Search (BFS) traversals on these adjacency networks to estimate swarm spread trajectories, taking into account current wind directions, temperature thresholds, and vegetation indices (NDVI).

### 2. A* Pathfinding for Drone Dispatch
To automate swarm neutralization, the platform uses an A* pathfinding algorithm based on the Haversine distance heuristic. When a swarm is detected, the engine calculates the optimal flight plan, obstacle avoidance corridors, and battery depletion safety thresholds for the nearest operational drone in the fleet.

---

## Environment Configuration

Create a `.env` file at the root of the workspace to configure environment variables for local and Docker-based runtimes.

```env
# Database Configuration
POSTGRES_USER=lcews
POSTGRES_DB=lcews
DB_PASSWORD=your_secure_password

# Authentication
SECRET_KEY=your_jwt_signing_key_secret_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=480

# API Endpoints
VITE_API_URL=https://roachpestanalyzer.duckdns.org
VITE_SWARM_API_URL=https://roachpestanalyzer.duckdns.org
```

---

## Cloud and Docker Deployment

Deploying the application via Docker Compose builds the necessary backend and frontend images, initiates the PostGIS database schema, and hooks up the Caddy reverse proxy.

### Prerequisites
* Docker installed and running
* Docker Compose version 2.0+
* Public DNS A-record pointing to your cloud instance (e.g., DuckDNS)

### Deployment Steps

1. Configure production environment variables in `.env`.
2. Update the domain name in the `Caddyfile` located under `swarm_engine/Caddyfile`:
   ```caddy
   your-domain.duckdns.org {
       # Routing rules
   }
   ```
3. Build and launch the containers:
   ```bash
   cd swarm_engine
   docker compose up -d --build
   ```
4. Verify that all services are online and passing health checks:
   ```bash
   docker compose ps
   ```

### Troubleshooting and Logging
* **View application logs**:
  ```bash
  docker compose logs -f swarm-engine
  ```
* **Tear down deployment**:
  ```bash
  docker compose down -v
  ```

---

## Local Development Setup

To run the frontend and backend microservices independently for development:

### Backend Setup (FastAPI)
1. Navigate to the engine directory and create a virtual environment:
   ```bash
   cd swarm_engine
   python -m venv venv
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server locally:
   ```bash
   python engine.py
   ```
   The backend will be accessible at `http://localhost:8001`.

### Frontend Setup (Vite)
1. Navigate to the root directory and install node modules:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be accessible at `http://localhost:5173`.

---

## Terminal API Testing Lifecycle

To test authentication and verify secure endpoint behavior using standard terminal client utilities:

### 1. Authenticate and Retrieve JWT Token
Send a POST request containing your login credentials to the auth login endpoint:
```bash
curl -X POST https://roachpestanalyzer.duckdns.org/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=awan@bahria.edu.pk&password=YourPassword"
```
The response returns a JSON payload containing an `access_token` string.

### 2. Fetch Secured Field Reports
Use the retrieved access token as a Bearer token in the request header:
```bash
curl -X GET https://roachpestanalyzer.duckdns.org/api/reports \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### 3. Review and Verify an Incident Report
Update the validation status of a specific report using a PATCH request:
```bash
curl -X PATCH https://roachpestanalyzer.duckdns.org/api/reports/RPT-2319/review \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "Verified", "feedback": "Confirmed via Drone Imagery"}'
```

### 4. Delete a Record (Admin Only)
Remove entries from the database using a DELETE request:
```bash
curl -X DELETE https://roachpestanalyzer.duckdns.org/api/reports/TEST-001 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```
Verification can be completed by requesting the deleted report ID to confirm a `404 Not Found` response status.
