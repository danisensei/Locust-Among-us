# Docker Setup Guide - LC-EWS (Consolidated)

## 📦 What's Included

This setup includes:
- **Combined Docker Container**: Single optimized image with both Python FastAPI backend and React/Vite frontend
- **Backend**: Python 3.13 + FastAPI Swarm Engine (port 8001)
- **Frontend**: Node.js 20 + React/Vite Application (ports 5173, 5174)

All services run in one container and communicate internally through the shared runtime.

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Daemon running

### Option 1: Run with Docker Compose (Recommended)

```bash
cd docker
docker-compose up -d
```

**Access the app:**
- Frontend: http://localhost:5173 or http://localhost:5174
- Backend API: http://localhost:8001/api/swarms/stats

---

### Option 2: Use Control Scripts

#### Linux/Mac
```bash
cd docker
chmod +x docker-run.sh
./docker-run.sh start
```

#### Windows
```bash
cd docker
docker-run.bat start
```

---

## 📋 File Structure

```
cep/
├── docker/                             # All Docker-related files
│   ├── Dockerfile                      # Combined backend + frontend (multi-stage)
│   ├── docker-compose.yml              # Orchestrates single service
│   ├── docker-run.sh                   # Linux/Mac control script
│   ├── docker-run.bat                  # Windows control script
│   ├── .dockerignore                   # Files to exclude from builds
│   └── docs/
│       ├── DOCKER_QUICKSTART.md        # Quick reference
│       ├── DOCKER_SETUP.md             # This file
│       └── DOCKER_DEPLOYMENT_GUIDE.md  # Production deployment
├── swarm_engine/
│   ├── engine.py                       # FastAPI application
│   ├── requirements.txt                # Python dependencies
│   └── start.sh                        # Startup script
└── src/
    ├── pages/
    │   └── PakistanRiskOverview.tsx
    └── ...
```

---

## 🔧 Docker Configuration

### Combined Dockerfile (Multi-Stage)

The consolidated `Dockerfile` uses 3 stages:

1. **Stage 1 - Backend**: Python 3.13 base
   - Installs FastAPI, Uvicorn, dependencies
   - Copies `swarm_engine/` code

2. **Stage 2 - Frontend**: Node.js 20 Alpine base
   - Installs npm dependencies
   - Copies React source code

3. **Stage 3 - Runtime**: Python 3.13 slim base
   - Copies Python packages from Stage 1
   - Copies Node.js from Stage 2
   - Starts both services in single container:
     - Backend: `python engine.py` (background)
     - Frontend: `npm run dev` (foreground)

### docker-compose.yml

Single service configuration:

```yaml
services:
  lc-ews:
    build:
      context: ..              # Project root
      dockerfile: ./docker/Dockerfile
    container_name: lc-ews-app
    ports:
      - "8001:8001"           # Backend API
      - "5173:5173"           # Frontend
      - "5174:5174"           # Frontend (alternate)
    volumes:
      - ../swarm_engine:/app/backend    # Hot reload backend
      - ../src:/app/frontend/src         # Hot reload frontend
      - ../public:/app/frontend/public   # Static files
```

---

## 📊 Common Commands

### View Running Containers
```bash
cd docker
docker-compose ps
```

### View Logs
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

### Stop Services
```bash
cd docker
docker-compose down              # Stops and removes containers
docker-compose down -v           # Also removes volumes
```

### Access Container Shell
```bash
cd docker
docker-compose exec lc-ews bash
```

### Check Container Resource Usage
```bash
docker stats
```

---

## 🐛 Troubleshooting

### Port Already in Use
If ports 8001, 5173, or 5174 are already in use:

**Option 1:** Kill existing processes
```bash
# Linux/Mac
lsof -i :8001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

**Option 2:** Modify `docker/docker-compose.yml`
```yaml
services:
  lc-ews:
    ports:
      - "8002:8001"     # Use 8002 instead
      - "5175:5173"     # Use 5175 instead
```

### Container Fails to Start
```bash
cd docker
docker-compose logs
docker-compose build --no-cache
```

### API Not Responding from Frontend
```bash
cd docker
docker-compose exec lc-ews curl http://localhost:8001/api/swarms/stats
docker-compose logs
```

### Backend and Frontend Not Communicating
Since both run in same container, they communicate via `localhost`:
- Frontend calls: `http://localhost:8001/api/...`
- Backend listens on: `0.0.0.0:8001`

---

## 🔄 Development Workflow

### Hot Reload Configuration

Both services support hot reload via Docker volumes:

**Backend Changes:**
- Modify files in `swarm_engine/` → backend restarts automatically
- Volume: `../swarm_engine:/app/backend`

**Frontend Changes:**
- Modify files in `src/` → Vite rebuilds instantly
- Volume: `../src:/app/frontend/src`

### Test API During Development
```bash
# From host machine
curl -s http://localhost:8001/api/swarms/stats | jq

# From container
cd docker
docker-compose exec lc-ews curl http://localhost:8001/api/swarms/stats
```

---

## 🌐 Production Deployment

### Build for Production
```bash
cd docker
docker build -f Dockerfile -t lc-ews:prod ../
```

### Push to Registry
```bash
# Docker Hub
docker tag lc-ews:prod yourusername/lc-ews:latest
docker push yourusername/lc-ews:latest

# Or custom registry
docker tag lc-ews:prod registry.example.com/lc-ews:latest
docker push registry.example.com/lc-ews:latest
```

### Production Compose File
Create `docker/docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  lc-ews:
    image: yourusername/lc-ews:latest
    container_name: lc-ews-prod
    ports:
      - "8001:8001"
      - "80:5173"
    environment:
      - PYTHONUNBUFFERED=1
    restart: always
    # Remove volumes (use production artifacts instead)
```

Run with: `docker-compose -f docker-compose.prod.yml up -d`

---

## 📦 Dependencies

### Backend (Python)
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
pydantic>=2.8.0
python-multipart>=0.0.6
```

### Frontend (Node.js)
```
react@18
typescript
vite
leaflet
leaflet.heat
leaflet.markercluster
react-leaflet
@types/leaflet
```

All automatically installed during container build.

---

## 🔐 Security Considerations

### Image Optimization
- Multi-stage build reduces final image size (~500MB → ~400MB estimated)
- Single container means single attack surface
- Smaller image = faster deployment and less vulnerability exposure

### Sensitive Data
- Create `.env` file for secrets (not committed to git)
- Mount as Docker secret in production
- Never hardcode API keys or credentials

### Network Security
- Bridge network isolates container from host
- Only expose necessary ports
- Use firewall rules to restrict access
- For production: use secrets manager (Oracle Vault, AWS Secrets Manager)

### Image Security
- Scan for vulnerabilities: `docker scan lc-ews`
- Use minimal base images (alpine, slim variants)
- Keep dependencies updated: `docker build --no-cache`

---

## 📝 Example Workflow

```bash
# 1. Navigate to docker folder
cd docker

# 2. Start development environment
./docker-run.sh start

# 3. View logs
docker-compose logs -f

# 4. Make changes to src/ or swarm_engine/ (hot-reloaded)
# 5. Open browser at http://localhost:5173

# 6. Access backend API
curl http://localhost:8001/api/swarms/stats

# 7. When done
docker-compose down
```

---

## 🆘 Getting Help

### View Help
```bash
docker-compose --help
docker run --help
docker build --help
```

### Debug Commands
```bash
# Check Dockerfile structure
docker history lc-ews:latest

# Inspect container at runtime
cd docker
docker-compose exec lc-ews env

# View all layers
docker build --no-cache --progress=plain -f Dockerfile ../
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Guide](https://vitejs.dev/)
- [Leaflet Documentation](https://leafletjs.com/)

---

## ✅ Checklist

- [ ] Docker Desktop installed and running
- [ ] Clone repository
- [ ] `cd docker && docker-compose up -d` runs successfully
- [ ] Backend accessible at http://localhost:8001/api/swarms/stats
- [ ] Frontend accessible at http://localhost:5173
- [ ] Can click "Risk Overview" and see map loading
- [ ] Hot reload working (modify src/ or swarm_engine/ and see changes)

---

**Version**: 2.0 (Consolidated Single Dockerfile)  
**Last Updated**: April 21, 2026  
**Maintained By**: LC-EWS Team
