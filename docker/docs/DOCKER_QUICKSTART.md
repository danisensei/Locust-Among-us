# 🐳 Docker Setup for LC-EWS (Consolidated)

## Quick Reference

| Task | Command |
|------|---------|
| **Start** (Linux/Mac) | `cd docker && ./docker-run.sh start` |
| **Start** (Windows) | `cd docker && docker-run.bat start` |
| **Start** (Manual) | `cd docker && docker-compose up -d` |
| **View Logs** | `docker-compose logs -f` |
| **Stop** | `./docker-run.sh stop` or `docker-compose down` |
| **Status** | `./docker-run.sh status` |

---

## 📁 New Docker Folder Structure

```
docker/
├── Dockerfile                   # Combined backend + frontend
├── docker-compose.yml          # Orchestrate single service
├── docker-run.sh               # Linux/Mac control script (executable)
├── docker-run.bat              # Windows control script
├── .dockerignore               # Optimize build context
└── docs/
    ├── DOCKER_QUICKSTART.md    # This file (quick reference)
    ├── DOCKER_SETUP.md         # Detailed setup guide
    └── DOCKER_DEPLOYMENT_GUIDE.md  # Production deployment guide
```

---

## 🚀 One-Line Start (Recommended)

### Linux/Mac
```bash
cd docker
./docker-run.sh start
```

### Windows
```bash
cd docker
docker-run.bat start
```

### Any Platform
```bash
cd docker
docker-compose up -d
```

---

## ✅ What the Combined Dockerfile Does

### Multi-Stage Build
1. **Stage 1 (Backend)**: Python 3.13 image
   - Installs FastAPI + Uvicorn
   - Copies swarm_engine code
   
2. **Stage 2 (Frontend)**: Node.js 20 Alpine image
   - Installs npm dependencies
   - Copies React source code
   
3. **Stage 3 (Runtime)**: Single final image
   - Combines both Python and Node.js runtime
   - Starts backend (`python engine.py`) in background
   - Starts frontend (`npm run dev`) in foreground
   - Exposes ports 8001, 5173, 5174

---

## 🔄 Data Flow (Docker)

```
┌─────────────────────────────────┐
│    Single LC-EWS Container      │
├─────────────────────────────────┤
│                                 │
│  ┌──────────────┐  ┌──────────┐│
│  │  Frontend    │→ │Backend   ││
│  │  Port 5173   │  │Port 8001 ││
│  │  (React)     │  │(FastAPI) ││
│  └──────────────┘  └──────────┘│
│        ↓                  ↓     │
│  Host 5173        Host 8001     │
│                                 │
└─────────────────────────────────┘
```

---

## 🎯 Access After Starting

**Frontend:**
- Local: http://localhost:5173 or http://localhost:5174

**Backend API:**
- Local: http://localhost:8001/api/swarms/stats

**Test Backend:**
```bash
curl http://localhost:8001/api/swarms/stats | jq
```

---

## 📝 docker-compose.yml Service

### Single Service: `lc-ews`
```yaml
Build: ./docker/Dockerfile (multi-stage)
Ports: 8001, 5173, 5174
Volumes: Hot reload for src/ and swarm_engine/
Network: lc-ews-network
Health: Monitors /api/swarms/stats
```

---

## 🔧 Common Tasks

### View All Logs
```bash
cd docker
docker-compose logs -f
```

### Rebuild Images (fresh install)
```bash
cd docker
docker-compose build --no-cache
docker-compose up -d
```

### Clean Up Everything
```bash
cd docker
docker-compose down -v  # Removes containers, networks, volumes
```

### SSH into Container
```bash
cd docker
docker-compose exec lc-ews bash
```

### Check Memory/CPU Usage
```bash
docker stats
```

---

## 🐛 Troubleshooting

### "Port 5173 is in use"
```bash
# Option 1: Kill the process
lsof -i :5173 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Option 2: Docker will automatically use 5174 instead
```

### "Backend not connecting from frontend"
```bash
# Test from container
cd docker
docker-compose exec lc-ews curl http://localhost:8001/api/swarms/stats

# If failed, check logs
docker-compose logs
```

### "Docker daemon not running"
- Windows: Start Docker Desktop
- Linux: `sudo systemctl start docker`

### Container stops immediately
```bash
cd docker
docker-compose logs
docker-compose build --no-cache
```

---

## 🚀 Production Deployment to Oracle Cloud

See [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md) for:
- Docker Hub setup
- Oracle Cloud Container Instances
- Oracle Cloud Compute (VM)
- Kubernetes deployment

---

## 📊 Monitoring

### Real-time Stats
```bash
docker stats --no-stream=false
```

### Check Service Health
```bash
cd docker
docker-compose ps
```

### Test API
```bash
curl http://localhost:8001/api/swarms/stats
```

---

## 🔐 Security Notes

- Single optimized image (smaller attack surface)
- Multi-stage build reduces final image size
- All traffic within isolated Docker network
- Use `.dockerignore` to exclude sensitive files
- For production: use secrets manager (Oracle Vault)

---

## 📚 Next Steps

1. ✅ **Run locally**: `cd docker && ./docker-run.sh start`
2. ✅ **Verify**: Open http://localhost:5173
3. ✅ **Test API**: `curl http://localhost:8001/api/swarms/stats`
4. ⭕ **Deploy to Cloud**: See DOCKER_DEPLOYMENT_GUIDE.md

---

## 📖 Full Documentation

- **Setup Details**: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- **Production Deployment**: [DOCKER_DEPLOYMENT_GUIDE.md](./DOCKER_DEPLOYMENT_GUIDE.md)

---

**Version**: 2.0 (Consolidated)  
**Created**: April 21, 2026  
**Status**: ✅ Single combined Dockerfile
