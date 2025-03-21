#!/bin/bash
# Shell script to install Supabase CLI

echo -e "\033[1;36mSupabase CLI Installation Script\033[0m"
echo -e "\033[1;36m===============================\033[0m"
echo ""

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Supabase CLI is already installed
if command_exists supabase; then
  echo -e "\033[1;32mSupabase CLI is already installed.\033[0m"
  supabase --version
  exit 0
fi

# Try to detect available package managers
package_managers=()

if command_exists npm; then
  package_managers+=("npm")
fi

if command_exists pnpm; then
  package_managers+=("pnpm")
fi

if command_exists yarn; then
  package_managers+=("yarn")
fi

if [ ${#package_managers[@]} -eq 0 ]; then
  echo -e "\033[1;31mNo supported package manager (npm, pnpm, yarn) found.\033[0m"
  echo -e "\033[1;31mPlease install one of these package managers first.\033[0m"
  exit 1
fi

# If multiple package managers are available, let the user choose
if [ ${#package_managers[@]} -gt 1 ]; then
  echo -e "\033[1;33mMultiple package managers detected. Please choose one:\033[0m"
  for i in "${!package_managers[@]}"; do
    echo "[$i] ${package_managers[$i]}"
  done
  
  read -p "Enter the number of your choice: " choice
  selected_manager=${package_managers[$choice]}
else
  selected_manager=${package_managers[0]}
  echo -e "\033[1;33mUsing $selected_manager to install Supabase CLI.\033[0m"
fi

# Install Supabase CLI using the selected package manager
echo -e "\033[1;36mInstalling Supabase CLI using $selected_manager...\033[0m"

case $selected_manager in
  "npm")
    npm install -g supabase
    ;;
  "pnpm")
    pnpm install -g supabase
    ;;
  "yarn")
    yarn global add supabase
    ;;
esac

if [ $? -eq 0 ]; then
  echo -e "\033[1;32mSupabase CLI installed successfully!\033[0m"
  supabase --version
else
  echo -e "\033[1;31mFailed to install Supabase CLI.\033[0m"
  exit 1
fi

# Verify installation
if command_exists supabase; then
  echo -e "\033[1;32mSupabase CLI is now available.\033[0m"
  echo ""
  echo -e "\033[1;36mNext steps:\033[0m"
  echo -e "1. Run 'supabase login' to authenticate with your Supabase account"
  echo -e "2. Run 'supabase init' in your project directory (if not already initialized)"
  echo -e "3. Run 'supabase link --project-ref your-project-ref' to link to your remote project"
  echo -e "4. Run the setup script: './setup-turnitin-infrastructure.sh'"
else
  echo -e "\033[1;31mSupabase CLI installation verification failed.\033[0m"
  exit 1
fi 