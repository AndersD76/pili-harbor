#!/bin/sh

# Start Next.js on internal port 3000
cd /app/frontend && PORT=3000 node server.js &

# Start FastAPI on the Railway PORT (public)
cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
