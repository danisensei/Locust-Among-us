# ============================================================================
# Swarm Engine Dockerfile - FastAPI + Auth + PostgreSQL client
# ============================================================================
FROM python:3.13-slim

WORKDIR /app

# Install system deps (gcc for bcrypt, libpq for asyncpg)
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code (engine.py, auth.py, database.py, models.py, users_api.py)
COPY . .

# Expose port
EXPOSE 8001

# Unbuffered logs so docker logs work correctly
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=15s \
    CMD curl -f http://localhost:8001/ || exit 1

# Run the application
CMD ["python", "engine.py"]
