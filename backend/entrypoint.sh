#!/usr/bin/env sh
# Apply database migrations, then start the API.
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting ShellCraft API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
