# Tech Stack & Build System

## Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Documentation**: Swagger/OpenAPI with swagger-jsdoc and swagger-ui-express
- **CORS**: Enabled for cross-origin requests

## Frontend Stack
- **Framework**: React 19 (latest)
- **Language**: TypeScript 5
- **Build Tool**: Vite 5
- **Bundler**: Vite with React plugin
- **State Management**: useReducer + Context API pattern
- **Styling**: CSS with glassmorphism design

## Development Commands

### Backend
```bash
npm install                 # Install dependencies
node seed.js               # Populate database with sample data
npm start                  # Start production server (port 3000)
npm run dev                # Start development server with nodemon
```

### Frontend
```bash
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19 @vitejs/plugin-react@4 typescript@5 vite@5
npx vite --port 3001       # Start development server (port 3001)
npx vite build             # Build for production
npx vite preview           # Preview production build
```

## Database
- **Connection**: `mongodb://localhost:27017/bb-db`
- **Models**: Club, Schedule, TeamStat, PlayerStat (defined in models.js)
- **ODM**: Mongoose with schema validation

## Docker Commands

### Development Environment
```bash
# Quick start development environment
docker-compose up                    # Start all services with hot reload
docker-compose up -d                 # Start in detached mode
docker-compose down                  # Stop all services
docker-compose down -v               # Stop and remove volumes

# Individual services
docker-compose up api                # Start only API service
docker-compose up frontend           # Start only frontend service
docker-compose up mongodb            # Start only database service

# Logs and monitoring
docker-compose logs                  # View all service logs
docker-compose logs -f api           # Follow API logs
docker-compose logs --tail=50 frontend  # Last 50 frontend log lines

# Service management
docker-compose restart api           # Restart API service
docker-compose exec api bash         # Access API container shell
docker-compose exec mongodb mongosh  # Access MongoDB shell
```

### Production Environment
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d     # Start production stack
docker-compose -f docker-compose.prod.yml down      # Stop production stack
docker-compose -f docker-compose.prod.yml logs      # View production logs

# Build production images
docker build -f Dockerfile.prod.api -t basketball-api:prod .
docker build -f Dockerfile.prod.frontend -t basketball-frontend:prod .

# Health checks
curl http://localhost:3000/health    # API health check
curl http://localhost:80/            # Frontend health check
```

### Helper Scripts
```bash
# Environment setup
./docker-env.sh setup development   # Setup development environment
./docker-env.sh setup production    # Setup production environment
./docker-env.sh secrets             # Generate secure secrets

# Development workflow
./docker-dev.sh start               # Start development services
./docker-dev.sh stop                # Stop development services
./docker-dev.sh logs                # View development logs
./docker-dev.sh status              # Check service status

# Package management
./docker-packages.sh install api express    # Install API packages
./docker-packages.sh install frontend react # Install frontend packages
./docker-packages.sh update all             # Update all packages

# Testing
./docker-test.sh run                # Run all tests
./docker-test.sh integration        # Run integration tests
./docker-test.sh health             # Run health checks

# Cleanup
./docker-cleanup.sh quick           # Quick cleanup
./docker-cleanup.sh deep            # Deep cleanup (removes unused resources)
./docker-cleanup.sh reset           # Complete environment reset
```

### Troubleshooting Commands
```bash
# Check container status
docker ps                           # List running containers
docker ps -a                        # List all containers
docker images                       # List Docker images

# Resource usage
docker system df                    # Show Docker disk usage
docker stats                        # Show container resource usage

# Network debugging
docker network ls                   # List Docker networks
docker network inspect basketball-crud_default  # Inspect network

# Volume management
docker volume ls                    # List Docker volumes
docker volume inspect basketball-crud_mongodb_data  # Inspect volume

# Container debugging
docker logs <container_id>          # View container logs
docker exec -it <container_id> bash # Access container shell
docker inspect <container_id>       # Inspect container configuration
```

## API Documentation
- Auto-generated OpenAPI 3.0 specs
- Available at http://localhost:3000/api-docs
- JSDoc comments in server.js generate the documentation