# PowerShell script to install Supabase CLI

Write-Host "Supabase CLI Installation Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) { return $true }
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Check if Supabase CLI is already installed
if (Test-CommandExists "supabase") {
    Write-Host "Supabase CLI is already installed." -ForegroundColor Green
    supabase --version
    exit 0
}

# Try to detect available package managers
$packageManagers = @()

if (Test-CommandExists "npm") {
    $packageManagers += "npm"
}

if (Test-CommandExists "pnpm") {
    $packageManagers += "pnpm"
}

if (Test-CommandExists "yarn") {
    $packageManagers += "yarn"
}

if ($packageManagers.Count -eq 0) {
    Write-Host "No supported package manager (npm, pnpm, yarn) found." -ForegroundColor Red
    Write-Host "Please install one of these package managers first." -ForegroundColor Red
    exit 1
}

# If multiple package managers are available, let the user choose
if ($packageManagers.Count -gt 1) {
    Write-Host "Multiple package managers detected. Please choose one:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $packageManagers.Count; $i++) {
        Write-Host "[$i] $($packageManagers[$i])"
    }
    
    $choice = Read-Host "Enter the number of your choice"
    $selectedManager = $packageManagers[$choice]
} else {
    $selectedManager = $packageManagers[0]
    Write-Host "Using $selectedManager to install Supabase CLI." -ForegroundColor Yellow
}

# Install Supabase CLI using the selected package manager
Write-Host "Installing Supabase CLI using $selectedManager..." -ForegroundColor Cyan

try {
    switch ($selectedManager) {
        "npm" {
            npm install -g supabase
        }
        "pnpm" {
            pnpm install -g supabase
        }
        "yarn" {
            yarn global add supabase
        }
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
        supabase --version
    } else {
        Write-Host "Failed to install Supabase CLI." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "An error occurred during installation: $_" -ForegroundColor Red
    exit 1
}

# Verify installation
if (Test-CommandExists "supabase") {
    Write-Host "Supabase CLI is now available." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run 'supabase login' to authenticate with your Supabase account" -ForegroundColor White
    Write-Host "2. Run 'supabase init' in your project directory (if not already initialized)" -ForegroundColor White
    Write-Host "3. Run 'supabase link --project-ref your-project-ref' to link to your remote project" -ForegroundColor White
    Write-Host "4. Run the setup script: '.\setup-turnitin-infrastructure.ps1'" -ForegroundColor White
} else {
    Write-Host "Supabase CLI installation verification failed." -ForegroundColor Red
    exit 1
} 