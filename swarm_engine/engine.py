"""
Locust Swarm Engine - Realistic swarm simulation with FastAPI
Generates GeoJSON data for real-time swarm visualization
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import random
import math
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uvicorn

app = FastAPI(title="Locust Swarm Engine", version="1.0.0")

# Enable CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        """Create initial swarms"""
        num_swarms = random.randint(2, 5)
        for i in range(num_swarms):
            hotspot = random.choice(HOTSPOTS)
            self.swarms.append({
                "id": f"SWARM-{i+1:03d}",
                "lat": hotspot["lat"] + random.uniform(-0.5, 0.5),
                "lon": hotspot["lon"] + random.uniform(-0.5, 0.5),
                "center_name": hotspot["name"],
                "size": random.randint(100000, 5000000),  # Number of locusts
                "density": random.uniform(50, 500),  # Locusts per square km
                "speed": random.uniform(10, 35),  # km/h
                "heading": random.uniform(0, 360),  # degrees
                "altitude": random.uniform(100, 2000),  # meters
                "health": random.uniform(0.6, 1.0),
                "last_updated": datetime.now().isoformat(),
                "risk_level": random.choice(["critical", "high", "medium"]),
            })

    def update_swarms(self):
        """Update swarm positions and properties"""
        for swarm in self.swarms:
            # Update position (movement simulation)
            lat_change = math.sin(math.radians(swarm["heading"])) * swarm["speed"] / 111  # Convert km to degrees
            lon_change = math.cos(math.radians(swarm["heading"])) * swarm["speed"] / (111 * math.cos(math.radians(swarm["lat"])))
            
            swarm["lat"] += lat_change * 0.01  # Scale factor for realistic movement
            swarm["lon"] += lon_change * 0.01
            
            # Keep within Pakistan bounds
            swarm["lat"] = max(PAKISTAN_BOUNDS["south"], min(PAKISTAN_BOUNDS["north"], swarm["lat"]))
            swarm["lon"] = max(PAKISTAN_BOUNDS["west"], min(PAKISTAN_BOUNDS["east"], swarm["lon"]))
            
            # Random heading changes
            if random.random() > 0.8:
                swarm["heading"] = (swarm["heading"] + random.uniform(-30, 30)) % 360
            
            # Population fluctuation
            swarm["size"] = max(50000, swarm["size"] + random.randint(-50000, 100000))
            
            # Density variation
            swarm["density"] = max(10, swarm["density"] + random.uniform(-50, 50))
            
            # Health degradation (slight)
            swarm["health"] = max(0.3, swarm["health"] - random.uniform(0, 0.02))
            
            # Speed variation
            swarm["speed"] = max(5, swarm["speed"] + random.uniform(-2, 3))
            
            # Altitude changes
            swarm["altitude"] = max(50, swarm["altitude"] + random.uniform(-200, 200))
            
            # Risk level based on health
            if swarm["health"] > 0.8:
                swarm["risk_level"] = random.choice(["high", "critical"])
            elif swarm["health"] > 0.6:
                swarm["risk_level"] = random.choice(["medium", "high"])
            else:
                swarm["risk_level"] = random.choice(["low", "medium"])
            
            swarm["last_updated"] = datetime.now().isoformat()
        
        # Randomly spawn new swarms
        if random.random() > 0.9 and len(self.swarms) < 8:
            hotspot = random.choice(HOTSPOTS)
            self.swarms.append({
                "id": f"SWARM-{len(self.swarms)+1:03d}",
                "lat": hotspot["lat"] + random.uniform(-0.5, 0.5),
                "lon": hotspot["lon"] + random.uniform(-0.5, 0.5),
                "center_name": hotspot["name"],
                "size": random.randint(100000, 2000000),
                "density": random.uniform(50, 300),
                "speed": random.uniform(10, 30),
                "heading": random.uniform(0, 360),
                "altitude": random.uniform(100, 1500),
                "health": random.uniform(0.7, 1.0),
                "last_updated": datetime.now().isoformat(),
                "risk_level": random.choice(["high", "critical"]),
            })
        
        # Randomly remove weak swarms
        self.swarms = [s for s in self.swarms if s["health"] > 0.1 or random.random() > 0.95]

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
                    "size": swarm["size"],
                    "density": round(swarm["density"], 2),
                    "speed": round(swarm["speed"], 2),
                    "heading": round(swarm["heading"], 2),
                    "altitude": round(swarm["altitude"], 0),
                    "health": round(swarm["health"], 2),
                    "risk_level": swarm["risk_level"],
                    "last_updated": swarm["last_updated"],
                    "intensity": max(0.1, swarm["density"] / 500),  # For heatmap intensity
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
