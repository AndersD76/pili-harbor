FROM node:20-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_WS_URL=""
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /frontend/out ./frontend/out/

WORKDIR /app/backend

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
