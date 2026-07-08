#!/usr/bin/env sh

set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "Channel Targeting Agent requires a working Node.js 20+ runtime." >&2
  echo "Install the current Node.js LTS from https://nodejs.org/en/download, reopen your terminal, then rerun this preflight check." >&2
  exit 1
fi

node_version="$(node --version 2>/dev/null || true)"
node_major="${node_version#v}"
node_major="${node_major%%.*}"

case "$node_major" in
  ''|*[!0-9]*)
    echo "Could not determine the installed Node.js version ($node_version)." >&2
    echo "Install the current Node.js LTS from https://nodejs.org/en/download, then rerun this preflight check." >&2
    exit 1
    ;;
esac

if [ "$node_major" -lt 20 ]; then
  echo "Node.js $node_version is installed, but Channel Targeting Agent requires Node.js 20 or newer." >&2
  echo "Install or activate Node.js 20+ from https://nodejs.org/en/download, then rerun this preflight check." >&2
  exit 1
fi

echo "Node.js $node_version detected."
if command -v npm >/dev/null 2>&1; then
  echo "npm $(npm --version) detected. Run: npm ci, then npm test"
else
  echo "npm is not available. Core report commands can run only when dependencies are already installed."
  echo "Full source ingestion requires npm ci before running tests or provider extraction."
fi
