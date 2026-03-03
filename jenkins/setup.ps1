# =============================================================================
# FarmDirect — Jenkins + Terraform Setup Script
# Run: powershell -ExecutionPolicy Bypass -File jenkins\setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n=== FarmDirect Local CI/CD Setup ===" -ForegroundColor Cyan

# ─── 1. Download Jenkins WAR ─────────────────────────────────────────────────
$JenkinsVersion = "2.462.3"
$JenkinsWar     = Join-Path $ScriptDir "jenkins.war"

if (Test-Path $JenkinsWar) {
    Write-Host "[OK] Jenkins WAR already downloaded." -ForegroundColor Green
} else {
    Write-Host "[1/3] Downloading Jenkins LTS $JenkinsVersion ..." -ForegroundColor Yellow
    $JenkinsUrl = "https://get.jenkins.io/war-stable/$JenkinsVersion/jenkins.war"
    Invoke-WebRequest -Uri $JenkinsUrl -OutFile $JenkinsWar -UseBasicParsing
    Write-Host "[OK] Jenkins WAR downloaded to $JenkinsWar" -ForegroundColor Green
}

# ─── 2. Download Terraform ───────────────────────────────────────────────────
$TerraformVersion = "1.9.8"
$ToolsDir         = Join-Path $ScriptDir "tools"
$TerraformExe     = Join-Path $ToolsDir "terraform.exe"

if (Test-Path $TerraformExe) {
    Write-Host "[OK] Terraform already downloaded." -ForegroundColor Green
} else {
    Write-Host "[2/3] Downloading Terraform $TerraformVersion ..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
    $TfZip = Join-Path $ToolsDir "terraform.zip"
    $TfUrl = "https://releases.hashicorp.com/terraform/$TerraformVersion/terraform_${TerraformVersion}_windows_amd64.zip"
    Invoke-WebRequest -Uri $TfUrl -OutFile $TfZip -UseBasicParsing
    Expand-Archive -Path $TfZip -DestinationPath $ToolsDir -Force
    Remove-Item $TfZip
    Write-Host "[OK] Terraform extracted to $TerraformExe" -ForegroundColor Green
}

# ─── 3. Create Jenkins home directory ────────────────────────────────────────
$JenkinsHome = Join-Path $ScriptDir "home"
if (!(Test-Path $JenkinsHome)) {
    New-Item -ItemType Directory -Force -Path $JenkinsHome | Out-Null
    Write-Host "[OK] Created Jenkins home at $JenkinsHome" -ForegroundColor Green
}

# ─── 4. Docker Desktop check ────────────────────────────────────────────────
Write-Host "`n[3/3] Checking Docker Desktop ..." -ForegroundColor Yellow
$DockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $DockerPath) {
    Write-Host "[OK] Docker Desktop found." -ForegroundColor Green
} else {
    Write-Host @"

  [ACTION REQUIRED] Docker Desktop is NOT installed.
  You need it to build and push container images.

  Download from: https://docs.docker.com/desktop/install/windows-install/
  After install, restart your PC and start Docker Desktop.

"@ -ForegroundColor Red
}

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host @"

  Tools installed:
    Jenkins WAR : $JenkinsWar
    Terraform   : $TerraformExe
    Jenkins Home: $JenkinsHome

  Next steps:
    1. Install Docker Desktop (if not already installed)
    2. Start Jenkins:  jenkins\start.bat
    3. Open http://localhost:8080 in your browser
    4. Get initial admin password from: jenkins\home\secrets\initialAdminPassword
    5. Install suggested plugins + Pipeline plugin
    6. Configure AWS credentials in Jenkins:
       - Go to Manage Jenkins > Credentials > System > Global
       - Add 'AWS_ACCESS_KEY_ID' (Secret text)
       - Add 'AWS_SECRET_ACCESS_KEY' (Secret text)
    7. Create a Pipeline job pointing to your Git repository
    8. First run: check 'PROVISION_INFRA' to create AWS resources

"@ -ForegroundColor White
