#!/usr/bin/env bash

set -e

echo "🚀 Starting macOS Dev Environment Setup..."

# -----------------------------------------
# 1️⃣ Xcode CLI Tools
# -----------------------------------------
if ! xcode-select -p &>/dev/null; then
  echo "📦 Installing Xcode CLI Tools..."
  xcode-select --install
  echo "⚠️  Please finish installation then re-run this script."
  exit 1
fi

# -----------------------------------------
# 2️⃣ Homebrew
# -----------------------------------------
if ! command -v brew &>/dev/null; then
  echo "🍺 Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

  if [[ -d "/opt/homebrew" ]]; then
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
  else
    echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

echo "🍺 Updating Homebrew..."
brew update

# -----------------------------------------
# 3️⃣ Essentials
# -----------------------------------------
echo "🔧 Installing base packages..."
brew install git curl

# -----------------------------------------
# 4️⃣ NVM
# -----------------------------------------
if [ ! -d "$HOME/.nvm" ]; then
  echo "🟢 Installing NVM..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "🟢 Installing Node LTS..."
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'

# -----------------------------------------
# 5️⃣ Global Node Tools
# -----------------------------------------
echo "📦 Installing pnpm..."
npm install -g pnpm

echo "⚡ Installing Bun..."
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  source ~/.zshrc || true
fi

# -----------------------------------------
# 6️⃣ Bitwarden CLI
# -----------------------------------------
echo "🔐 Installing Bitwarden CLI..."
brew install bitwarden-cli

# -----------------------------------------
# 7️⃣ OxLayer CLI
# -----------------------------------------
echo "🧠 Installing OxLayer CLI..."
npm install -g @oxlayer/cli


#
# Bitwarden Add Password to Keychain
security add-generic-password \
  -a "$USER" \
  -s "BWS_ACCESS" \
  -w "0.=="

# -----------------------------------------
# 8️⃣ Keychain helper
# -----------------------------------------
if ! grep -q "BWS_ACCESS_TOKEN" ~/.zshrc; then
cat << 'EOF' >> ~/.zshrc

# Load Bitwarden token from macOS Keychain
export BWS_ACCESS_TOKEN=$(security find-generic-password -a "$USER" -s "BWS_ACCESS" -w 2>/dev/null)

EOF
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1️⃣  Open a new terminal"
echo "2️⃣  Run: bw login"
echo "3️⃣  Store your token:"
echo ""
echo '   security add-generic-password -a "$USER" -s "BWS_ACCESS" -w "YOUR_TOKEN_HERE"'
echo ""
echo "4️⃣  Create project:"
echo ""
echo "   npx @oxlayer/create-backend --template base demo"
echo "   cd demo"
echo "   ox login"
echo "   ox install"
echo "   pnpm dev"
echo ""
echo "🔥 Your macOS dev machine is ready."
