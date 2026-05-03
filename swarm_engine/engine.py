"""
Locust Swarm Engine - Mission-driven swarm monitoring with FastAPI
Drones patrol verified report locations with realistic battery drain.
+ Auth & User management (JWT + PostgreSQL)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
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
from database import engine as db_engine, AsyncSessionLocal
from models import Base, Drone, Mission, Report
import auth as auth_module
import users_api

# ── Battery drain config ──────────────────────────────────────
# 100→0% in ~60 minutes = ~1.67% per minute
# Tick every 30 seconds = ~0.83% per tick
DRAIN_INTERVAL_SECS = 30
DRAIN_PER_TICK = 100 / (60 * 60 / DRAIN_INTERVAL_SECS)   # ≈ 0.83%

# Patrol jitter: how far (degrees) a drone drifts per tick around the report
PATROL_JITTER = 0.002   # ~200m

# In-memory drone patrol state: {drone_id(int): {"lat": ..., "lon": ..., "trail": [...]}}
_drone_patrol: Dict[int, Dict] = {}


async def battery_drain_loop():
    """Background task: drain battery & patrol movement for In Progress drones."""
    from sqlalchemy import select
    while True:
        await asyncio.sleep(DRAIN_INTERVAL_SECS)
        try:
            async with AsyncSessionLocal() as session:
                # Get all In Progress missions
                result = await session.execute(
                    select(Mission).where(Mission.status == "In Progress")
                )
                missions = result.scalars().all()

                for mission in missions:
                    # Get drone
                    drone_res = await session.execute(
                        select(Drone).where(Drone.id == mission.drone_id)
                    )
                    drone = drone_res.scalar_one_or_none()
                    if not drone:
                        continue

                    # Drain battery
                    new_battery = max(0, drone.battery - DRAIN_PER_TICK)
                    drone.battery = int(round(new_battery))

                    # Get report coordinates for patrol center
                    report_res = await session.execute(
                        select(Report).where(Report.id == mission.report_id)
                    )
                    report = report_res.scalar_one_or_none()

                    # Update patrol position (drift around report location)
                    if report and report.lat and report.lon:
                        patrol = _drone_patrol.get(drone.id)
                        if not patrol:
                            # Initialize patrol at report location
                            patrol = {
                                "lat": report.lat,
                                "lon": report.lon,
                                "heading": random.uniform(0, 360),
                                "trail": [[report.lat, report.lon]],
                            }
                            _drone_patrol[drone.id] = patrol

                        # Move drone in a patrol pattern around the report
                        heading = patrol["heading"]
                        # Orbit: bias heading to circle the report center
                        dx = patrol["lat"] - report.lat
                        dy = patrol["lon"] - report.lon
                        dist = math.sqrt(dx * dx + dy * dy)
                        # If too far from center, steer back
                        if dist > (mission.coverage_km / 111.0) * 0.5:
                            # Turn toward center
                            angle_to_center = math.degrees(math.atan2(-dx, -dy))
                            heading = (angle_to_center + random.uniform(-30, 30)) % 360
                        else:
                            # Gentle orbital turn
                            heading = (heading + random.uniform(20, 40)) % 360

                        patrol["heading"] = heading

                        # Move
                        lat_step = math.sin(math.radians(heading)) * PATROL_JITTER
                        lon_step = math.cos(math.radians(heading)) * PATROL_JITTER
                        patrol["lat"] += lat_step
                        patrol["lon"] += lon_step

                        # Track trail (last 20 positions)
                        patrol["trail"].append([patrol["lat"], patrol["lon"]])
                        if len(patrol["trail"]) > 20:
                            patrol["trail"] = patrol["trail"][-20:]

                        # Write position back to drone in DB
                        drone.lat = patrol["lat"]
                        drone.lon = patrol["lon"]

                    # Auto-complete if battery is 0
                    if drone.battery <= 0:
                        drone.battery = 0
                        drone.status = "Charging"
                        drone.lat = None
                        drone.lon = None
                        mission.status = "Completed"
                        mission.completed_at = datetime.utcnow()
                        # Clean up patrol state
                        _drone_patrol.pop(drone.id, None)
                        print(f"🔋 {drone.drone_id} battery depleted — mission {mission.mission_id} auto-completed")

                await session.commit()
        except Exception as e:
            print(f"⚠️  Battery drain tick error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup, apply migrations, seed drones, start drain loop."""
    try:
        async with db_engine.begin() as conn:
            # 1. Create any tables that don't exist yet
            await conn.run_sync(Base.metadata.create_all)

            # 2. Apply column-level migrations for existing tables
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
        print(f"⚠️  DB not connected ({e}) — API still runs")

    # Start battery drain background loop
    drain_task = asyncio.create_task(battery_drain_loop())
    print("🔋 Battery drain loop started (tick every 30s)")
    yield
    drain_task.cancel()


app = FastAPI(title="LC-EWS Swarm Engine", version="3.0.0", lifespan=lifespan)

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth & user routers
app.include_router(auth_module.router)
app.include_router(users_api.router)


# ══════════════════════════════════════════════════════════════
# Live Swarm Map Endpoints (mission-driven)
# ══════════════════════════════════════════════════════════════

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "message": "Locust Swarm Engine API — Mission-Driven v3",
        "endpoints": {
            "live_geojson": "/api/swarms/live",
            "stats": "/api/swarms/stats",
        }
    }


def _risk_color(risk_level: str) -> str:
    r = risk_level.lower() if risk_level else ""
    if r == "critical":
        return "#dc2626"
    elif r == "high":
        return "#ea580c"
    elif r == "medium":
        return "#eab308"
    else:
        return "#22c55e"


@app.get("/api/swarms/live")
async def get_live_swarms():
    """
    Returns GeoJSON FeatureCollection of active missions (In Progress).
    Each feature includes:
    - Swarm point (report coordinates) with risk/report data
    - Drone position, battery, coverage, patrol trail
    """
    from sqlalchemy import select

    features: List[Dict[str, Any]] = []

    async with AsyncSessionLocal() as session:
        # Get all active missions (Assigned + In Progress)
        result = await session.execute(
            select(Mission).where(Mission.status.in_(["Assigned", "In Progress"]))
        )
        missions = result.scalars().all()

        for mission in missions:
            # Get drone
            drone_res = await session.execute(
                select(Drone).where(Drone.id == mission.drone_id)
            )
            drone = drone_res.scalar_one_or_none()

            # Get report
            report_res = await session.execute(
                select(Report).where(Report.id == mission.report_id)
            )
            report = report_res.scalar_one_or_none()

            if not drone or not report or not report.lat or not report.lon:
                continue

            color = _risk_color(report.risk_level)
            patrol = _drone_patrol.get(drone.id, {})

            # ── Swarm feature (report location) ──────────────
            swarm_feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [report.lon, report.lat],
                },
                "properties": {
                    "layer": "swarm",
                    "report_id": report.report_id,
                    "zone": report.zone,
                    "risk_level": report.risk_level,
                    "estimated_size": report.estimated_size,
                    "description": report.description,
                    "observer_name": report.observer_name,
                    "color": color,
                    "created_at": report.created_at.isoformat(),
                },
            }
            features.append(swarm_feature)

            # ── Drone feature (patrol position) ──────────────
            drone_lat = patrol.get("lat", drone.lat or report.lat)
            drone_lon = patrol.get("lon", drone.lon or report.lon)
            drone_heading = patrol.get("heading", 0)
            drone_trail = patrol.get("trail", [])

            drone_feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [drone_lon, drone_lat],
                },
                "properties": {
                    "layer": "drone",
                    "drone_id": drone.drone_id,
                    "drone_db_id": drone.id,
                    "model": drone.model,
                    "battery": drone.battery,
                    "status": drone.status,
                    "heading": round(drone_heading, 1),
                    "trail": drone_trail,
                    # Mission info
                    "mission_id": mission.mission_id,
                    "mission_type": mission.mission_type,
                    "mission_status": mission.status,
                    "coverage_km": mission.coverage_km,
                    "altitude_m": mission.altitude_m,
                    # Report linkage
                    "report_id": report.report_id,
                    "zone": report.zone,
                    "risk_level": report.risk_level,
                    "color": color,
                    # Swarm center (for coverage circle)
                    "swarm_lat": report.lat,
                    "swarm_lon": report.lon,
                },
            }
            features.append(drone_feature)

    return {
        "type": "FeatureCollection",
        "features": features,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/swarms/stats")
async def get_swarms_stats():
    """Stats computed from active missions."""
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as session:
        # Active missions
        active_result = await session.execute(
            select(func.count()).select_from(Mission).where(
                Mission.status.in_(["Assigned", "In Progress"])
            )
        )
        active_missions = active_result.scalar() or 0

        # In-progress missions specifically
        in_progress_result = await session.execute(
            select(func.count()).select_from(Mission).where(
                Mission.status == "In Progress"
            )
        )
        in_progress = in_progress_result.scalar() or 0

        # Drones on mission
        on_mission_result = await session.execute(
            select(func.count()).select_from(Drone).where(
                Drone.status == "On Mission"
            )
        )
        drones_deployed = on_mission_result.scalar() or 0

        # Avg battery of drones on mission
        avg_battery_result = await session.execute(
            select(func.avg(Drone.battery)).where(Drone.status == "On Mission")
        )
        avg_battery = avg_battery_result.scalar()

        # Total coverage area (π * r² for each active mission)
        coverage_result = await session.execute(
            select(Mission.coverage_km).where(
                Mission.status.in_(["Assigned", "In Progress"])
            )
        )
        coverages = coverage_result.scalars().all()
        total_coverage_km2 = sum(3.14159 * c * c for c in coverages)

    return {
        "active_missions": active_missions,
        "in_progress": in_progress,
        "drones_deployed": drones_deployed,
        "avg_battery": round(avg_battery or 0, 1),
        "total_coverage_km2": round(total_coverage_km2, 1),
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    print("🦗 Starting Locust Swarm Engine v3 (Mission-Driven)...")
    print("📍 Server running on http://localhost:8001")
    print("📊 API endpoints:")
    print("   - Live GeoJSON: http://localhost:8001/api/swarms/live")
    print("   - Stats:        http://localhost:8001/api/swarms/stats")

    uvicorn.run(app, host="0.0.0.0", port=8001)
