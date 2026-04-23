#!/bin/bash

# LC-EWS Docker Control Script
# Usage: ./docker-run.sh [start|stop|restart|logs|status]
# Run from: docker/ folder

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  LC-EWS Docker Control${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is running"
}

start_services() {
    print_info "Starting LC-EWS Frontend (React + Vite)..."
    cd "$SCRIPT_DIR"
    docker-compose -f "$COMPOSE_FILE" up -d
    print_success "Frontend started!"
    echo ""
    print_info "Frontend (lc-ews-frontend): http://localhost:5173"
    
    # Read API URL from .env file
    if [ -f "${PROJECT_DIR}/.env" ]; then
        API_URL=$(grep VITE_SWARM_API_URL "${PROJECT_DIR}/.env" | cut -d '=' -f2)
        print_info "Backend API (Cloud Instance): ${API_URL}/api/swarms/stats"
    else
        print_info "Backend API: Check .env file for API URL"
    fi
    echo ""
    print_info "Run '${SCRIPT_DIR}/docker-run.sh logs' to view logs"
}

stop_services() {
    print_info "Stopping LC-EWS services..."
    cd "$SCRIPT_DIR"
    docker-compose -f "$COMPOSE_FILE" down
    print_success "Services stopped"
}

restart_services() {
    print_info "Restarting LC-EWS services..."
    cd "$SCRIPT_DIR"
    docker-compose -f "$COMPOSE_FILE" restart
    print_success "Services restarted"
}

show_logs() {
    print_info "Showing logs (Ctrl+C to exit)..."
    cd "$SCRIPT_DIR"
    docker-compose -f "$COMPOSE_FILE" logs -f
}

show_status() {
    print_info "Service status:"
    cd "$SCRIPT_DIR"
    docker-compose -f "$COMPOSE_FILE" ps
}

show_help() {
    echo ""
    echo "Usage: ./docker-run.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start frontend (lc-ews-frontend)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        View live logs from all services"
    echo "  status      Show status of all services"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  cd docker && ./docker-run.sh start"
    echo "  cd docker && ./docker-run.sh logs"
    echo "  cd docker && ./docker-run.sh stop"
    echo ""
}

# Main
print_header
echo ""

check_docker

case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    help)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

echo ""
