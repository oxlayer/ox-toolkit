#!/bin/bash
# OxLayer Development Runner
# Loads secrets from Bitwarden and runs pnpm dev

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

# Check if bw (Bitwarden CLI) is available
if command -v bw &> /dev/null; then
    echo "🔐 Loading secrets from Bitwarden..."

    # Check if session exists, if not try to unlock
    if [ -z "$BW_SESSION" ]; then
        # Try to get session from environment file if it exists
        if [ -f "$ENV_FILE" ]; then
            export BW_SESSION=$(grep "^BW_SESSION=" "$ENV_FILE" | cut -d'"' -f2)
        fi
    fi

    # Run with Bitwarden secrets injection
    bw run --env-file "$ENV_FILE" -- pnpm dev "$@"
else
    echo "⚠️  Bitwarden CLI not found, running without secrets injection"
    echo "   Install: npm install -g @bitwarden/cli"

    # Load .env file manually and run
    if [ -f "$ENV_FILE" ]; then
        set -a
        source "$ENV_FILE"
        set +a
    fi

    pnpm dev "$@"
fi
