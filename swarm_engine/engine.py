"""
Locust Swarm Engine - Realistic swarm simulation with FastAPI
Generates GeoJSON data for real-time swarm visualization
+ Auth & User management (JWT + PostgreSQL)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

# Single .env at project root
_root_env = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=_root_env, override=False)

# Local modules (auth, users, db)
from database import engine as db_engine
from models import Base
import auth as auth_module
import users_api

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup, apply migrations, and seed drones."""
    try:
        async with db_engine.begin() as conn:
            # 1. Create any tables that don't exist yet
            await conn.run_sync(Base.metadata.create_all)

            # 2. Apply column-level migrations for existing tables
            #    (create_all only creates NEW tables, it won't add columns)
            migrations = [
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS estimated_size VARCHAR(50)",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewer_feedback TEXT",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255)",
                "ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP",
            ]
            from sqlalchemy import text
            for sql in migrations:
                await conn.execute(text(sql))

        # 3. Seed drones if table is empty
        from database import AsyncSessionLocal
        from models import Drone
        from sqlalchemy import select, func

        async with AsyncSessionLocal() as session:
            count = await session.scalar(select(func.count()).select_from(Drone))
            if count == 0:
                seed_drones = [
                    Drone(drone_id="DPP-Alpha",   model="DJI Matrice 350 RTK",   status="Available", battery=92),
                    Drone(drone_id="DPP-Beta",    model="DJI Matrice 350 RTK",   status="Available", battery=85),
                    Drone(drone_id="DPP-Gamma",   model="DJI Agras T40",         status="Available", battery=78),
                    Drone(drone_id="DPP-Delta",   model="DJI Agras T40",         status="Available", battery=95),
                    Drone(drone_id="DPP-Echo",    model="DJI Mavic 3 Enterprise", status="Maintenance", battery=40),
                    Drone(drone_id="DPP-Foxtrot", model="DJI Mavic 3 Enterprise", status="Available", battery=100),
                ]
                session.add_all(seed_drones)
                await session.commit()
                print("🛩️  Seeded 6 drones into fleet")

        print("✅ Database tables ready (migrations applied)")
    except Exception as e:
        print(f"⚠️  DB not connected ({e}) — swarm simulation still runs")
    yield


app = FastAPI(title="LC-EWS Swarm Engine", version="2.0.0", lifespan=lifespan)

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth, user & AI routers
app.include_router(auth_module.router)
app.include_router(users_api.router)
import ai_module
app.include_router(ai_module.router)

# Pakistan geographic bounds
PAKISTAN_BOUNDS = {
    "north": 37.1,
    "south": 23.6,
    "east": 77.8,
    "west": 60.8,
}


class SwarmSimulator:
    """
    DB-driven swarm simulation.
    Swarms only exist for missions with status 'In Progress'.
    Each swarm is keyed by mission_id and spawns at the report's coordinates.
    """

    def __init__(self):
        # { mission_id: swarm_dict }
        self.swarms: Dict[str, Dict[str, Any]] = {}

    def sync_from_missions(self, active_missions: List[Dict[str, Any]]):
        """
        Sync swarms with the current set of active (In Progress) missions.
        - New missions → spawn a swarm at the report's location
        - Removed missions → remove the swarm
        - Existing missions → keep the swarm (it keeps moving)
        """
        active_ids = {m["mission_id"] for m in active_missions}

        # Remove swarms for missions that are no longer active
        dead = [mid for mid in self.swarms if mid not in active_ids]
        for mid in dead:
            del self.swarms[mid]

        # Add new swarms for missions that don't have one yet
        for m in active_missions:
            mid = m["mission_id"]
            if mid not in self.swarms:
                lat = m.get("lat") or 30.0
                lon = m.get("lon") or 69.0
                zone = m.get("zone", "Unknown Zone")
                risk = m.get("risk_level", "high")

                # Derive realistic parameters from report risk
                if risk.lower() == "critical":
                    area = random.uniform(150, 400)
                    density = random.uniform(60000000, 80000000)
                elif risk.lower() == "high":
                    area = random.uniform(80, 200)
                    density = random.uniform(50000000, 70000000)
                elif risk.lower() == "medium":
                    area = random.uniform(30, 100)
                    density = random.uniform(40000000, 60000000)
                else:
                    area = random.uniform(10, 50)
                    density = random.uniform(30000000, 50000000)

                self.swarms[mid] = {
                    "id": mid,
                    "mission_id": mid,
                    "report_id": m.get("report_id", ""),
                    "observer_name": m.get("observer_name", ""),
                    "lat": lat + random.uniform(-0.02, 0.02),
                    "lon": lon + random.uniform(-0.02, 0.02),
                    "origin_lat": lat,
                    "origin_lon": lon,
                    "center_name": zone,
                    "area_km2": area,
                    "size": int(area * density),
                    "density": density,
                    "speed": random.uniform(15, 32),
                    "heading": random.uniform(0, 360),
                    "altitude": random.uniform(500, 1200),
                    "health": random.uniform(0.7, 1.0),
                    "age": 0,
                    "risk_level": risk.lower(),
                    "last_updated": datetime.now().isoformat(),
                    "trail": [[lat, lon]],
                }

    def update_swarms(self):
        """Update swarm positions and properties (same realistic logic)."""
        for swarm in self.swarms.values():
            swarm["age"] += 1

            # Movement
            lat_change = math.sin(math.radians(swarm["heading"])) * swarm["speed"] / 111
            lon_change = math.cos(math.radians(swarm["heading"])) * swarm["speed"] / (
                111 * math.cos(math.radians(swarm["lat"]))
            )
            swarm["lat"] += lat_change * 0.01
            swarm["lon"] += lon_change * 0.01

            # Keep within Pakistan bounds
            swarm["lat"] = max(PAKISTAN_BOUNDS["south"], min(PAKISTAN_BOUNDS["north"], swarm["lat"]))
            swarm["lon"] = max(PAKISTAN_BOUNDS["west"], min(PAKISTAN_BOUNDS["east"], swarm["lon"]))

            # Trail
            swarm["trail"].append([swarm["lat"], swarm["lon"]])
            if len(swarm["trail"]) > 20:
                swarm["trail"] = swarm["trail"][-20:]

            # Heading changes
            if random.random() > 0.85:
                swarm["heading"] = (swarm["heading"] + random.uniform(-20, 20)) % 360

            # Dispersal
            dispersal_rate = random.uniform(0.02, 0.05)
            swarm["area_km2"] = max(5, swarm["area_km2"] * (1 - dispersal_rate))

            # Mortality
            mortality_rate = random.uniform(0.01, 0.03)
            swarm["density"] = max(20000000, swarm["density"] * (1 - mortality_rate))
            swarm["size"] = int(swarm["area_km2"] * swarm["density"])

            # Health
            swarm["health"] = max(0.1, swarm["health"] - random.uniform(0.03, 0.08))

            # Speed
            swarm["speed"] = max(15, min(34, swarm["speed"] + random.uniform(-1, 1.5)))

            # Altitude
            swarm["altitude"] = max(500, min(1200, swarm["altitude"] + random.uniform(-100, 100)))

            # Risk level
            if swarm["health"] > 0.7 and swarm["size"] > 10000000000:
                swarm["risk_level"] = "critical"
            elif swarm["health"] > 0.5 and swarm["size"] > 5000000000:
                swarm["risk_level"] = "high"
            elif swarm["health"] > 0.3 or swarm["size"] > 1000000000:
                swarm["risk_level"] = "medium"
            else:
                swarm["risk_level"] = "low"

            swarm["last_updated"] = datetime.now().isoformat()

    def get_geojson(self) -> Dict[str, Any]:
        """Convert swarm data to GeoJSON format."""
        features = []
        for swarm in self.swarms.values():
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [swarm["lon"], swarm["lat"]],
                },
                "properties": {
                    "id": swarm["id"],
                    "name": f"{swarm['id']} — {swarm['center_name']}",
                    "center_name": swarm["center_name"],
                    "mission_id": swarm["mission_id"],
                    "report_id": swarm.get("report_id", ""),
                    "observer_name": swarm.get("observer_name", ""),
                    "size": swarm["size"],
                    "area_km2": round(swarm["area_km2"], 2),
                    "density": round(swarm["density"], 2),
                    "speed": round(swarm["speed"], 2),
                    "heading": round(swarm["heading"], 2),
                    "altitude": round(swarm["altitude"], 0),
                    "health": round(swarm["health"], 2),
                    "risk_level": swarm["risk_level"],
                    "last_updated": swarm["last_updated"],
                    "intensity": max(0.1, swarm["density"] / 80000000),
                    "trail": swarm.get("trail", []),
                },
            })
        return {"type": "FeatureCollection", "features": features}

    def get_heatmap_data(self) -> List[List[float]]:
        """Get data for leaflet.heat visualization."""
        heatmap_points = []
        for swarm in self.swarms.values():
            intensity = (swarm["density"] / 500) * (swarm["size"] / 1000000)
            heatmap_points.append([swarm["lat"], swarm["lon"], min(1.0, intensity)])
            for _ in range(int(swarm["size"] / 500000)):
                heatmap_points.append([
                    swarm["lat"] + random.uniform(-0.3, 0.3),
                    swarm["lon"] + random.uniform(-0.3, 0.3),
                    intensity * random.uniform(0.3, 0.7),
                ])
        return heatmap_points


# Initialize simulator (starts empty — swarms come from missions)
simulator = SwarmSimulator()


# ── Helper: fetch active missions from DB ─────────────────────
async def _sync_swarms():
    """Query DB for In Progress missions and sync the simulator."""
    from database import AsyncSessionLocal
    from models import Mission, Report
    from sqlalchemy import select

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Mission, Report)
                .join(Report, Mission.report_id == Report.id)
                .where(Mission.status == "In Progress")
            )
            rows = result.all()

            active = []
            for mission, report in rows:
                active.append({
                    "mission_id": mission.mission_id,
                    "report_id": report.report_id,
                    "observer_name": report.observer_name,
                    "zone": report.zone,
                    "risk_level": report.risk_level,
                    "lat": report.lat,
                    "lon": report.lon,
                })
            simulator.sync_from_missions(active)
    except Exception as e:
        print(f"⚠️  Swarm sync error: {e}")

    simulator.update_swarms()


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "Locust Swarm Engine API",
        "endpoints": {
            "geojson": "/api/swarms/geojson",
            "heatmap": "/api/swarms/heatmap",
            "stats": "/api/swarms/stats",
            "update": "/api/swarms/update",
        }
    }


@app.get("/api/swarms/geojson")
async def get_swarms_geojson():
    """Get all swarms as GeoJSON — only shows swarms for In Progress missions."""
    await _sync_swarms()
    return simulator.get_geojson()


@app.get("/api/swarms/heatmap")
async def get_swarms_heatmap():
    """Get heatmap data (for leaflet.heat)."""
    await _sync_swarms()
    return {
        "points": simulator.get_heatmap_data(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/swarms/stats")
async def get_swarms_stats():
    """Get overall statistics."""
    await _sync_swarms()

    swarm_list = list(simulator.swarms.values())
    if not swarm_list:
        return {
            "total_swarms": 0,
            "total_locusts": 0,
            "avg_health": 0,
            "critical_count": 0,
        }

    total_locusts = sum(s["size"] for s in swarm_list)
    avg_health = sum(s["health"] for s in swarm_list) / len(swarm_list)
    critical_count = sum(1 for s in swarm_list if s["risk_level"] == "critical")

    return {
        "total_swarms": len(swarm_list),
        "total_locusts": total_locusts,
        "avg_health": round(avg_health, 2),
        "critical_count": critical_count,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/swarms/update")
async def update_swarms_endpoint():
    """Trigger a simulation update."""
    await _sync_swarms()
    return {
        "status": "updated",
        "swarm_count": len(simulator.swarms),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/swarms/raw")
async def get_swarms_raw():
    """Get raw swarm data."""
    await _sync_swarms()
    return {
        "swarms": list(simulator.swarms.values()),
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    print("🦗 Starting Locust Swarm Engine...")
    print("📍 Server running on http://localhost:8001")
    print("📊 API endpoints:")
    print("   - GeoJSON: http://localhost:8001/api/swarms/geojson")
    print("   - Heatmap: http://localhost:8001/api/swarms/heatmap")
    print("   - Stats: http://localhost:8001/api/swarms/stats")
    print("   - Update: POST http://localhost:8001/api/swarms/update")
    print("   - Raw: http://localhost:8001/api/swarms/raw")

    uvicorn.run(app, host="0.0.0.0", port=8001)
