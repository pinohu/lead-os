#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info  { param($Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Cyan }
function Write-Ok    { param($Msg) Write-Host "[OK]    $Msg" -ForegroundColor Green }
function Write-Warn  { param($Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Fail  { param($Msg) Write-Host "[FAIL]  $Msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  Lead OS - Setup Wizard" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
Write-Host ""

# --------------------------------------------------
# Prerequisites
# --------------------------------------------------
Write-Info "Checking prerequisites..."

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Fail "Node.js is not installed. Install Node.js 22+ from https://nodejs.org"
}

$nodeVersion = (node -v) -replace '^v', ''
$nodeMajor = [int]($nodeVersion -split '\.')[0]
if ($nodeMajor -lt 22) {
    Write-Fail "Node.js 22+ required (found v$nodeVersion)"
}
Write-Ok "Node.js v$nodeVersion"

$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmPath) {
    Write-Fail "npm is not installed"
}
$npmVersion = npm -v
Write-Ok "npm $npmVersion"

# --------------------------------------------------
# Environment file
# --------------------------------------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (Test-Path ".env") {
    Write-Warn ".env already exists - skipping copy"
} elseif (Test-Path ".env.sample") {
    Copy-Item ".env.sample" ".env"
    Write-Ok "Copied .env.sample to .env"
} else {
    New-Item -Path ".env" -ItemType File | Out-Null
    Write-Ok "Created empty .env"
}

# --------------------------------------------------
# Prompt for variables
# --------------------------------------------------
Write-Host ""
Write-Host "Configure essential environment variables:" -ForegroundColor White
Write-Host ""

function Set-EnvVar {
    param([string]$Key, [string]$Value)
    $content = if (Test-Path ".env") { Get-Content ".env" | Where-Object { $_ -notmatch "^$Key=" } } else { @() }
    $content += "$Key=$Value"
    $content | Set-Content ".env"
}

$dbUrl = Read-Host "1/5  LEAD_OS_DATABASE_URL [skip for in-memory mode]"
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
    Write-Warn "No database URL - app will use in-memory mode"
} else {
    Set-EnvVar "LEAD_OS_DATABASE_URL" $dbUrl
    Write-Ok "Database URL set"
}

$tenantId = Read-Host "2/5  LEAD_OS_TENANT_ID [my-tenant]"
if ([string]::IsNullOrWhiteSpace($tenantId)) { $tenantId = "my-tenant" }
Set-EnvVar "LEAD_OS_TENANT_ID" $tenantId
Write-Ok "Tenant ID: $tenantId"

$brand = Read-Host "3/5  NEXT_PUBLIC_BRAND_NAME [My Brand]"
if ([string]::IsNullOrWhiteSpace($brand)) { $brand = "My Brand" }
Set-EnvVar "NEXT_PUBLIC_BRAND_NAME" $brand
Write-Ok "Brand name: $brand"

$siteUrl = Read-Host "4/5  NEXT_PUBLIC_SITE_URL [http://localhost:3000]"
if ([string]::IsNullOrWhiteSpace($siteUrl)) { $siteUrl = "http://localhost:3000" }
Set-EnvVar "NEXT_PUBLIC_SITE_URL" $siteUrl
Write-Ok "Site URL: $siteUrl"

$supportEmail = Read-Host "5/5  NEXT_PUBLIC_SUPPORT_EMAIL"
if (-not [string]::IsNullOrWhiteSpace($supportEmail)) {
    Set-EnvVar "NEXT_PUBLIC_SUPPORT_EMAIL" $supportEmail
    Write-Ok "Support email: $supportEmail"
} else {
    Write-Warn "No support email provided - you can set it later in .env"
}

# --------------------------------------------------
# Install & Build
# --------------------------------------------------
Write-Host ""
Write-Info "Installing dependencies..."
npm install
Write-Ok "Dependencies installed"

Write-Info "Building application..."
npm run build
Write-Ok "Build complete"

# --------------------------------------------------
# Done
# --------------------------------------------------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Start development:  " -NoNewline; Write-Host "npm run dev" -ForegroundColor Cyan
Write-Host "  Start production:   " -NoNewline; Write-Host "npm run start" -ForegroundColor Cyan
Write-Host "  Run tests:          " -NoNewline; Write-Host "npm test" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Edit " -NoNewline; Write-Host ".env" -ForegroundColor Cyan -NoNewline; Write-Host " to update configuration."
Write-Host ""
