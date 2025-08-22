#!/usr/bin/env bash
set -Eeuo pipefail

echo "💣 Hard reset (containers, volumes, caches, prisma client)..."

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

"$SCRIPT_DIR/stop.sh" || true

echo "➡️  Removing containers and volumes..."
( cd "$PROJECT_DIR" && docker compose down -v )

echo "➡️  Cleaning local build + prisma caches..."
rm -rf "$PROJECT_DIR/.next" \
       "$PROJECT_DIR/node_modules/.prisma" \
       "$PROJECT_DIR/prisma/dev.db-journal" 2>/dev/null || true

echo "➡️  Fresh install + generate..."
( cd "$PROJECT_DIR" && npm i && npx prisma generate )

echo "➡️  Recreate DB & apply schema (will wipe data!)"
( cd "$PROJECT_DIR" && npx prisma migrate reset --force --skip-seed || npx prisma db push )

echo "✅ Reset complete. Run ./start.sh"