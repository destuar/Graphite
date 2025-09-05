#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

# Ensure child processes are cleaned up on exit or Ctrl+C
cleanup() {
  echo "[INFO] Shutting down..."
  set +e
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    # Kill entire process group to ensure watchers/children exit
    kill -TERM "-$(printf %d "$BACKEND_PID")" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    # Kill entire process group to ensure watchers/children exit
    kill -TERM "-$(printf %d "$FRONTEND_PID")" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup INT TERM EXIT

# Kill any process currently listening on a port
free_port() {
  port="$1"
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "[WARN] Port $port is in use by PID(s): $pids. Attempting to stop..."
    kill $pids 2>/dev/null || true
    sleep 0.3
    pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
    if [ -n "$pids" ]; then
      echo "[WARN] Forcing stop on PID(s): $pids"
      kill -9 $pids 2>/dev/null || true
      sleep 0.1
    fi
    echo "[INFO] Port $port is now free"
  fi
}

# Prefer project venv Python if available
PYTHON_BIN="python3"
if [ -x "$BACKEND_DIR/venv/bin/python" ]; then
  PYTHON_BIN="$BACKEND_DIR/venv/bin/python"
  export PATH="$BACKEND_DIR/venv/bin:$PATH"
fi

# Ensure Prisma Python uses recursive types as recommended
SCHEMA_FILE="$BACKEND_DIR/prisma/schema.prisma"
if [ -f "$SCHEMA_FILE" ]; then
  if ! grep -q "recursive_type_depth" "$SCHEMA_FILE"; then
    echo "[INFO] Enabling Prisma recursive types (recursive_type_depth=-1)"
    tmpfile="$(mktemp)"
    awk '
      BEGIN { in_gen=0; inserted=0 }
      /generator[[:space:]]+client[[:space:]]*\{/ { in_gen=1 }
      in_gen && /recursive_type_depth/ { inserted=1 }
      { print }
      in_gen && /provider[[:space:]]*=[[:space:]]*"prisma-client-py"/ && !inserted { print "  recursive_type_depth = -1"; inserted=1 }
      in_gen && /\}/ { in_gen=0 }
    ' "$SCHEMA_FILE" > "$tmpfile" && mv "$tmpfile" "$SCHEMA_FILE"
  fi
fi

echo "[INFO] Generating Prisma client"
cd "$BACKEND_DIR"
"$PYTHON_BIN" -m prisma generate

free_port "$BACKEND_PORT"
echo "[INFO] Starting backend on port $BACKEND_PORT"
"$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
BACKEND_PID=$!

free_port "$FRONTEND_PORT"
echo "[INFO] Starting frontend on port $FRONTEND_PORT"
cd "$FRONTEND_DIR"
# Run Vite directly to avoid duplicate --port flags from package.json
npm exec vite -- --port "$FRONTEND_PORT" --host 0.0.0.0 --strictPort &
FRONTEND_PID=$!

echo "[INFO] Backend PID: $BACKEND_PID"
echo "[INFO] Frontend PID: $FRONTEND_PID"

wait
