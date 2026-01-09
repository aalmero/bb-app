# Basketball CRUD API & Dashboard

A complete basketball management system with REST API backend and React 19 dashboard frontend.

## Quick Start

### Development with Docker
```bash
# Setup development environment
./docker-env.sh setup development

# Start all services with hot reload
docker-compose up

# Access points:
# - API: http://localhost:3000
# - Dashboard: http://localhost:3001
# - API Docs: http://localhost:3000/api-docs
```

### Production Deployment
```bash
# Setup production environment and generate secure secrets
./docker-env.sh setup production
./docker-env.sh secrets

# Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

This project uses a comprehensive environment configuration system supporting multiple environments with secure secrets management.

### Quick Environment Setup
```bash
# Development
./docker-env.sh setup development

# Staging  
./docker-env.sh setup staging

# Production (with secure secrets)
./docker-env.sh setup production
./docker-env.sh secrets
```

### Environment Files
- `.env.example` - Template with all available variables
- `.env.development` - Development configuration (committed)
- `.env.staging` - Staging configuration (committed)  
- `.env.production` - Production configuration (committed)
- `.env.local` - Local overrides and secrets (never committed)

**📖 For detailed environment configuration, see [ENVIRONMENT.md](./ENVIRONMENT.md)**
**🔧 For Docker troubleshooting, see [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md)**

## Docker Setup

### Initial Setup
```bash
# Complete initial setup (recommended for first time)
./docker-setup.sh

# Or step-by-step setup
./docker-setup.sh check      # Check prerequisites
./docker-setup.sh env        # Setup environment files
./docker-setup.sh build      # Build development images
./docker-setup.sh init       # Initialize database
```

### Development Environment
```bash
# Start all services with hot reload
docker-compose up

# Or use the development helper
./docker-dev.sh start        # Start services
./docker-dev.sh logs         # View logs
./docker-dev.sh status       # Check status
./docker-dev.sh stop         # Stop services

# Access points:
# - API: http://localhost:3000
# - Dashboard: http://localhost:3001
# - MongoDB: localhost:27017
```

### Package Management
```bash
# Install packages in containers
./docker-packages.sh install api express cors
./docker-packages.sh install frontend react@19 --dev
./docker-packages.sh install all lodash

# Update packages
./docker-packages.sh update api
./docker-packages.sh update all

# Other package operations
./docker-packages.sh list all
./docker-packages.sh audit
./docker-packages.sh fix all
./docker-packages.sh clean
```

### Testing
```bash
# Run all tests
./docker-test.sh run

# Run specific test types
./docker-test.sh unit           # Unit tests only
./docker-test.sh integration    # Integration tests only
./docker-test.sh health         # Health checks only
./docker-test.sh api            # API endpoint tests only

# Advanced testing
./docker-test.sh coverage       # Tests with coverage
./docker-test.sh watch          # Tests in watch mode
```

### Cleanup
```bash
# Quick cleanup (safe)
./docker-cleanup.sh quick

# Deep cleanup (removes all unused resources)
./docker-cleanup.sh deep

# Complete environment reset
./docker-cleanup.sh reset

# Specific cleanup
./docker-cleanup.sh logs        # Clean logs only
./docker-cleanup.sh status      # Show resource usage
```

### Production Environment
```bash
# Build production images
./build-prod.sh

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Access points:
# - API: http://localhost:3000
# - Dashboard: http://localhost:80
# - Health checks: /health endpoints
```

### Production Features
- **Multi-stage builds**: Optimized image sizes (API: 226MB, Frontend: 54MB)
- **Alpine Linux**: Lightweight base images for security and performance
- **Health checks**: Built-in health monitoring for all services
- **Security**: Non-root users, proper file permissions
- **Nginx**: Production-ready static file serving with compression
- **Environment variables**: Configurable for different deployment environments

## Backend Setup
```bash
npm install
node seed.js  # Populate database
npm start     # Start API server on port 3000
```

## Frontend Setup
```bash
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19 @vitejs/plugin-react@4 typescript@5 vite@5
npx vite --port 3001  # Start dashboard on port 3001
```

## Features 

### Backend API
- **OpenAPI Documentation**: Available at `http://localhost:3000/api-docs`
- **MongoDB Integration**: Uses `bb-db` database
- **Full CRUD Operations**: Create, Read, Update, Delete for all entities

### Frontend Dashboard
- **React 19**: Latest React with modern patterns
- **TypeScript**: Full type safety
- **Modern UI**: Glassmorphism design with responsive layout
- **State Management**: useReducer + Context API pattern
- **Real-time Data**: Fetches from backend API

## API Endpoints

### Clubs
- `GET /clubs` - Get all clubs
- `POST /clubs` - Create club
- `PUT /clubs/:id` - Update club
- `DELETE /clubs/:id` - Delete club

### Schedules
- `GET /schedules` - Get all schedules
- `POST /schedules` - Create schedule
- `PUT /schedules/:id` - Update schedule
- `DELETE /schedules/:id` - Delete schedule

### Team Stats
- `GET /team_stats` - Get all team stats
- `POST /team_stats` - Create team stat
- `PUT /team_stats/:id` - Update team stat
- `DELETE /team_stats/:id` - Delete team stat

### Player Stats
- `GET /player_stats` - Get all player stats
- `POST /player_stats` - Create player stat
- `PUT /player_stats/:id` - Update player stat
- `DELETE /player_stats/:id` - Delete player stat

## Data Models

**Club**: `{ name, players[], coach }`
**Schedule**: `{ location, date, clubs[], score }`
**TeamStat**: `{ club, wins, losses, points }`
**PlayerStat**: `{ name, team, icon, points, minutes, gamesPlayed, turnovers }`

## Troubleshooting

### Quick Fixes
```bash
# Services won't start
docker-compose down && docker-compose up --force-recreate

# Port conflicts
./docker-cleanup.sh quick

# Database connection issues
docker-compose restart mongodb
docker-compose logs mongodb

# Hot reload not working (Linux/WSL)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Complete environment reset
./docker-cleanup.sh reset
```

**📖 For comprehensive troubleshooting, see [DOCKER-TROUBLESHOOTING.md](./DOCKER-TROUBLESHOOTING.md)**

## Access Points
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs
- **Dashboard**: http://localhost:3001
