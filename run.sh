#!/usr/bin/env bash
#
# ShellCraft one-command bootstrap.
#
# Prefers Docker (reproducible clean run); falls back to a local npm dev server.
#
#   ./run.sh           # auto: docker if available, else npm
#   ./run.sh docker    # force docker compose
#   ./run.sh local     # force local npm dev server
#
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-auto}"

run_docker() {
  echo "▶ Starting ShellCraft with Docker → http://localhost:4200"
  docker compose up --build
}

run_local() {
  echo "▶ Starting ShellCraft locally → http://localhost:4200"
  cd frontend
  npm install
  npm start
}

case "$MODE" in
  docker) run_docker ;;
  local) run_local ;;
  auto)
    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
      run_docker
    else
      echo "Docker not found — falling back to a local npm dev server."
      run_local
    fi
    ;;
  *)
    echo "Usage: ./run.sh [auto|docker|local]" >&2
    exit 1
    ;;
esac
