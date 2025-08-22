#!/usr/bin/env bash
set -e

echo "🚀 Starting BuyerFirst dev environment..."

# Get the absolute path of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

# 1. Start Docker (db + mailpit)
echo "➡️  Starting Docker containers..."
(cd "$DOCKER_DIR" && docker compose up -d)

# 2. Sync Prisma schema
echo "➡️  Syncing Prisma schema..."
(cd "$PROJECT_DIR" && npm run prisma:db:push)

# 3. Start Next.js app in background
echo "➡️  Starting Next.js dev server..."
(cd "$PROJECT_DIR" && npm run dev &)
NEXT_PID=$!

# 4. Wait a few seconds for server boot
sleep 5

# 5. Auto-open browser tabs
echo "➡️  Opening browser tabs..."
if command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:3000" >/dev/null 2>&1 &
  xdg-open "http://localhost:8025" >/dev/null 2>&1 &
elif command -v open &> /dev/null; then
  open "http://localhost:3000"
  open "http://localhost:8025"
else
  echo "⚠️  Please open manually:"
  echo "   - http://localhost:3000"
  echo "   - http://localhost:8025"
fi

# Run Prisma Studio from the project root so it finds schema.prisma
(cd "$PROJECT_DIR" && npx prisma studio)

echo "✅ BuyerFirst dev environment is up."
echo "   Next.js PID: $NEXT_PID"
echo "   Run ./stop.sh to stop everything."