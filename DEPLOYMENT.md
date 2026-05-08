# Deployment Guide - India Development Goals Dashboard

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Production Hardening](#production-hardening)
5. [Monitoring & Logging](#monitoring--logging)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Python 3.11+
- Git
- pip or conda

### Setup Steps

```bash
# Clone repository
git clone https://github.com/yourusername/Development_dashboard.git
cd Development_dashboard

# Create virtual environment
python -m venv venv

# Activate environment
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run application
streamlit run src/app.py
```

### Development Commands

```bash
# Run tests
pytest tests/ -v

# Run tests with coverage
pytest tests/ --cov=src --cov-report=html

# Code formatting
black src/

# Linting
flake8 src/

# Type checking
mypy src/ --ignore-missing-imports
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/Development_dashboard.git
cd Development_dashboard

# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker Directly

```bash
# Build image
docker build -t india-dev-dashboard:latest .

# Run container
docker run \
  -d \
  -p 8501:8501 \
  -e ENV=production \
  -e LOG_LEVEL=INFO \
  --name dashboard \
  india-dev-dashboard:latest

# View logs
docker logs -f dashboard

# Stop container
docker stop dashboard
docker rm dashboard
```

### Docker Network Setup

```bash
# Create network
docker network create dashboard-network

# Run with network
docker run \
  -d \
  -p 8501:8501 \
  --network dashboard-network \
  --name dashboard \
  india-dev-dashboard:latest
```

---

## Cloud Deployment

### AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name india-dev-dashboard

# Build and push image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t india-dev-dashboard:latest .
docker tag india-dev-dashboard:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/india-dev-dashboard:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/india-dev-dashboard:latest

# Create ECS task definition, service, etc.
# (Configure via AWS Console or CloudFormation)
```

### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/india-dev-dashboard

# Deploy
gcloud run deploy india-dev-dashboard \
  --image gcr.io/<project-id>/india-dev-dashboard \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --timeout 900 \
  --allow-unauthenticated
```

### Heroku

```bash
# Login
heroku login

# Create app
heroku create india-dev-dashboard

# Set buildpack
heroku buildpacks:set heroku/docker

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry <registry-name> --image india-dev-dashboard:latest .

# Deploy
az container create \
  --resource-group <group-name> \
  --name dashboard \
  --image <registry-name>.azurecr.io/india-dev-dashboard:latest \
  --ports 8501 \
  --cpu 1 \
  --memory 1
```

---

## Production Hardening

### Nginx Reverse Proxy

```nginx
upstream streamlit {
    server localhost:8501;
}

server {
    listen 443 ssl http2;
    server_name dashboard.example.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/dashboard.crt;
    ssl_certificate_key /etc/ssl/private/dashboard.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript;

    location / {
        proxy_pass http://streamlit;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name dashboard.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Environment Configuration

```bash
# Production .env
ENV=production
LOG_LEVEL=WARNING
DEBUG=false
STREAMLIT_SERVER_HEADLESS=true
STREAMLIT_SERVER_PORT=8501
STREAMLIT_SERVER_ADDRESS=127.0.0.1
STREAMLIT_SERVER_ENABLE_CORS=false
CACHE_ENABLED=true
DATA_CACHE_TIMEOUT=3600
```

### Systemd Service (Linux)

```ini
[Unit]
Description=India Development Dashboard
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/dashboard
Environment="PATH=/opt/dashboard/venv/bin"
ExecStart=/opt/dashboard/venv/bin/streamlit run src/app.py --server.port 8501
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable dashboard
sudo systemctl start dashboard
sudo systemctl status dashboard
```

---

## Monitoring & Logging

### Application Logging

```python
# Enable structured logging
import logging
import json
from python_json_logger import jsonlogger

logHandler = logging.FileHandler('app.log')
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

### Health Checks

```bash
# Check application health
curl -f http://localhost:8501/_stcore/health

# With logging
curl -v -f http://localhost:8501/_stcore/health 2>&1 | tee -a health_check.log
```

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'streamlit'
    static_configs:
      - targets: ['localhost:8501']
```

### Log Aggregation (ELK Stack)

```bash
# Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/dashboard/app.log

output.elasticsearch:
  hosts: ["localhost:9200"]
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8501
# Windows
netstat -ano | findstr :8501
taskkill /PID <PID> /F

# Linux
lsof -i :8501
kill -9 <PID>

# macOS
lsof -i :8501
kill -9 <PID>
```

### Memory Issues

```bash
# Monitor memory usage
docker stats dashboard

# Increase Docker memory limit
docker run -m 2g -d india-dev-dashboard:latest

# In docker-compose.yml
services:
  dashboard:
    mem_limit: 2g
```

### Data Loading Errors

```bash
# Check network connectivity
curl -I https://raw.githubusercontent.com/mrinalcs/india-literacy/master/india-districts-census-2011.csv

# Clear cache
rm assets/processed_data.csv
# Restart application
```

### SSL/TLS Issues

```bash
# Generate self-signed certificate (development only)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Verify certificate
openssl x509 -in cert.pem -text -noout
```

### Container Issues

```bash
# View container logs
docker logs -f <container-id>

# Inspect container
docker inspect <container-id>

# Debug shell
docker run -it india-dev-dashboard:latest /bin/bash

# Check resource usage
docker stats
```

---

## Performance Tuning

### Streamlit Configuration

```toml
# .streamlit/config.toml
[client]
showErrorDetails = false
toolbarMode = "minimal"

[logger]
level = "warning"

[server]
headless = true
runOnSave = true
maxUploadSize = 200
```

### Database Optimization

```python
# Connection pooling
from sqlalchemy.pool import QueuePool

engine = create_engine(
    'postgresql://...',
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40
)
```

### Caching Strategy

```python
# Increase cache size
@st.cache_data(ttl=3600)
def load_expensive_data():
    # Implementation
    pass
```

---

## Security Checklist

- [ ] HTTPS enabled with valid SSL/TLS certificate
- [ ] Security headers configured in reverse proxy
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] Secrets stored in environment variables
- [ ] Regular dependency updates
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] CORS properly configured
- [ ] Authentication enabled if required
- [ ] Audit logging enabled
- [ ] Regular backups configured
- [ ] Disaster recovery plan in place

---

## Support & Documentation

- **Documentation**: See [README.md](readme.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@example.com

For additional help, please refer to the main README or contact support.
