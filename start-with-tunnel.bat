@echo off
REM =========================================
REM   Teacher Portal - LocalTunnel Starter
REM =========================================
REM 
REM This script starts both the backend server
REM and LocalTunnel tunnel automatically.
REM
REM Your app will be accessible at:
REM https://teacher-portal.loca.lt
REM =========================================

setlocal enabledelayedexpansion

echo.
echo =========================================
echo   Teacher Portal LocalTunnel Setup
echo =========================================
echo.

REM Check if LocalTunnel is installed
echo Checking for LocalTunnel installation...
npm list -g localtunnel >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] LocalTunnel not found!
    echo.
    echo Installing LocalTunnel globally...
    call npm install -g localtunnel
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install LocalTunnel
        echo Please run: npm install -g localtunnel
        pause
        exit /b 1
    )
    echo.
    echo [OK] LocalTunnel installed successfully!
)

echo [OK] LocalTunnel is installed
echo.

REM Start backend server
echo Starting backend server...
start "Teacher Portal Backend" cmd /k "cd backend && npm start"

echo [OK] Backend server started in new window
echo.

REM Wait for server to fully start
echo Waiting for server to initialize...
timeout /t 3 /nobreak

echo.
echo =========================================
echo   Starting LocalTunnel
echo =========================================
echo.
echo Your public URL will appear below:
echo.

REM Start LocalTunnel
lt --port 3000 --subdomain=teacher-portal

endlocal
pause
