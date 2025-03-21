@echo off
echo Supabase CLI Installation Script
echo ===============================
echo.

REM Check if Supabase CLI is already installed
where supabase >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Supabase CLI is already installed.
    supabase --version
    goto :EOF
)

REM Check for available package managers
set "npm_available=0"
set "pnpm_available=0"
set "yarn_available=0"

where npm >nul 2>&1
if %ERRORLEVEL% == 0 set "npm_available=1"

where pnpm >nul 2>&1
if %ERRORLEVEL% == 0 set "pnpm_available=1"

where yarn >nul 2>&1
if %ERRORLEVEL% == 0 set "yarn_available=1"

set /a total_managers=%npm_available% + %pnpm_available% + %yarn_available%

if %total_managers% == 0 (
    echo No supported package manager (npm, pnpm, yarn) found.
    echo Please install one of these package managers first.
    goto :EOF
)

REM If multiple package managers are available, let the user choose
if %total_managers% GTR 1 (
    echo Multiple package managers detected. Please choose one:
    set /a counter=0
    if %npm_available% == 1 (
        echo [%counter%] npm
        set /a counter+=1
    )
    if %pnpm_available% == 1 (
        echo [%counter%] pnpm
        set /a counter+=1
    )
    if %yarn_available% == 1 (
        echo [%counter%] yarn
    )
    
    set /p choice="Enter the number of your choice: "
    
    set /a counter=0
    if %npm_available% == 1 (
        if %choice% == %counter% set "selected_manager=npm"
        set /a counter+=1
    )
    if %pnpm_available% == 1 (
        if %choice% == %counter% set "selected_manager=pnpm"
        set /a counter+=1
    )
    if %yarn_available% == 1 (
        if %choice% == %counter% set "selected_manager=yarn"
    )
) else (
    if %npm_available% == 1 set "selected_manager=npm"
    if %pnpm_available% == 1 set "selected_manager=pnpm"
    if %yarn_available% == 1 set "selected_manager=yarn"
    echo Using %selected_manager% to install Supabase CLI.
)

REM Install Supabase CLI using the selected package manager
echo Installing Supabase CLI using %selected_manager%...

if "%selected_manager%"=="npm" (
    npm install -g supabase
) else if "%selected_manager%"=="pnpm" (
    pnpm install -g supabase
) else if "%selected_manager%"=="yarn" (
    yarn global add supabase
)

if %ERRORLEVEL% == 0 (
    echo Supabase CLI installed successfully!
    supabase --version
) else (
    echo Failed to install Supabase CLI.
    goto :EOF
)

REM Verify installation
where supabase >nul 2>&1
if %ERRORLEVEL% == 0 (
    echo Supabase CLI is now available.
    echo.
    echo Next steps:
    echo 1. Run 'supabase login' to authenticate with your Supabase account
    echo 2. Run 'supabase init' in your project directory (if not already initialized)
    echo 3. Run 'supabase link --project-ref your-project-ref' to link to your remote project
    echo 4. Run the setup script: 'setup-turnitin-infrastructure.bat'
) else (
    echo Supabase CLI installation verification failed.
) 