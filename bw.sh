#!/usr/bin/env bash

set -e

VERSION="2.0.0"
URL="https://github.com/bitwarden/sdk-sm/releases/download/bws-v${VERSION}/bws-x86_64-apple-darwin-${VERSION}.zip"
BIN_DIR="$HOME/user/bin"
TMP_DIR="$(mktemp -d)"

echo "Creating bin directory..."
mkdir -p "$BIN_DIR"

echo "Downloading Bitwarden CLI..."
curl -L "$URL" -o "$TMP_DIR/bws.zip"

echo "Extracting..."
unzip -q "$TMP_DIR/bws.zip" -d "$TMP_DIR"

echo "Moving binary..."
mv "$TMP_DIR/bws" "$BIN_DIR/"
chmod +x "$BIN_DIR/bws"

echo "Cleaning up..."
rm -rf "$TMP_DIR"

echo "Adding to PATH if not already present..."

if ! echo "$PATH" | grep -q "$BIN_DIR"; then
  if [ -n "$ZSH_VERSION" ]; then
    echo 'export PATH="$HOME/user/bin:$PATH"' >> "$HOME/.zshrc"
    echo "Added to ~/.zshrc"
    source "$HOME/.zshrc"
  elif [ -n "$BASH_VERSION" ]; then
    echo 'export PATH="$HOME/user/bin:$PATH"' >> "$HOME/.bash_profile"
    echo "Added to ~/.bash_profile"
    source "$HOME/.bash_profile"
  fi
fi

echo "Installation complete."
echo "Testing..."
"$BIN_DIR/bws" --version
