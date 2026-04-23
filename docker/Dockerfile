# ============================================================================
# LC-EWS Dockerfile - Frontend Only
# React + Vite development server
# Backend (Swarm Engine) runs on Oracle Cloud instance
# ============================================================================
FROM node:20-alpine

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
