# 🐳 LC-EWS Docker Deployment

Complete Docker setup for the Locust Early Warning System with consolidated backend + frontend.

## 📋 Quick Links

- **Quick Start**: See [docs/DOCKER_QUICKSTART.md](./docs/DOCKER_QUICKSTART.md)
- **Setup Guide**: See [docs/DOCKER_SETUP.md](./docs/DOCKER_SETUP.md)  
- **Deployment**: See [docs/DOCKER_DEPLOYMENT_GUIDE.md](./docs/DOCKER_DEPLOYMENT_GUIDE.md)

---

## 🚀 Quick Start (30 seconds)

### Linux/Mac
```bash
chmod +x docker-run.sh
./docker-run.sh start
```

### Windows
```bash
docker-run.bat start
```

### Any Platform
```bash
docker-compose up -d
```

Then open: **http://localhost:5173**

---

## 📁 Files in This Folder

```
docker/
├── Dockerfile              # Combined Python + Node.js (multi-stage)
├── docker-compose.yml      # Single service orchestration
├── docker-run.sh           # Linux/Mac control script (executable)
├── docker-run.bat          # Windows control script
├── .dockerignore           # Build optimization
├── README.md               # This file
└── docs/
    ├── DOCKER_QUICKSTART.md    # Quick reference (read first!)
    ├── DOCKER_SETUP.md         # Detailed setup guide
    └── DOCKER_DEPLOYMENT_GUIDE.md  # Production deployment
```

---

## 🎯 What's Inside?

### Single Combined Container
- **Backend**: Python 3.13 + FastAPI Uvicorn (port 8001)
- **Frontend**: Node.js 20 + React + Vite (ports 5173, 5174)
- **Multi-stage build**: Optimized final image size

### Includes
- Realistic locust swarm simulation engine
- GIS-based Pakistan risk zone mapping
- Real-time swarm visualization with Leaflet
- Hot-reload development support

---

## ✅ Basic Commands

| Command | Purpose |
|---------|---------|
| `./docker-run.sh start` | Start all services |
| `./docker-run.sh stop` | Stop all services |
| `./docker-run.sh logs` | View live logs |
| `./docker-run.sh status` | Check status |
| `docker-compose up -d` | Manual start |
| `docker-compose down` | Manual stop |

---

## 🌐 Access Points After Starting

- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:8001/api/swarms/stats
- **API Test**: `curl http://localhost:8001/api/swarms/stats`

---

## 🔥 First Time Setup?

1. **Install Docker**: [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
2. **Start Docker Daemon**: Open Docker Desktop
3. **Navigate to docker folder**: `cd docker`
4. **Run**: `./docker-run.sh start` (or `docker-compose up -d`)
5. **Wait 30-60 seconds** for build + startup
6. **Open browser**: http://localhost:5173
7. **Check backend**: `curl http://localhost:8001/api/swarms/stats`

---

## 📖 Documentation

### For Quick Answer
→ Read [DOCKER_QUICKSTART.md](./docs/DOCKER_QUICKSTART.md)

### For Setup Details
→ Read [DOCKER_SETUP.md](./docs/DOCKER_SETUP.md)

### For Production Deployment
→ Read [DOCKER_DEPLOYMENT_GUIDE.md](./docs/DOCKER_DEPLOYMENT_GUIDE.md)

---

## 🆘 Common Issues

### "Port already in use"
```bash
# Kill the process on port 8001
lsof -i :8001 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### "Docker daemon not running"
- **Windows/Mac**: Open Docker Desktop
- **Linux**: `sudo systemctl start docker`

### "Container won't start"
```bash
docker-compose logs
```

### "Can't access frontend"
- Check: http://localhost:5173
- Alternative port: http://localhost:5174
- Check logs: `./docker-run.sh logs`

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│    Single LC-EWS Container          │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │  Frontend    │→│  Backend     │ │
│  │  React/Vite │ │  FastAPI     │ │
│  │  Port 5173   │ │  Port 8001   │ │
│  └──────────────┘ └──────────────┘ │
│        ↓                    ↓       │
│   Host 5173            Host 8001    │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 Hot Reload Development

Both services support hot-reload:

**Backend changes:**
- Modify `../swarm_engine/*.py` → auto-reloads
- No restart needed

**Frontend changes:**
- Modify `../src/**/*.tsx` → Vite rebuilds
- Browser hot-refreshes automatically

---

## 🚀 Deployment Options

1. **Local Development**: `./docker-run.sh start`
2. **Docker Hub**: Build + push image
3. **Oracle Cloud Container Instances**: Deploy pre-built image
4. **Oracle Cloud Compute VM**: Run via Docker Compose
5. **Kubernetes**: Use provided manifests

See [DOCKER_DEPLOYMENT_GUIDE.md](./docs/DOCKER_DEPLOYMENT_GUIDE.md) for details.

---

## 📦 Image Details

- **Base Images**: 
  - Python 3.13-slim (backend)
  - Node.js 20-alpine (frontend)
  - Final: Python 3.13-slim with Node.js runtime
- **Build Size**: ~800MB (from scratch)
- **Runtime Size**: ~400-500MB (compressed)
- **Optimization**: Multi-stage build, alpine variants

---

## 🔐 Security

- Single optimized image (smaller attack surface)
- Multi-stage build excludes build dependencies
- `.dockerignore` excludes sensitive files
- Bridge network isolates container
- Health checks monitor service availability
- For production: Use secrets manager (Oracle Vault, AWS Secrets Manager)

---

## 📞 Support

- **Docs**: See [docs/](./docs/) folder
- **Issues**: Check troubleshooting in DOCKER_SETUP.md
- **Logs**: Run `./docker-run.sh logs`

---

## 📝 Version Info

- **Version**: 2.0 (Consolidated)
- **Last Updated**: April 21, 2026
- **Docker Compose**: v3.8
- **Status**: ✅ Production Ready

---

**Ready to get started?** Run: `./docker-run.sh start`
