# AutoParts Setup Script
$ErrorActionPreference = "Stop"

$ProjectRoot  = "C:\Users\ghazi\Documents\AI_Workspace\02_Projects\Ghazi_Tools\DC_Ghazi_Tools\Claude_autoparts\autoparts-phase1"
$FrontendDir  = "$ProjectRoot\frontend"
$BackendDir   = "$ProjectRoot\backend"
$NodeDir      = "$env:USERPROFILE\tools\nodejs"
$FrontendPort = 5173
$BackendPort  = 8000
$AppURL       = "http://localhost:$FrontendPort"

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
if (-not (Test-Path $ProjectRoot)) {
    Write-Fail "Project not found at: $ProjectRoot"
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
    Write-Fail "Node.js not found. Please install it to $NodeDir"
    Read-Host "Press Enter to exit"
    exit 1
}

# 3. Python
Write-Step "Checking Python..."
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3") {
            $pythonCmd = $cmd
            Write-OK "Python: $ver"
            break
        }
    } catch { }
}
if (-not $pythonCmd) {
    Write-Fail "Python 3 not found."
    Read-Host "Press Enter to exit"
    exit 1
}

# 4. Frontend npm
Write-Step "Installing frontend packages..."
$nodeModules = "$FrontendDir\node_modules"
if (Test-Path $nodeModules) {
    Write-OK "node_modules already present"
} else {
    Push-Location $FrontendDir
    try {
        & npm install --prefer-offline 2>&1 | ForEach-Object { Write-Host "   $_" }
        Write-OK "Frontend packages installed"
    } catch {
        Write-Fail "npm install failed"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}

# 5. Backend pip
Write-Step "Installing backend packages..."
$uvicornCheck = & $pythonCmd -c "import uvicorn; print(uvicorn.__version__)" 2>&1
if ($uvicornCheck -match "^\d") {
    Write-OK "Backend packages already installed"
} else {
    Push-Location $BackendDir
    try {
        & $pythonCmd -m pip install -r requirements.txt --user --quiet 2>&1 | ForEach-Object { Write-Host "   $_" }
        Write-OK "Backend packages installed"
    } catch {
        Write-Fail "pip install failed"
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
}

# 6. Env files
Write-Step "Checking environment files..."
$backendEnv = "$BackendDir\.env"
if (-not (Test-Path $backendEnv)) {
    Copy-Item "$BackendDir\.env.example" $backendEnv
    Write-OK "Created backend/.env"
} else {
    Write-OK "backend/.env exists"
}

# 7. Launch backend
Write-Step "Starting FastAPI backend..."
$backendScript = "Set-Location '$BackendDir'; `$env:Path = '$NodeDir;' + `$env:Path; $pythonCmd -m uvicorn app.main:app --reload --port $BackendPort"
$backendEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($backendScript))
Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $backendEncoded -WindowStyle Normal
Write-OK "Backend window launched"

# 8. Wait backend
Write-Step "Waiting for backend..."
$maxWait = 20; $waited = 0; $ready = $false
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1; $waited++
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$BackendPort/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) { Write-OK "Backend is up!" } else { Write-Warn "Backend didn't respond in time" }

# 9. Launch frontend
Write-Step "Starting Vite frontend..."
$frontendScript = "Set-Location '$FrontendDir'; `$env:Path = '$NodeDir;' + `$env:Path; npm run dev"
$frontendEncoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($frontendScript))
Start-Process powershell -ArgumentList "-NoExit", "-EncodedCommand", $frontendEncoded -WindowStyle Normal
Write-OK "Frontend window launched"

# 10. Wait frontend
Write-Step "Waiting for frontend..."
$waited = 0; $ready = $false
while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 1; $waited++
    try {
        $resp = Invoke-WebRequest -Uri $AppURL -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
}
if ($ready) { Write-OK "Frontend is up!" } else { Write-Warn "Frontend didn't respond yet" }

# 11. Open browser
Write-Step "Opening browser..."
Start-Process $AppURL
Write-OK "Browser opened"

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "   AutoParts is running!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Yellow
Read-Host "Press Enter to close this setup window"