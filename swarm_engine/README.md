# 🦗 Locust Swarm Engine

A realistic locust swarm simulation engine that generates GeoJSON and heatmap data for visualization on interactive maps.

## Features

✨ **Realistic Swarm Simulation**
- Simulates 2-8 locust swarms across Pakistan
- Realistic movement patterns and population dynamics
- Dynamic health degradation and swarm spawning/death
- Risk level assessment (critical, high, medium, low)

📍 **Geographic Data**
- Focuses on Pakistan's locust-prone regions (Balochistan, Sindh, KPK, Punjab)
- Realistic coordinate generation with movement simulation
- Bounds checking to keep swarms within Pakistan

🔄 **Real-time Data Endpoints**
- **GeoJSON**: Marker-ready format for clustering
- **Heatmap**: Intensity data for leaflet.heat visualization
- **Statistics**: Overall swarm metrics
- **Raw**: Direct swarm state access

## Setup (Local Development)

### 1. Install Python (if not already installed)
```bash
python --version  # Should be 3.8+
```

### 2. Create Virtual Environment
```bash
cd swarm_engine
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Engine
```bash
python engine.py
```

You should see:
```
🦗 Starting Locust Swarm Engine...
📍 Server running on http://localhost:8000
```

## API Endpoints

### Health Check
```
GET http://localhost:8000/
```

### Get Swarms as GeoJSON (for markercluster)
```
GET http://localhost:8000/api/swarms/geojson
```

Response:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [65.5, 26.7]
      },
      "properties": {
        "id": "SWARM-001",
        "size": 2500000,
        "density": 245.5,
        "speed": 22.3,
        "risk_level": "critical",
        ...
      }
    }
  ]
}
```

### Get Heatmap Data (for leaflet.heat)
```
GET http://localhost:8000/api/swarms/heatmap
```

Response:
```json
{
  "points": [
    [26.7, 65.5, 0.85],
    [26.65, 65.48, 0.42],
    ...
  ],
  "timestamp": "2024-04-21T10:30:00"
}
```

### Get Statistics
```
GET http://localhost:8000/api/swarms/stats
```

Response:
```json
{
  "total_swarms": 4,
  "total_locusts": 8500000,
  "avg_health": 0.72,
  "critical_count": 2,
  "timestamp": "2024-04-21T10:30:00"
}
```

### Trigger Simulation Update
```
POST http://localhost:8000/api/swarms/update
```

Response:
```json
{
  "status": "updated",
  "swarm_count": 4,
  "timestamp": "2024-04-21T10:30:00"
}
```

### Get Raw Swarm Data
```
GET http://localhost:8000/api/swarms/raw
```

## Integration with React App

Add this to your `SwarmMap.tsx` (or similar):

```tsx
const [swarmData, setSwarmData] = useState(null)

useEffect(() => {
  const fetchSwarmData = async () => {
    const response = await fetch('http://localhost:8000/api/swarms/geojson')
    const data = await response.json()
    setSwarmData(data)
  }

  fetchSwarmData()
  const interval = setInterval(fetchSwarmData, 5000) // Update every 5 seconds
  
  return () => clearInterval(interval)
}, [])

// Use swarmData with markercluster, leaflet.heat, etc.
```

## Deployment to Oracle Cloud

1. **Install Python on instance**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv -y
```

2. **Clone/upload code**
```bash
git clone <repo> /opt/swarm_engine
cd /opt/swarm_engine
```

3. **Setup and run**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 engine.py &
```

4. **Setup systemd service** (optional, for auto-restart)
```bash
sudo nano /etc/systemd/system/swarm-engine.service
```

Add:
```ini
[Unit]
Description=Locust Swarm Engine
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/swarm_engine
ExecStart=/opt/swarm_engine/venv/bin/python engine.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable swarm-engine
sudo systemctl start swarm-engine
```

## Data Schema

### Swarm Object
```json
{
  "id": "SWARM-001",
  "lat": 26.7,
  "lon": 65.5,
  "center_name": "Khuzdar, Balochistan",
  "size": 2500000,           // Number of locusts
  "density": 245.5,          // Locusts per sq km
  "speed": 22.3,             // km/h
  "heading": 135.0,          // degrees (0-360)
  "altitude": 850,           // meters
  "health": 0.75,            // 0-1 scale
  "risk_level": "critical",  // critical, high, medium, low
  "last_updated": "2024-04-21T10:30:00"
}
```

## Simulation Parameters

- **Update Frequency**: Manual via `/api/swarms/update` or automatic polling
- **Movement Speed**: 5-35 km/h per swarm
- **Swarm Size Range**: 50,000 - 5,000,000 locusts
- **Density Range**: 10 - 500 locusts per sq km
- **Health Degradation**: -0.02 per update (preventive control effects)
- **Spawn Probability**: 10% chance per update
- **Death Probability**: 95% threshold when health < 0.1

## Testing

Open browser to:
- `http://localhost:8000` - Status page
- `http://localhost:8000/api/swarms/stats` - Statistics
- `http://localhost:8000/api/swarms/geojson` - GeoJSON data

Use tools like:
- **Postman** - For API testing
- **curl** - For command line testing
  ```bash
  curl http://localhost:8000/api/swarms/stats | jq
  ```

## License

MIT - Free to use and modify
