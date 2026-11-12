# AutoParts Setup Script
$ErrorActionPreference = "Stop"

$ProjectRoot  = $PSScriptRoot
$NodeDir      = "$env:USERPROFILE\tools\nodejs"
$FrontendPort = 5173
$AppURL       = "http://127.0.0.1:$FrontendPort"

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-OK($msg) { Write-Host "   OK: $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   WARN: $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "   FAIL: $msg" -ForegroundColor Red }

Clear-Host
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   AutoParts Setup" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

# 1. Check folder
Write-Step "Checking project folder..."
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    Write-Fail "package.json not found at: $ProjectRoot"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-OK "Project found"

# 2. Node.js
Write-Step "Checking Node.js..."
$nodeExe = "$NodeDir\node.exe"
if (Test-Path $nodeExe) {
    if ($env:Path -notlike "*$NodeDir*") {
        $env:Path = "$NodeDir;$env:Path"
    }
}
try {
    $nodeVersion = & node --version 2>&1
    Write-OK "Node.js: $nodeVersion"
} catch {
    Write-Fail "Node.js not found. Install Node.js 18+ first."
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Install packages
Write-Step "Installing packages..."
$nodeModules = Join-Path $ProjectRoot "node_modules"
if (Test-Path $nodeModules) {
    Write-OK "node_modules already present"
} else {
    Push-Location $ProjectRoot
    try {
        & npm install --prefer-offline 2>&1 | ForEach-Object { Write-Host "   $_" }
        Write-OK "Packages installed"
    } catch {
        Write-Fail "npm install failed"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}

# 4. Launch frontend
Write-Step "Starting Vite frontend..."
$frontendScript = "Set-Location '$ProjectRoot'; `$env:Path = '$NodeDir;' + `$env:Path; npm run dev -- --host 127.0.0.1"
$frontendEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($frontendScript))
Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $frontendEncoded -WindowStyle Normal
Write-OK "Frontend window launched"

# 5. Wait for frontend
Write-Step "Waiting for frontend..."
$maxWait = 20; $waited = 0; $ready = $false
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1; $waited++
    try {
        $resp = Invoke-WebRequest -Uri $AppURL -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) { Write-OK "Frontend is up!" } else { Write-Warn "Frontend didn't respond yet" }

# 6. Open browser
Write-Step "Opening browser..."
Start-Process $AppURL
Write-OK "Browser opened"

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "   AutoParts is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Read-Host "Press Enter to close this setup window"