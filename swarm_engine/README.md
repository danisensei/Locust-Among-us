# 🦗 Swarm Engine - Docker Deployment

Locust Swarm Engine - FastAPI backend for real-time swarm simulation and GIS data generation.

## 🚀 Quick Start

### Run on Cloud Instance

```bash
# Navigate to swarm_engine folder
cd swarm_engine

# Start the backend
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the backend
docker-compose down
```

## 📍 Access Points

- **API Server**: http://0.0.0.0:8001
- **GeoJSON**: http://your-instance-ip:8001/api/swarms/geojson
- **Heatmap**: http://your-instance-ip:8001/api/swarms/heatmap
- **Stats**: http://your-instance-ip:8001/api/swarms/stats
- **Update**: POST http://your-instance-ip:8001/api/swarms/update
- **Raw**: http://your-instance-ip:8001/api/swarms/raw

### Test from Cloud Instance

```bash
curl http://localhost:8001/api/swarms/stats
```

## 📋 Files

- `Dockerfile` - Python 3.13 FastAPI container
- `docker-compose.yml` - Service orchestration
- `engine.py` - Main application
- `requirements.txt` - Python dependencies
- `config.json` - Configuration

## 🔧 Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start in background |
| `docker-compose up` | Start with logs |
| `docker-compose logs -f` | View live logs |
| `docker-compose stop` | Stop services |
| `docker-compose down` | Stop & remove |
| `docker-compose restart` | Restart |

## 🐳 Docker Info

- **Image**: Python 3.13-slim
- **Port**: 8001
- **Health Check**: ✅ Enabled
- **Auto-restart**: ✅ Enabled

## 📡 Integration

This backend is used by the React frontend via `VITE_SWARM_API_URL` environment variable.

Frontend will fetch data from: `http://<your-instance-ip>:8001`

## ⚙️ Configuration

Modify `config.json` to customize:
- Pakistan geographic bounds
- Locust hotspots
- Swarm parameters
- Simulation settings

## 🆘 Troubleshooting

### Port Already in Use
```bash
lsof -i :8001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Container Won't Start
```bash
docker-compose logs
docker-compose down
docker-compose up --build
```

### Check Health
```bash
curl http://localhost:8001/api/swarms/stats
```

## 📦 Build Info

- **Build**: Automated Docker build from Dockerfile
- **Dependencies**: Installed from requirements.txt
- **Size**: ~500MB (optimized with slim base)

---

**Ready?** Run: `docker-compose up -d`
