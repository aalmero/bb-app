# Environment Configuration Guide

This document explains how to configure and manage environment variables for the Basketball CRUD API & Dashboard project across different environments.

## Overview

The project uses a comprehensive environment configuration system that supports:

- **Multiple environments**: development, staging, production
- **Environment-specific configuration files**
- **Secure secrets management**
- **Docker integration**
- **Environment variable validation**

## Environment Files

### File Structure

```
.env.example          # Template with all available variables
.env.development      # Development-specific configuration (committed)
.env.staging          # Staging-specific configuration (committed)
.env.production       # Production-specific configuration (committed)
.env                  # Active environment file (not committed)
.env.local            # Local overrides (not committed)
```

### File Precedence

Environment variables are loaded in the following order (highest to lowest priority):

1. **Process environment variables** (highest priority)
2. **`.env.local`** - Local overrides (never committed)
3. **`.env.[environment]`** - Environment-specific files
4. **`.env`** - Default fallback
5. **Application defaults** (lowest priority)

## Quick Start

### 1. Setup Development Environment

```bash
# Copy development configuration
cp .env.development .env

# Or use the environment script
./docker-env.sh setup development
```

### 2. Generate Secure Secrets (Production)

```bash
# Generate secure secrets for production
./docker-env.sh secrets

# This creates .env.local with secure random secrets
```

### 3. Validate Configuration

```bash
# Validate current environment configuration
./docker-env.sh validate
```

## Environment Variables Reference

### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Application environment | `development` | Yes |
| `PORT` | API server port | `3000` | Yes |
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/bb-db` | Yes |

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_NAME` | Database name | `bb-db` |
| `DB_MAX_POOL_SIZE` | Connection pool size | `10` |
| `DB_SERVER_SELECTION_TIMEOUT` | Server selection timeout (ms) | `5000` |
| `DB_SOCKET_TIMEOUT` | Socket timeout (ms) | `45000` |

### Frontend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | Frontend server port | `3001` |
| `VITE_API_URL` | API URL for frontend | `http://localhost:3000` |
| `CHOKIDAR_USEPOLLING` | Enable file watching polling | `true` |

### Security Configuration

| Variable | Description | Default | Secret |
|----------|-------------|---------|--------|
| `SESSION_SECRET` | Session encryption key | - | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3001` | No |
| `RATE_LIMIT_REQUESTS` | Rate limit per window | `100` | No |

### Logging Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `ENABLE_REQUEST_LOGGING` | Enable request logging | `true` |
| `LOG_MAX_SIZE` | Log file max size | `10m` |
| `LOG_MAX_FILES` | Max log files to keep | `3` |

### Health Check Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `HEALTH_CHECK_INTERVAL` | Health check interval (s) | `15` |
| `HEALTH_CHECK_TIMEOUT` | Health check timeout (s) | `10` |
| `HEALTH_CHECK_RETRIES` | Health check retries | `3` |
| `HEALTH_CHECK_START_PERIOD` | Health check start period (s) | `30` |

## Environment-Specific Configurations

### Development Environment

```bash
# Setup development environment
./docker-env.sh setup development

# Start development stack
docker-compose up
```

**Characteristics:**
- Debug logging enabled
- Auto-seeding enabled
- Hot reload enabled
- Relaxed security settings
- Local database

### Staging Environment

```bash
# Setup staging environment
./docker-env.sh setup staging

# Start staging stack
docker-compose -f docker-compose.staging.yml up
```

**Characteristics:**
- Info-level logging
- No auto-seeding
- Production-like configuration
- External database recommended
- Security headers enabled

### Production Environment

```bash
# Setup production environment
./docker-env.sh setup production

# Generate secure secrets
./docker-env.sh secrets

# Start production stack
docker-compose -f docker-compose.prod.yml up
```

**Characteristics:**
- Warning-level logging only
- No debug features
- Secure secrets required
- External managed database
- Full security configuration

## Secrets Management

### Development Secrets

Development uses non-secret placeholder values that are safe to commit:

```bash
SESSION_SECRET=dev-session-secret-not-for-production
JWT_SECRET=dev-jwt-secret-not-for-production
```

### Production Secrets

Production requires secure, randomly generated secrets:

```bash
# Generate secure secrets
./docker-env.sh secrets

# Or manually generate
openssl rand -hex 32  # For SESSION_SECRET
openssl rand -hex 32  # For JWT_SECRET
```

### Secret Storage Options

1. **Environment Variables** (Recommended)
   ```bash
   export SESSION_SECRET="your-secure-secret"
   export JWT_SECRET="your-secure-jwt-secret"
   ```

2. **`.env.local` File** (Local development)
   ```bash
   # .env.local (never committed)
   SESSION_SECRET=your-secure-secret
   JWT_SECRET=your-secure-jwt-secret
   ```

3. **Container Orchestration Secrets**
   - Docker Swarm secrets
   - Kubernetes secrets
   - AWS Secrets Manager
   - Azure Key Vault

## Docker Integration

### Environment Variable Substitution

Docker Compose files use environment variable substitution:

```yaml
environment:
  - NODE_ENV=${NODE_ENV:-development}
  - PORT=${PORT:-3000}
  - MONGODB_URI=${MONGODB_URI}
```

### Container Environment

Containers automatically load environment configuration:

```bash
# Development
docker-compose up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

## Validation and Security

### Automatic Validation

The application validates configuration on startup:

- **Required variables**: Ensures all required variables are present
- **Secret validation**: Checks for insecure secrets in production
- **Type validation**: Validates numeric and boolean values
- **Format validation**: Validates URLs and connection strings

### Security Best Practices

1. **Never commit secrets** to version control
2. **Use secure random secrets** in production (minimum 32 characters)
3. **Rotate secrets regularly**
4. **Use environment-specific configurations**
5. **Validate configuration on startup**
6. **Monitor for configuration drift**

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   # Check current configuration
   ./docker-env.sh validate
   
   # Setup correct environment
   ./docker-env.sh setup development
   ```

2. **Insecure Secrets in Production**
   ```bash
   # Generate secure secrets
   ./docker-env.sh secrets
   
   # Update production configuration
   export SESSION_SECRET="your-new-secure-secret"
   ```

3. **Database Connection Issues**
   ```bash
   # Check MongoDB URI
   echo $MONGODB_URI
   
   # Verify database connectivity
   docker-compose logs mongodb
   ```

### Debug Configuration

Enable debug logging to see configuration details:

```bash
export LOG_LEVEL=debug
docker-compose up
```

## Environment Script Usage

The `docker-env.sh` script provides convenient environment management:

```bash
# Setup environment
./docker-env.sh setup [development|staging|production]

# Validate configuration
./docker-env.sh validate

# Generate secure secrets
./docker-env.sh secrets

# Clean up environment files
./docker-env.sh clean

# Show help
./docker-env.sh help
```

## Migration Guide

### From Hardcoded Values

1. **Identify hardcoded values** in your configuration
2. **Add variables to `.env.example`**
3. **Update application code** to use environment variables
4. **Test with different environments**

### From Simple .env

1. **Create environment-specific files**
2. **Move secrets to `.env.local`**
3. **Update Docker Compose files**
4. **Validate new configuration**

## Best Practices

1. **Use environment-specific files** for different deployment targets
2. **Keep secrets in `.env.local`** or environment variables
3. **Validate configuration** before deployment
4. **Document all variables** in `.env.example`
5. **Use meaningful defaults** where appropriate
6. **Monitor configuration drift** in production
7. **Rotate secrets regularly**
8. **Test configuration changes** in staging first