FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    postgresql-dev \
    netcat-openbsd \
    curl \
    bash

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .
RUN chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/ || exit 1

# Command to run the application with migrations
CMD ["/app/start.sh"] 