install wsl debian

# essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl build-essential ca-certificates gnupg git

# nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# node
nvm --version
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'
node -v
npm -v

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew --version

# pnpm
npm i -g pnpm
curl -fsSL https://bun.com/install | bash

# oxlayer
npx @oxlayer/create-backend --template base demo
cd demo

npm i -g @oxlayer/cli
ox login
ox install

# bitwarden

https://bitwarden.com/blog/how-to-securely-store-your-secrets-manager-access-tokens-with-bash-scripting/


sudo apt update
sudo apt install -y gnome-keyring libsecret-tools dbus-x11

printf "0.b2==" | secret-tool store --label="auth" BWS_ACCESS default

cat << 'EOF' >> ~/.bashrc

# Start DBus session if not running
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
  eval $(dbus-launch --sh-syntax)
fi

# Load Bitwarden token from secret-tool
export BWS_ACCESS_TOKEN=$(secret-tool lookup BWS_ACCESS default)

EOF

source ~/.bashrc

# project
pnpm dev