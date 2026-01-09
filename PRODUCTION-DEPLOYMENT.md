# Production Deployment Guide

This guide covers production deployment of the Basketball CRUD API & Dashboard using Docker Compose and Docker Swarm with comprehensive scaling and networking configuration.

## Overview

The production deployment supports:
- **Configurable port mappings** for flexible networking
- **Service scaling** with resource limits and health checks
- **Load balancing** with Nginx for high availability
- **Environment-specific configuration** for different deployment scenarios
- **Security best practices** with secrets management

## Quick Start

### Basic Production Deployment

```bash
# 1. Configure environment variables
cp .env.production .env.local
# Edit .env.local with your production values

# 2. Set required secrets
export SESSION_SECRET="your-secure-session-secret"
export JWT_SECRET="your-secure-jwt-secret"

# 3. Deploy with Docker Compose
./deploy-prod.sh deploy-compose

# 4. Check deployment status
./deploy-prod.sh status
```

### Docker Swarm Deployment (Recommended for Production)

```bash
# 1. Initialize Docker Swarm (if not already done)
docker swarm init

# 2. Deploy to swarm
./deploy-prod.sh deploy-swarm

# 3. Check service status
docker stack services basketball-prod
```

## Configuration

### Port Configuration

The production deployment supports flexible port mapping:

```bash
# API Service Ports
API_EXTERNAL_PORT=3000      # External port (host)
API_INTERNAL_PORT=3000      # Internal port (container)

# Frontend Service Ports
FRONTEND_EXTERNAL_PORT=80   # External port (host)
FRONTEND_INTERNAL_PORT=80   # Internal port (container)
```

### Scaling Configuration

Configure service replicas and resource limits:

```bash
# Service Replicas
API_REPLICAS=2              # Number of API service instances
FRONTEND_REPLICAS=2         # Number of frontend service instances
MONGO_REPLICAS=1            # Number of MongoDB instances (typically 1)

# API Resource Limits
API_CPU_LIMIT=1.0           # Maximum CPU usage
API_MEMORY_LIMIT=512M       # Maximum memory usage
API_CPU_RESERVATION=0.25    # Reserved CPU
API_MEMORY_RESERVATION=128M # Reserved memory

# Frontend Resource Limits
FRONTEND_CPU_LIMIT=0.5
FRONTEND_MEMORY_LIMIT=256M
FRONTEND_CPU_RESERVATION=0.1
FRONTEND_MEMORY_RESERVATION=64M
```

### Network Configuration

Customize Docker networking:

```bash
# Network Configuration
NETWORK_DRIVER=bridge                    # Network driver type
NETWORK_SUBNET=172.20.0.0/16            # Network subnet
NETWORK_GATEWAY=172.20.0.1              # Network gateway
NETWORK_MTU=1500                         # Maximum transmission unit
```

## Deployment Options

### 1. Standard Docker Compose

Best for single-host deployments:

```bash
# Deploy with default configuration
docker compose -f docker-compose.prod.yml up -d

# Deploy with custom environment file
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Scale services manually
docker compose -f docker-compose.prod.yml up -d --scale api=3 --scale frontend=2
```

### 2. Docker Swarm

Best for multi-host, high-availability deployments:

```bash
# Deploy stack
docker stack deploy -c docker-compose.prod.yml basketball-prod

# Scale services
docker service scale basketball-prod_api=3
docker service scale basketball-prod_frontend=2

# Update services
docker service update --image basketball-api:latest basketball-prod_api
```

### 3. Load Balanced Deployment

For high-traffic production environments:

```bash
# Deploy with load balancer
docker compose -f docker-compose.prod.yml -f docker-compose.prod.lb.yml up -d

# Configure SSL certificates (place in ./ssl directory)
mkdir -p ssl
# Copy your SSL certificates to ssl/
```

## Environment Variables

### Required Variables

```bash
# Security (MUST be set)
SESSION_SECRET=your-secure-session-secret-here
JWT_SECRET=your-secure-jwt-secret-here

# Database
MONGODB_URI=mongodb://mongo:27017/bb-db
DATABASE_NAME=bb-db

# API Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

### Optional Variables

```bash
# Scaling
API_REPLICAS=2
FRONTEND_REPLICAS=2
MONGO_REPLICAS=1

# Resource Limits
API_CPU_LIMIT=1.0
API_MEMORY_LIMIT=512M
FRONTEND_CPU_LIMIT=0.5
FRONTEND_MEMORY_LIMIT=256M

# Networking
API_EXTERNAL_PORT=3000
FRONTEND_EXTERNAL_PORT=80
NETWORK_SUBNET=172.20.0.0/16

# Health Checks
HEALTH_CHECK_INTERVAL=15s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
```

## Deployment Scripts

### deploy-prod.sh

Comprehensive deployment script with multiple commands:

```bash
# Deploy with Docker Compose
./deploy-prod.sh deploy-compose

# Deploy with Docker Swarm
./deploy-prod.sh deploy-swarm

# Check deployment status
./deploy-prod.sh status

# View service logs
./deploy-prod.sh logs api
./deploy-prod.sh logs frontend
./deploy-prod.sh logs mongo

# Stop services
./deploy-prod.sh stop

# Clean up unused resources
./deploy-prod.sh cleanup

# Validate configuration
./deploy-prod.sh validate
```

## Monitoring and Health Checks

### Service Health Checks

All services include comprehensive health checks:

- **API**: `GET /health` endpoint
- **Frontend**: Nginx status check
- **MongoDB**: Database ping command

### Monitoring Endpoints

```bash
# API Health
curl http://localhost:3000/health

# Frontend Health
curl http://localhost:80/health

# Load Balancer Status (if using load balancer)
curl http://localhost:8080/lb-health

# Nginx Status (if using load balancer)
curl http://localhost:8080/nginx-status
```

## Security Considerations

### Secrets Management

1. **Never commit secrets to version control**
2. **Use environment variables for secrets**
3. **Rotate secrets regularly**
4. **Use Docker secrets in Swarm mode**

```bash
# Docker Swarm secrets
echo "your-session-secret" | docker secret create session_secret -
echo "your-jwt-secret" | docker secret create jwt_secret -
```

### Network Security

1. **MongoDB is not exposed externally in production**
2. **Use HTTPS with proper SSL certificates**
3. **Configure firewall rules appropriately**
4. **Use private networks for service communication**

### Container Security

1. **Services run as non-root users**
2. **Images use Alpine Linux for minimal attack surface**
3. **Resource limits prevent resource exhaustion**
4. **Health checks ensure service availability**

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check logs
   ./deploy-prod.sh logs api
   
   # Check service status
   ./deploy-prod.sh status
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB logs
   ./deploy-prod.sh logs mongo
   
   # Verify network connectivity
   docker network ls
   docker network inspect basketball-prod_basketball-network
   ```

3. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Use different ports
   export API_EXTERNAL_PORT=3001
   ./deploy-prod.sh deploy-compose
   ```

4. **Resource constraints**
   ```bash
   # Check resource usage
   docker stats
   
   # Adjust resource limits in .env.production
   API_CPU_LIMIT=2.0
   API_MEMORY_LIMIT=1G
   ```

### Log Analysis

```bash
# View all service logs
docker compose -f docker-compose.prod.yml logs

# Follow logs in real-time
docker compose -f docker-compose.prod.yml logs -f

# Filter logs by service
docker compose -f docker-compose.prod.yml logs api

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec basketball-mongo-prod mongodump --db bb-db --out /backup

# Copy backup from container
docker cp basketball-mongo-prod:/backup ./backup-$(date +%Y%m%d)
```

### Service Recovery

```bash
# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# Recreate service
docker compose -f docker-compose.prod.yml up -d --force-recreate api

# Full stack restart
./deploy-prod.sh stop
./deploy-prod.sh deploy-compose
```

## Performance Optimization

### Resource Tuning

1. **Monitor resource usage**
2. **Adjust CPU and memory limits**
3. **Scale services based on load**
4. **Use SSD storage for database**

### Network Optimization

1. **Use appropriate MTU size**
2. **Configure connection pooling**
3. **Enable HTTP/2 for frontend**
4. **Use CDN for static assets**

## Maintenance

### Updates

```bash
# Update images
docker compose -f docker-compose.prod.yml pull

# Rolling update (Docker Swarm)
docker service update --image basketball-api:latest basketball-prod_api

# Zero-downtime update
docker compose -f docker-compose.prod.yml up -d --no-deps api
```

### Cleanup

```bash
# Remove unused resources
./deploy-prod.sh cleanup

# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

This production deployment configuration provides a robust, scalable, and secure foundation for running the Basketball CRUD API & Dashboard in production environments.