# Multi-purpose Dockerfile: serves frontend (static) + backend API using Gunicorn
# Build: docker build -t lapor-desu .
# Run:   docker run -p 8080:5000 --env-file .env lapor-desu

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System packages (optional): uncomment if needed for specific libs
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential gcc \
#  && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install -r /app/backend/requirements.txt

# Copy project sources
COPY backend /app/backend
COPY frontend /app/frontend

# Expose port
EXPOSE 5000

# Use Gunicorn to serve Flask app (serves frontend as static via app configuration)
WORKDIR /app/backend
CMD ["gunicorn", "-w", "3", "-k", "gthread", "-b", "0.0.0.0:5000", "app:app"]
