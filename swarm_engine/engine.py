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

# Mount auth & user routers
app.include_router(auth_module.router)
app.include_router(users_api.router)

# Pakistan geographic bounds
PAKISTAN_BOUNDS = {
    "north": 37.1,
    "south": 23.6,
    "east": 77.8,
    "west": 60.8,
}

# Major locust-prone regions in Pakistan
HOTSPOTS = [
    {"name": "Khuzdar, Balochistan", "lat": 26.7, "lon": 65.5},
    {"name": "Quetta, Balochistan", "lat": 30.2, "lon": 67.0},
    {"name": "Jacobabad, Sindh", "lat": 28.3, "lon": 68.4},
    {"name": "D.I. Khan, KPK", "lat": 31.9, "lon": 70.9},
    {"name": "Bahawalpur, Punjab", "lat": 29.4, "lon": 71.7},
]

# Global swarm state
swarm_state = {
    "swarms": [],
    "last_update": datetime.now(),
    "update_count": 0,
}


class SwarmSimulator:
    """Simulates realistic locust swarm behavior"""

    def __init__(self):
        self.swarms = []
        self.initialize_swarms()

    def initialize_swarms(self):
        """Create initial swarms with REALISTIC locust data"""
        num_swarms = random.randint(2, 4)
        for i in range(num_swarms):
            hotspot = random.choice(HOTSPOTS)
            # Realistic swarm area: 10-500 km² (Schistocerca gregaria swarms)
            swarm_area_km2 = random.uniform(20, 400)
            # Realistic density: 40-80 million locusts per km²
            density_per_km2 = random.uniform(40000000, 80000000)
            # Total population = area × density
            total_locusts = int(swarm_area_km2 * density_per_km2)
            
            init_lat = hotspot["lat"] + random.uniform(-0.5, 0.5)
            init_lon = hotspot["lon"] + random.uniform(-0.5, 0.5)
            
            self.swarms.append({
                "id": f"SWARM-{i+1:03d}",
                "lat": init_lat,
                "lon": init_lon,
                "center_name": hotspot["name"],
                "area_km2": swarm_area_km2,  # Swarm area in km² (key metric)
                "size": total_locusts,  # Total number of locusts
                "density": density_per_km2,  # Locusts per km² (40-80 million)
                "speed": random.uniform(15, 32),  # km/h (max 34 km/h)
                "heading": random.uniform(0, 360),  # degrees
                "altitude": random.uniform(500, 1200),  # meters
                "health": random.uniform(0.7, 1.0),
                "age": 0,
                "last_updated": datetime.now().isoformat(),
                "risk_level": "critical" if total_locusts > 10000000000 else "high",  # 10B+ = critical
                "trail": [[init_lat, init_lon]],  # Position history for trail rendering
            })

    def update_swarms(self):
        """Update swarm positions and properties realistically"""
        for swarm in self.swarms:
            # Increment age
            swarm["age"] += 1
            
            # Movement simulation (locusts can travel 200 km/day = ~8 km/h average)
            lat_change = math.sin(math.radians(swarm["heading"])) * swarm["speed"] / 111
            lon_change = math.cos(math.radians(swarm["heading"])) * swarm["speed"] / (111 * math.cos(math.radians(swarm["lat"])))
            
            swarm["lat"] += lat_change * 0.01
            swarm["lon"] += lon_change * 0.01
            
            # Keep within Pakistan bounds
            swarm["lat"] = max(PAKISTAN_BOUNDS["south"], min(PAKISTAN_BOUNDS["north"], swarm["lat"]))
            swarm["lon"] = max(PAKISTAN_BOUNDS["west"], min(PAKISTAN_BOUNDS["east"], swarm["lon"]))
            
            # Track trail (keep last 20 positions)
            swarm["trail"].append([swarm["lat"], swarm["lon"]])
            if len(swarm["trail"]) > 20:
                swarm["trail"] = swarm["trail"][-20:]
            
            # Realistic heading changes (wind patterns)
            if random.random() > 0.85:
                swarm["heading"] = (swarm["heading"] + random.uniform(-20, 20)) % 360
            
            # Swarm dispersal (area shrinks as swarm is controlled/ages)
            # Dispersal rate: 2-5% of area per cycle
            dispersal_rate = random.uniform(0.02, 0.05)
            swarm["area_km2"] = max(5, swarm["area_km2"] * (1 - dispersal_rate))
            
            # Density slightly decreases (some locusts die from predation/control)
            # Much slower than area dispersal - density stays high
            mortality_rate = random.uniform(0.01, 0.03)  # 1-3% daily loss
            swarm["density"] = max(20000000, swarm["density"] * (1 - mortality_rate))
            
            # Total size = area × density
            swarm["size"] = int(swarm["area_km2"] * swarm["density"])
            
            # Health degradation (pesticides, weather, exhaustion)
            swarm["health"] = max(0.1, swarm["health"] - random.uniform(0.03, 0.08))
            
            # Speed variation - realistic bounds (15-34 km/h)
            swarm["speed"] = max(15, min(34, swarm["speed"] + random.uniform(-1, 1.5)))
            
            # Altitude changes (realistic: 500-1200m)
            swarm["altitude"] = max(500, min(1200, swarm["altitude"] + random.uniform(-100, 100)))
            
            # Risk level based on health and population size
            if swarm["health"] > 0.7 and swarm["size"] > 10000000000:  # 10+ billion = CRITICAL
                swarm["risk_level"] = "critical"
            elif swarm["health"] > 0.5 and swarm["size"] > 5000000000:  # 5+ billion = HIGH
                swarm["risk_level"] = "high"
            elif swarm["health"] > 0.3 or swarm["size"] > 1000000000:  # 1+ billion = MEDIUM
                swarm["risk_level"] = "medium"
            else:
                swarm["risk_level"] = "low"
            
            swarm["last_updated"] = datetime.now().isoformat()
        
        # Spawn new MASSIVE swarms very rarely (realistic: major infestations)
        if random.random() > 0.99 and len(self.swarms) < 4:
            hotspot = random.choice(HOTSPOTS)
            new_id = max([int(s["id"].split("-")[1]) for s in self.swarms if s["id"].startswith("SWARM-")], default=0) + 1
            # New massive swarm: 100-300 km², density 50-80 million/km²
            new_area = random.uniform(100, 300)
            new_density = random.uniform(50000000, 80000000)
            new_size = int(new_area * new_density)
            new_lat = hotspot["lat"] + random.uniform(-0.3, 0.3)
            new_lon = hotspot["lon"] + random.uniform(-0.3, 0.3)
            
            self.swarms.append({
                "id": f"SWARM-{new_id:03d}",
                "lat": new_lat,
                "lon": new_lon,
                "center_name": hotspot["name"],
                "area_km2": new_area,
                "size": new_size,
                "density": new_density,
                "speed": random.uniform(20, 32),
                "heading": random.uniform(0, 360),
                "altitude": random.uniform(600, 1100),
                "health": random.uniform(0.85, 1.0),
                "age": 0,
                "last_updated": datetime.now().isoformat(),
                "risk_level": "critical",
                "trail": [[new_lat, new_lon]],
            })
        
        # Remove dead swarms (area < 2 km² AND health < 0.15, OR age > 100 cycles)
        self.swarms = [
            s for s in self.swarms 
            if not ((s["area_km2"] < 2 and s["health"] < 0.15) or s.get("age", 0) > 150)
        ]

    def get_geojson(self) -> Dict[str, Any]:
        """Convert swarm data to GeoJSON format"""
        features = []
        
        for swarm in self.swarms:
            # Main swarm marker
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [swarm["lon"], swarm["lat"]],  # GeoJSON uses [lon, lat]
                },
                "properties": {
                    "id": swarm["id"],
                    "name": f"{swarm['id']} - {swarm['center_name']}",
                    "center_name": swarm["center_name"],
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
            }
            features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": features,
        }

    def get_heatmap_data(self) -> List[List[float]]:
        """Get data for leaflet.heat visualization (lat, lon, intensity)"""
        heatmap_points = []
        
        for swarm in self.swarms:
            # Main point
            intensity = (swarm["density"] / 500) * (swarm["size"] / 1000000)
            heatmap_points.append([
                swarm["lat"],
                swarm["lon"],
                min(1.0, intensity),  # Cap at 1.0
            ])
            
            # Add surrounding points for better heat spread
            for _ in range(int(swarm["size"] / 500000)):
                offset_lat = swarm["lat"] + random.uniform(-0.3, 0.3)
                offset_lon = swarm["lon"] + random.uniform(-0.3, 0.3)
                heatmap_points.append([
                    offset_lat,
                    offset_lon,
                    intensity * random.uniform(0.3, 0.7),
                ])
        
        return heatmap_points


# Initialize simulator
simulator = SwarmSimulator()


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
def get_swarms_geojson():
    """Get all swarms as GeoJSON for marker clustering"""
    simulator.update_swarms()  # Update on each request
    return simulator.get_geojson()


@app.get("/api/swarms/heatmap")
def get_swarms_heatmap():
    """Get heatmap data (for leaflet.heat)"""
    simulator.update_swarms()  # Update on each request
    return {
        "points": simulator.get_heatmap_data(),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/swarms/stats")
def get_swarms_stats():
    """Get overall statistics"""
    simulator.update_swarms()  # Update on each request
    
    if not simulator.swarms:
        return {
            "total_swarms": 0,
            "total_locusts": 0,
            "avg_health": 0,
            "critical_count": 0,
        }
    
    total_locusts = sum(s["size"] for s in simulator.swarms)
    avg_health = sum(s["health"] for s in simulator.swarms) / len(simulator.swarms)
    critical_count = sum(1 for s in simulator.swarms if s["risk_level"] == "critical")
    
    return {
        "total_swarms": len(simulator.swarms),
        "total_locusts": total_locusts,
        "avg_health": round(avg_health, 2),
        "critical_count": critical_count,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/swarms/update")
def update_swarms():
    """Trigger a simulation update"""
    simulator.update_swarms()
    return {
        "status": "updated",
        "swarm_count": len(simulator.swarms),
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/swarms/raw")
def get_swarms_raw():
    """Get raw swarm data"""
    return {
        "swarms": simulator.swarms,
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
