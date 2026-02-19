#!/usr/bin/env powershell

# =========================================
# Teacher Portal - LocalTunnel Starter
# PowerShell Version
# =========================================
#
# Run this script to start both the backend
# server and LocalTunnel tunnel automatically.
#
# Usage: 
# 1. Right-click this file
# 2. Select "Run with PowerShell"
# OR
# 3. Open PowerShell and run:
#    .\start-with-tunnel.ps1
#
# =========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Teacher Portal LocalTunnel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if LocalTunnel is installed
Write-Host "Checking for LocalTunnel installation..." -ForegroundColor Yellow

$ltInstalled = npm list -g localtunnel 2>$null | Select-String "localtunnel"

if (-not $ltInstalled) {
    Write-Host ""
    Write-Host "[!] LocalTunnel not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing LocalTunnel globally..." -ForegroundColor Yellow
    
    npm install -g localtunnel
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Failed to install LocalTunnel" -ForegroundColor Red
        Write-Host "Please run: npm install -g localtunnel" -ForegroundColor Red
        pause
        exit 1
    }
    
    Write-Host ""
    Write-Host "[OK] LocalTunnel installed successfully!" -ForegroundColor Green
}

Write-Host "[OK] LocalTunnel is installed" -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location "backend"
    npm start
}

Write-Host "[OK] Backend server started in background job (ID: $($backendJob.Id))" -ForegroundColor Green
Write-Host ""

# Wait for server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting LocalTunnel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your public URL will appear below:" -ForegroundColor Cyan
Write-Host ""

# Start LocalTunnel
lt --port 3000 --subdomain=teacher-portal

# Cleanup on exit
Write-Host ""
Write-Host "LocalTunnel stopped. Cleaning up..." -ForegroundColor Yellow
Stop-Job -Job $backendJob -Force
Remove-Job -Job $backendJob

Write-Host "Done!" -ForegroundColor Green
