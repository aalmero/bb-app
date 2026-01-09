# Docker Troubleshooting Guide

This guide helps resolve common Docker issues encountered while developing and deploying the Basketball CRUD API & Dashboard.

## Quick Diagnostics

### Check System Status
```bash
# Check Docker daemon status
docker version
docker info

# Check container status
docker ps -a
docker-compose ps

# Check resource usage
docker system df
docker stats --no-stream
```

### Check Service Health
```bash
# Test API connectivity
curl http://localhost:3000/health
curl http://localhost:3000/api-docs

# Test frontend connectivity
curl http://localhost:3001

# Test database connectivity
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

## Common Issues and Solutions

### 1. Port Already in Use

**Symptoms:**
- Error: "Port 3000 is already allocated"
- Error: "bind: address already in use"

**Solutions:**
```bash
# Find process using the port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill the process
kill -9 <PID>

# Or use different ports in docker-compose.yml
ports:
  - "3002:3000"  # Map to different host port
```

### 2. Container Won't Start

**Symptoms:**
- Container exits immediately
- "Exited (1)" or "Exited (125)" status

**Diagnosis:**
```bash
# Check container logs
docker-compose logs <service_name>
docker logs <container_id>

# Check container configuration
docker inspect <container_id>

# Try running container interactively
docker run -it <image_name> /bin/sh
```

**Common Fixes:**
```bash
# Rebuild containers
docker-compose build --no-cache

# Remove and recreate containers
docker-compose down
docker-compose up --force-recreate

# Check file permissions
ls -la ./
chmod +x ./docker-*.sh
```

### 3. Database Connection Issues

**Symptoms:**
- "MongoNetworkError: failed to connect to server"
- API can't connect to MongoDB

**Solutions:**
```bash
# Check MongoDB container status
docker-compose logs mongodb

# Verify network connectivity
docker-compose exec api ping mongodb

# Check MongoDB is ready
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"

# Restart with dependency order
docker-compose down
docker-compose up mongodb
# Wait for MongoDB to be ready, then:
docker-compose up api frontend
```

### 4. Hot Reload Not Working

**Symptoms:**
- Code changes don't trigger restart
- Need to manually restart containers

**Solutions:**
```bash
# Check volume mounts
docker-compose config

# Verify file watching (Linux/WSL)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# For macOS, ensure proper volume mounting
# In docker-compose.yml:
volumes:
  - .:/app
  - /app/node_modules  # Prevent node_modules override
```

### 5. Build Failures

**Symptoms:**
- "npm install" fails in container
- "No such file or directory" errors

**Solutions:**
```bash
# Clear Docker build cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -f Dockerfile.dev.api -t test-build .

# Verify file exists and permissions
ls -la Dockerfile.dev.api
chmod 644 Dockerfile.dev.api
```

### 6. Performance Issues

**Symptoms:**
- Slow container startup
- High CPU/memory usage
- Slow file operations

**Diagnosis:**
```bash
# Monitor resource usage
docker stats

# Check disk usage
docker system df

# Profile container performance
docker-compose exec api top
```

**Solutions:**
```bash
# Clean up unused resources
./docker-cleanup.sh deep

# Optimize Docker settings (macOS/Windows)
# Increase Docker Desktop resources:
# - CPU: 4+ cores
# - Memory: 4+ GB
# - Disk: Enable file sharing optimization

# Use .dockerignore to exclude unnecessary files
echo "node_modules" >> .dockerignore
echo ".git" >> .dockerignore
echo "*.log" >> .dockerignore
```

### 7. Environment Variable Issues

**Symptoms:**
- "Environment variable not set" errors
- Wrong configuration values

**Solutions:**
```bash
# Check environment files exist
ls -la .env*

# Verify environment variables in container
docker-compose exec api env | grep NODE_ENV
docker-compose exec api env | grep MONGODB_URI

# Recreate environment files
./docker-env.sh setup development

# Check docker-compose environment section
docker-compose config
```

### 8. Network Connectivity Issues

**Symptoms:**
- Services can't communicate
- "Connection refused" errors

**Solutions:**
```bash
# Check Docker networks
docker network ls
docker network inspect basketball-crud_default

# Test service-to-service connectivity
docker-compose exec api ping mongodb
docker-compose exec frontend ping api

# Recreate network
docker-compose down
docker network prune
docker-compose up
```

### 9. Volume and Data Persistence Issues

**Symptoms:**
- Database data lost after restart
- File changes not persisting

**Solutions:**
```bash
# Check volume status
docker volume ls
docker volume inspect basketball-crud_mongodb_data

# Backup and restore data
docker-compose exec mongodb mongodump --out /data/backup
docker cp <container_id>:/data/backup ./backup

# Recreate volumes if corrupted
docker-compose down -v
docker volume prune
docker-compose up
```

### 10. Production Deployment Issues

**Symptoms:**
- Production images too large
- Health checks failing
- Nginx configuration errors

**Solutions:**
```bash
# Check image sizes
docker images | grep basketball

# Test production build locally
docker-compose -f docker-compose.prod.yml up

# Check health endpoints
curl -f http://localhost:3000/health
curl -f http://localhost:80/

# Verify Nginx configuration
docker-compose exec frontend nginx -t
```

## Advanced Debugging

### Container Shell Access
```bash
# Access running container
docker-compose exec api bash
docker-compose exec frontend sh
docker-compose exec mongodb mongosh

# Access stopped container
docker run -it --rm <image_name> bash
```

### Log Analysis
```bash
# Follow logs in real-time
docker-compose logs -f

# Search logs for errors
docker-compose logs | grep -i error
docker-compose logs api | grep -i "mongodb"

# Export logs for analysis
docker-compose logs > docker-logs.txt
```

### Network Debugging
```bash
# Test internal connectivity
docker-compose exec api curl http://mongodb:27017
docker-compose exec frontend curl http://api:3000/health

# Check port bindings
docker port <container_name>

# Inspect network configuration
docker network inspect basketball-crud_default
```

## Prevention Tips

### 1. Regular Maintenance
```bash
# Weekly cleanup
./docker-cleanup.sh quick

# Monthly deep cleanup
./docker-cleanup.sh deep

# Update base images
docker-compose pull
docker-compose build --pull
```

### 2. Monitoring
```bash
# Set up health check monitoring
./docker-test.sh health

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### 3. Backup Strategy
```bash
# Backup database regularly
docker-compose exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# Backup environment configuration
cp .env.local .env.local.backup
```

## Getting Help

### Collect System Information
```bash
# Create diagnostic report
echo "=== Docker Version ===" > docker-debug.txt
docker version >> docker-debug.txt
echo "=== Docker Info ===" >> docker-debug.txt
docker info >> docker-debug.txt
echo "=== Container Status ===" >> docker-debug.txt
docker-compose ps >> docker-debug.txt
echo "=== Recent Logs ===" >> docker-debug.txt
docker-compose logs --tail=50 >> docker-debug.txt
```

### Useful Resources
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Emergency Reset
If all else fails, completely reset the Docker environment:
```bash
# WARNING: This removes all containers, networks, and volumes
./docker-cleanup.sh reset

# Or manually:
docker-compose down -v
docker system prune -a --volumes
docker volume prune
docker network prune

# Then rebuild from scratch:
./docker-setup.sh
```