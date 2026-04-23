@echo off
REM LC-EWS Docker Control Script for Windows
REM Usage: docker-run.bat [start|stop|restart|logs|status]
REM Run from: docker\ folder

setlocal enabledelayedexpansion

REM Get script directory
set SCRIPT_DIR=%~dp0
set COMPOSE_FILE=%SCRIPT_DIR%docker-compose.yml
set PROJECT_DIR=%SCRIPT_DIR%..

REM Color codes (simulated)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

REM Functions
:header
cls
echo.
echo ========================================
echo   LC-EWS Docker Control
echo ========================================
echo.
goto :eof

:success
echo [OK] %1
goto :eof

:error
echo [ERROR] %1
goto :eof

:info
echo [INFO] %1
goto :eof

:check_docker
where docker >nul 2>nul
if errorlevel 1 (
    echo Docker is not installed. Please install Docker Desktop.
    exit /b 1
)
echo [OK] Docker is installed
goto :eof

:start_services
call :info "Starting LC-EWS Frontend (React + Vite)..."
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" up -d
if errorlevel 1 (
    call :error "Failed to start services"
    exit /b 1
)
call :success "Frontend started!"
echo.
call :info "Frontend (lc-ews-frontend): http://localhost:5173"

REM Read API URL from .env file
if exist "%PROJECT_DIR%\.env" (
    for /f "tokens=2 delims==" %%i in ('findstr /R "VITE_SWARM_API_URL" "%PROJECT_DIR%\.env"') do set API_URL=%%i
    call :info "Backend API (Cloud Instance): !API_URL!/api/swarms/stats"
) else (
    call :info "Backend API: Check .env file for API URL"
)
echo.
call :info "Run 'docker-run.bat logs' to view logs"
goto :eof

:stop_services
call :info "Stopping LC-EWS services..."
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" down
call :success "Services stopped"
goto :eof

:restart_services
call :info "Restarting LC-EWS services..."
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" restart
call :success "Services restarted"
goto :eof

:show_logs
call :info "Showing logs (Ctrl+C to exit)..."
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" logs -f
goto :eof

:show_status
call :info "Service status:"
cd /d "%SCRIPT_DIR%"
docker-compose -f "%COMPOSE_FILE%" ps
goto :eof

:show_help
echo.
echo Usage: docker-run.bat [COMMAND]
echo.
echo Commands:
echo   start       Start frontend (lc-ews-frontend)
echo   stop        Stop all services
echo   restart     Restart all services
echo   logs        View live logs from all services
echo   status      Show status of all services
echo   help        Show this help message
echo.
echo Examples:
echo   cd docker
echo   docker-run.bat start
echo   docker-run.bat logs
echo   docker-run.bat stop
echo.
goto :eof

REM Main
call :header
call :check_docker

if "%1%"=="" (
    call :start_services
) else if "%1%"=="start" (
    call :start_services
) else if "%1%"=="stop" (
    call :stop_services
) else if "%1%"=="restart" (
    call :restart_services
) else if "%1%"=="logs" (
    call :show_logs
) else if "%1%"=="status" (
    call :show_status
) else if "%1%"=="help" (
    call :show_help
) else (
    call :error "Unknown command: %1%"
    call :show_help
    exit /b 1
)

echo.
endlocal
