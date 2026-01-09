#!/bin/bash

# Docker Setup Script for Basketball CRUD API & Dashboard
# This script provides initial setup for Docker development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed and running
check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    print_info "Checking Docker Compose availability..."
    
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        print_success "Using Docker Compose V2"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "Using Docker Compose V1"
    else
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
}

# Function to setup environment files
setup_environment() {
    print_info "Setting up environment configuration..."
    
    # Check if .env.example exists
    if [[ ! -f ".env.example" ]]; then
        print_error ".env.example file not found"
        exit 1
    fi
    
    # Setup development environment if .env doesn't exist
    if [[ ! -f ".env" ]]; then
        print_info "Creating .env file from .env.development..."
        cp .env.development .env
        print_success "Created .env file"
    else
        print_warning ".env file already exists, skipping creation"
    fi
    
    # Validate environment configuration
    ./docker-env.sh validate
}

# Function to create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    
    local dirs=("logs" "data/mongodb")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        fi
    done
}

# Function to pull required Docker images
pull_images() {
    print_info "Pulling required Docker images..."
    
    local images=("mongo:7" "node:18-alpine" "nginx:alpine")
    
    for image in "${images[@]}"; do
        print_info "Pulling $image..."
        docker pull "$image"
    done
    
    print_success "All required images pulled"
}

# Function to build development images
build_dev_images() {
    print_info "Building development Docker images..."
    
    # Build API development image
    if [[ -f "Dockerfile.dev.api" ]]; then
        print_info "Building API development image..."
        docker build -f Dockerfile.dev.api -t basketball-api-dev .
        print_success "API development image built"
    fi
    
    # Build Frontend development image
    if [[ -f "Dockerfile.dev.frontend" ]]; then
        print_info "Building Frontend development image..."
        docker build -f Dockerfile.dev.frontend -t basketball-frontend-dev .
        print_success "Frontend development image built"
    fi
}

# Function to initialize database
init_database() {
    print_info "Initializing database..."
    
    # Start only MongoDB service first
    print_info "Starting MongoDB service..."
    $COMPOSE_CMD up -d mongodb
    
    # Wait for MongoDB to be ready
    print_info "Waiting for MongoDB to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker exec bb-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            print_success "MongoDB is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "MongoDB failed to start within timeout"
            exit 1
        fi
        
        print_info "Attempt $attempt/$max_attempts - waiting for MongoDB..."
        sleep 2
        ((attempt++))
    done
}

# Function to run initial setup
run_initial_setup() {
    print_info "Running initial setup..."
    
    # Start all services
    print_info "Starting all services..."
    $COMPOSE_CMD up -d
    
    # Wait for API service to be ready
    print_info "Waiting for API service to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:3000/health &> /dev/null; then
            print_success "API service is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "API service failed to start within timeout"
            exit 1
        fi
        
        print_info "Attempt $attempt/$max_attempts - waiting for API service..."
        sleep 3
        ((attempt++))
    done
    
    # Seed database
    print_info "Seeding database with sample data..."
    $COMPOSE_CMD exec api npm run docker-seed
    print_success "Database seeded successfully"
}

# Function to verify setup
verify_setup() {
    print_info "Verifying setup..."
    
    # Check service status
    print_info "Checking service status..."
    $COMPOSE_CMD ps
    
    # Test API endpoints
    print_info "Testing API endpoints..."
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        exit 1
    fi
    
    # Test frontend
    print_info "Testing frontend..."
    if curl -f http://localhost:3001 &> /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
        exit 1
    fi
    
    print_success "Setup verification completed successfully"
}

# Function to show final instructions
show_final_instructions() {
    echo ""
    print_success "🎉 Docker development environment setup completed!"
    echo ""
    echo "Access points:"
    echo "  📊 API: http://localhost:3000"
    echo "  📖 API Docs: http://localhost:3000/api-docs"
    echo "  🎨 Frontend: http://localhost:3001"
    echo "  🗄️  MongoDB: localhost:27017"
    echo ""
    echo "Useful commands:"
    echo "  ./docker-dev.sh logs     - View logs"
    echo "  ./docker-dev.sh status   - Check service status"
    echo "  ./docker-dev.sh stop     - Stop all services"
    echo "  ./docker-dev.sh restart  - Restart all services"
    echo "  ./docker-test.sh run     - Run tests in containers"
    echo ""
    print_info "For more commands, run: ./docker-dev.sh"
}

# Function to show usage
show_usage() {
    echo "Docker Setup Script for Basketball CRUD API & Dashboard"
    echo ""
    echo "Usage: $0 [OPTIONS] [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  full        Run complete setup (default)"
    echo "  check       Check prerequisites only"
    echo "  env         Setup environment files only"
    echo "  build       Build development images only"
    echo "  init        Initialize database only"
    echo "  verify      Verify existing setup"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  --skip-pull    Skip pulling Docker images"
    echo "  --skip-build   Skip building development images"
    echo "  --skip-seed    Skip database seeding"
    echo "  -v, --verbose  Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0              # Full setup"
    echo "  $0 check        # Check prerequisites"
    echo "  $0 build        # Build images only"
    echo "  $0 --skip-pull  # Setup without pulling images"
}

# Parse command line arguments
SKIP_PULL=false
SKIP_BUILD=false
SKIP_SEED=false
COMMAND="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-pull)
            SKIP_PULL=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        check|env|build|init|verify|full)
            COMMAND="$1"
            shift
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
print_info "Starting Docker setup for Basketball CRUD API & Dashboard"
echo ""

case $COMMAND in
    "check")
        check_docker
        check_docker_compose
        print_success "Prerequisites check completed"
        ;;
    "env")
        setup_environment
        ;;
    "build")
        check_docker
        check_docker_compose
        if [[ "$SKIP_PULL" != true ]]; then
            pull_images
        fi
        build_dev_images
        ;;
    "init")
        check_docker
        check_docker_compose
        setup_environment
        init_database
        ;;
    "verify")
        verify_setup
        ;;
    "full")
        check_docker
        check_docker_compose
        setup_environment
        create_directories
        if [[ "$SKIP_PULL" != true ]]; then
            pull_images
        fi
        if [[ "$SKIP_BUILD" != true ]]; then
            build_dev_images
        fi
        init_database
        if [[ "$SKIP_SEED" != true ]]; then
            run_initial_setup
        fi
        verify_setup
        show_final_instructions
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac