FROM node:20-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
ENV NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_WS_URL=""
RUN npm run build

FROM python:3.12-slim

# Install Node.js for Next.js standalone server
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy Next.js standalone build
COPY --from=frontend-build /frontend/.next/standalone ./frontend/
COPY --from=frontend-build /frontend/.next/static ./frontend/.next/static
COPY --from=frontend-build /frontend/public ./frontend/public

# Start script
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
