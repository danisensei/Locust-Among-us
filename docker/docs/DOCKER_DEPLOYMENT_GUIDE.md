# Docker Deployment Guide - LC-EWS (Consolidated)

## 📋 Overview

This guide covers:
1. **Local Development** - Using Docker Compose for development
2. **Docker Hub Deployment** - Pushing single combined image to Docker Hub
3. **Oracle Cloud Deployment** - Running on Oracle Cloud Container Instances or Compute

---

## 🏠 Local Development Setup

### Prerequisites
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Git
- 4GB RAM minimum (8GB recommended)

### Quick Start

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

#### Manual (All Platforms)
```bash
cd docker
docker-compose up -d
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8001
- **API Test**: `curl http://localhost:8001/api/swarms/stats`

### View Logs
```bash
# All services (same container)
cd docker
docker-compose logs -f
```

### Hot Reload
- **Backend**: Edit `swarm_engine/*.py` - automatically reloads
- **Frontend**: Edit `src/**/*.tsx` - Vite rebuilds instantly

---

## 🐳 Docker Hub Deployment

### 1. Create Docker Hub Account
- Go to [Docker Hub](https://hub.docker.com/)
- Sign up (free tier available)
- Create a repository: `lc-ews` (single repo for combined image)

### 2. Login to Docker Hub
```bash
docker login
# Enter username and password
```

### 3. Build and Push Combined Image

```bash
# From project root
cd docker

# Build image
docker build -f Dockerfile -t yourusername/lc-ews:latest ../
docker build -f Dockerfile -t yourusername/lc-ews:1.0 ../

# Tag for Docker Hub (optional, build command above does this)
docker tag yourusername/lc-ews:latest yourusername/lc-ews:latest
```

#### Push to Docker Hub
```bash
# Latest version
docker push yourusername/lc-ews:latest

# Specific version
docker push yourusername/lc-ews:1.0
```

### 4. Verify on Docker Hub
Visit: `https://hub.docker.com/r/yourusername/lc-ews`

### 5. Run from Docker Hub

```bash
# Pull image
docker pull yourusername/lc-ews:latest

# Run container
docker run -p 8001:8001 -p 5173:5173 -p 5174:5174 \
  --name lc-ews \
  yourusername/lc-ews:latest
```

---

## ☁️ Oracle Cloud Deployment

### Option 1: Oracle Container Instances (Recommended)

#### Step 1: Install Oracle Cloud CLI
```bash
# Download from: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm
curl -L -O https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh
bash install.sh --accept-all-defaults
```

#### Step 2: Configure Oracle Cloud Credentials
```bash
oci setup config
# Follow prompts to configure your Oracle Cloud credentials
```

#### Step 3: Push Image to Oracle Container Registry (OCIR)

```bash
# Build image
cd docker
docker build -f Dockerfile -t lc-ews:latest ../

# Login to OCIR
docker login <region>.ocir.io
# Username: <tenancy-name>/<username>
# Password: auth token (create in Oracle Cloud console)

# Tag image for OCIR
docker tag lc-ews:latest <region>.ocir.io/<tenancy-namespace>/lc-ews:latest

# Push to OCIR
docker push <region>.ocir.io/<tenancy-namespace>/lc-ews:latest
```

#### Step 4: Deploy to Container Instances

Create `container-config.json`:
```json
[
  {
    "displayName": "lc-ews-app",
    "imageUrl": "<region>.ocir.io/<tenancy-namespace>/lc-ews:latest",
    "environmentVariables": {
      "PYTHONUNBUFFERED": "1",
      "VITE_API_URL": "http://localhost:8001"
    },
    "ports": [8001, 5173, 5174],
    "workingDirectory": "/app"
  }
]
```

Deploy:
```bash
oci container-instances create-container-instance \
  --availability-domain <AD> \
  --compartment-id <compartment-id> \
  --containers file://container-config.json \
  --display-name lc-ews-prod
```

---

### Option 2: Compute Instance with Docker (More Control)

#### Step 1: Create Compute Instance
```bash
# Oracle Cloud Console:
# 1. Navigate to Compute → Instances
# 2. Click "Create Instance"
# 3. Choose Ubuntu 22.04 LTS
# 4. SSH key pair: Download and save locally
# 5. Create instance
```

#### Step 2: SSH into Instance
```bash
chmod 600 your-private-key.key
ssh -i your-private-key.key ubuntu@<instance-public-ip>
```

#### Step 3: Install Docker
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker
```

#### Step 4: Clone Repository
```bash
git clone https://github.com/yourusername/lc-ews.git
cd lc-ews
```

#### Step 5: Pull Image from Docker Hub
```bash
docker pull yourusername/lc-ews:latest
```

#### Step 6: Create Production Compose File
```bash
cd docker
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  lc-ews:
    image: yourusername/lc-ews:latest
    container_name: lc-ews-prod
    ports:
      - "8001:8001"
      - "80:5173"
      - "443:5173"
    environment:
      - PYTHONUNBUFFERED=1
      - VITE_API_URL=http://your-instance-ip:8001
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/swarms/stats"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Step 7: Start Services
```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

#### Step 8: Configure Firewall (Oracle Cloud Console)
```
1. Go to Instances → Your Instance → Virtual Cloud Network
2. Click Security List
3. Add Ingress Rules:
   - Port 80 (HTTP) from 0.0.0.0/0
   - Port 443 (HTTPS) from 0.0.0.0/0
   - Port 8001 (API) from 0.0.0.0/0 (or restrict to your IP)
```

#### Step 9: Test Access
```bash
# From your machine
curl http://<instance-public-ip>:8001/api/swarms/stats
```

---

### Option 3: Using Kubernetes (Advanced)

#### Create Kubernetes Manifests

`k8s-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lc-ews
spec:
  replicas: 2
  selector:
    matchLabels:
      app: lc-ews
  template:
    metadata:
      labels:
        app: lc-ews
    spec:
      containers:
      - name: lc-ews-app
        image: yourusername/lc-ews:latest
        ports:
        - containerPort: 8001
        - containerPort: 5173
        env:
        - name: PYTHONUNBUFFERED
          value: "1"
        - name: VITE_API_URL
          value: "http://lc-ews-service:8001"
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: lc-ews-service
spec:
  selector:
    app: lc-ews
  ports:
  - name: api
    port: 8001
    targetPort: 8001
  - name: web
    port: 5173
    targetPort: 5173
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s-deployment.yaml
kubectl get services
```

---

## 🔒 Security Checklist

- [ ] Store API keys in `.env` file (not in docker-compose)
- [ ] Enable HTTPS/TLS with Let's Encrypt
- [ ] Use strong credentials for sensitive operations
- [ ] Restrict network access to necessary ports only
- [ ] Enable Oracle Cloud IAM authentication
- [ ] Scan image for vulnerabilities: `docker scan yourusername/lc-ews`
- [ ] Keep base images updated
- [ ] Use private registries for sensitive deployments
- [ ] Enable container logging and monitoring

---

## 📊 Monitoring & Logs

### Docker Logs
```bash
cd docker
docker-compose logs -f
```

### Oracle Cloud Logging
```bash
# Compute Instance logs
sudo tail -f /var/log/docker.log

# Container logs
docker logs -f lc-ews-prod
```

### Health Checks
```bash
# Backend health
curl http://localhost:8001/api/swarms/stats

# Frontend status
curl -I http://localhost:5173
```

### Monitor Resource Usage
```bash
docker stats --no-stream=false
```

---

## 🆘 Troubleshooting

### Container Won't Start
```bash
cd docker
docker-compose logs
docker-compose ps
```

### Out of Disk Space
```bash
docker system prune -a
docker volume prune
```

### Image Pull Fails
```bash
# Re-authenticate
docker login
docker pull yourusername/lc-ews:latest
```

### High CPU/Memory Usage
```bash
docker stats
cd docker
docker-compose down
docker-compose up -d
```

### Can't Connect to Services
```bash
cd docker
docker-compose exec lc-ews curl http://localhost:8001/api/swarms/stats
docker-compose exec lc-ews curl http://localhost:5173
```

---

## 📈 Performance Tuning

### Backend Optimization
Edit `swarm_engine/engine.py`:
- Increase worker count: `uvicorn --workers 4`
- Add caching headers to API responses
- Enable gzip compression

### Frontend Optimization
Edit `vite.config.ts`:
- Enable code splitting
- Optimize chunk size
- Configure lazy loading for routes

### Docker Optimization
- Use `.dockerignore` to exclude unnecessary files
- Leverage multi-stage builds (already implemented)
- Pin base image versions for stability
- Use health checks

### Oracle Cloud Optimization
- Use larger instance types for better performance
- Enable auto-scaling for multiple replicas
- Use load balancers for high traffic
- Configure CDN for static assets
- Enable caching layers

---

## 📚 Reference

- [Docker Docs](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/)
- [Oracle Container Instances](https://docs.oracle.com/en-us/iaas/Container-Instances/home.htm)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Guide](https://vitejs.dev/guide/ssr.html)
- [Kubernetes Docs](https://kubernetes.io/docs/)

---

**Version**: 2.0 (Consolidated Single Image)  
**Last Updated**: April 21, 2026  
**Status**: Ready for production deployment
