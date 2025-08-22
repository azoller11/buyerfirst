#!/usr/bin/env bash
set -Eeuo pipefail

echo "🛑 Stopping BuyerFirst dev environment..."

PROJECT_DIR="$(dirname "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )")"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PID_DIR="$SCRIPT_DIR/.dev/pids"
mkdir -p "$PID_DIR"

rm -rf "$PROJECT_DIR/node_modules/.prisma/client"

kill_if_running() {
  local name="$1"
  local pid_file="$PID_DIR/$2"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"
    if ps -p "$pid" >/dev/null 2>&1; then
      echo "➡️  Killing $name (pid $pid)..."
      kill "$pid" || true
      sleep 1
      if ps -p "$pid" >/dev/null 2>&1; then
        echo "   (force killing $name)"
        kill -9 "$pid" || true
      fi
    fi
    rm -f "$pid_file"
  else
    echo "ℹ️  No PID file for $name; checking by port as fallback..."
  fi
}

# Try PID-based first
kill_if_running "Next.js" "next.pid"
kill_if_running "Prisma Studio" "prisma_studio.pid"

# Fallback by port (in case PID files are stale)
for port in 3000 5555; do
  if lsof -ti :"$port" &>/dev/null; then
    echo "➡️  Killing process on port $port..."
    kill -9 $(lsof -ti :"$port") || true
  fi
done

# Stop Docker
echo "➡️  Stopping Docker containers..."
( cd "$PROJECT_DIR" && docker compose down )

echo "✅ All services stopped."