# ============================================================================
# LC-EWS Unified Dockerfile - Multi-stage with Build Targets
# Single file supporting both backend (lc-ews-swarm-engine) and frontend 
# (lc-ews-frontend) services via build targets
# ============================================================================

# ============================================================================
# STAGE: backend
# Builds the Python FastAPI Locust Swarm Engine
# ============================================================================
FROM python:3.13-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY swarm_engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY swarm_engine/ .

# Expose port
EXPOSE 8001

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
    CMD curl -f http://localhost:8001/api/swarms/stats || exit 1

# Run the application
CMD ["python", "engine.py"]

# ============================================================================
# STAGE: frontend
# Builds the React + Vite development server
# ============================================================================
FROM node:20-alpine AS frontend

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit

# Copy all source code
COPY . .

# Expose Vite dev server ports (5173 is primary, 5174 is fallback)
EXPOSE 5173 5174

# Set environment for Vite
ENV VITE_HOST=0.0.0.0

# Run Vite dev server with automatic port fallback
CMD ["npm", "run", "dev"]
