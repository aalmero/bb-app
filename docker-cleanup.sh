#!/bin/bash

# Docker Cleanup Script for Basketball CRUD API & Dashboard
# This script provides comprehensive cleanup of Docker resources

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

# Detect Docker Compose command
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Function to show current Docker resource usage
show_docker_usage() {
    print_info "Current Docker resource usage:"
    echo ""
    
    # Show disk usage
    docker system df
    echo ""
    
    # Show running containers
    print_info "Running containers:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    # Show all containers
    print_info "All containers:"
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    echo ""
    
    # Show images
    print_info "Docker images:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    
    # Show volumes
    print_info "Docker volumes:"
    docker volume ls
    echo ""
    
    # Show networks
    print_info "Docker networks:"
    docker network ls
}

# Function to stop all project services
stop_services() {
    print_info "Stopping all project services..."
    
    # Stop development services
    if [[ -f "docker-compose.yml" ]]; then
        $COMPOSE_CMD -f docker-compose.yml down
        print_success "Development services stopped"
    fi
    
    # Stop production services
    if [[ -f "docker-compose.prod.yml" ]]; then
        $COMPOSE_CMD -f docker-compose.prod.yml down
        print_success "Production services stopped"
    fi
    
    # Stop staging services
    if [[ -f "docker-compose.staging.yml" ]]; then
        $COMPOSE_CMD -f docker-compose.staging.yml down
        print_success "Staging services stopped"
    fi
}

# Function to remove project containers
remove_containers() {
    print_info "Removing project containers..."
    
    # Remove containers by name pattern
    local containers=$(docker ps -a --filter "name=bb-" --format "{{.Names}}" 2>/dev/null || true)
    
    if [[ -n "$containers" ]]; then
        echo "$containers" | xargs docker rm -f
        print_success "Project containers removed"
    else
        print_info "No project containers found"
    fi
    
    # Also remove containers by image pattern
    local image_containers=$(docker ps -a --filter "ancestor=basketball-" --format "{{.Names}}" 2>/dev/null || true)
    
    if [[ -n "$image_containers" ]]; then
        echo "$image_containers" | xargs docker rm -f
        print_success "Image-based containers removed"
    fi
}

# Function to remove project images
remove_images() {
    print_info "Removing project images..."
    
    # Remove development images
    local dev_images=$(docker images --filter "reference=basketball-*-dev" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
    if [[ -n "$dev_images" ]]; then
        echo "$dev_images" | xargs docker rmi -f
        print_success "Development images removed"
    fi
    
    # Remove production images
    local prod_images=$(docker images --filter "reference=basketball-*-prod" --format "{{.Repository}}:{{.Tag}}" 2>/dev/null || true)
    if [[ -n "$prod_images" ]]; then
        echo "$prod_images" | xargs docker rmi -f
        print_success "Production images removed"
    fi
    
    # Remove dangling images
    local dangling_images=$(docker images -f "dangling=true" -q 2>/dev/null || true)
    if [[ -n "$dangling_images" ]]; then
        echo "$dangling_images" | xargs docker rmi -f
        print_success "Dangling images removed"
    fi
}

# Function to remove project volumes
remove_volumes() {
    print_info "Removing project volumes..."
    
    # Remove named volumes
    local volumes=$(docker volume ls --filter "name=bb" --format "{{.Name}}" 2>/dev/null || true)
    
    if [[ -n "$volumes" ]]; then
        echo "$volumes" | xargs docker volume rm -f
        print_success "Project volumes removed"
    else
        print_info "No project volumes found"
    fi
    
    # Remove dangling volumes
    local dangling_volumes=$(docker volume ls -f "dangling=true" -q 2>/dev/null || true)
    if [[ -n "$dangling_volumes" ]]; then
        echo "$dangling_volumes" | xargs docker volume rm -f
        print_success "Dangling volumes removed"
    fi
}

# Function to remove project networks
remove_networks() {
    print_info "Removing project networks..."
    
    # Remove project-specific networks
    local networks=$(docker network ls --filter "name=bb" --format "{{.Name}}" 2>/dev/null || true)
    
    if [[ -n "$networks" ]]; then
        echo "$networks" | xargs docker network rm
        print_success "Project networks removed"
    else
        print_info "No project networks found"
    fi
}

# Function to clean Docker system
clean_docker_system() {
    print_info "Cleaning Docker system..."
    
    # Remove unused containers, networks, images, and build cache
    docker system prune -f
    print_success "Docker system cleaned"
    
    # Remove unused volumes
    docker volume prune -f
    print_success "Unused volumes removed"
    
    # Remove unused images
    docker image prune -a -f
    print_success "Unused images removed"
    
    # Remove build cache
    docker builder prune -f
    print_success "Build cache cleaned"
}

# Function to clean logs
clean_logs() {
    print_info "Cleaning container logs..."
    
    # Clean logs for all containers
    local containers=$(docker ps -a --format "{{.Names}}" 2>/dev/null || true)
    
    if [[ -n "$containers" ]]; then
        for container in $containers; do
            if docker inspect "$container" &>/dev/null; then
                docker logs "$container" --tail 0 &>/dev/null || true
                print_info "Cleaned logs for $container"
            fi
        done
        print_success "Container logs cleaned"
    fi
    
    # Clean local log files if they exist
    if [[ -d "logs" ]]; then
        rm -rf logs/*
        print_success "Local log files cleaned"
    fi
}

# Function to reset development environment
reset_dev_environment() {
    print_warning "This will completely reset your development environment!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Reset cancelled"
        return 0
    fi
    
    print_info "Resetting development environment..."
    
    # Stop all services
    stop_services
    
    # Remove everything
    remove_containers
    remove_images
    remove_volumes
    remove_networks
    
    # Clean system
    clean_docker_system
    clean_logs
    
    print_success "Development environment reset complete"
    print_info "Run './docker-setup.sh' to set up the environment again"
}

# Function to quick cleanup (safe cleanup)
quick_cleanup() {
    print_info "Performing quick cleanup..."
    
    # Stop services
    stop_services
    
    # Remove only stopped containers
    docker container prune -f
    
    # Remove dangling images
    docker image prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Clean build cache
    docker builder prune -f
    
    print_success "Quick cleanup completed"
}

# Function to deep cleanup (aggressive cleanup)
deep_cleanup() {
    print_warning "This will remove all unused Docker resources!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Deep cleanup cancelled"
        return 0
    fi
    
    print_info "Performing deep cleanup..."
    
    # Stop services
    stop_services
    
    # Remove all unused resources
    docker system prune -a -f --volumes
    
    print_success "Deep cleanup completed"
}

# Function to show cleanup summary
show_cleanup_summary() {
    echo ""
    print_success "Cleanup Summary:"
    echo ""
    
    # Show updated resource usage
    docker system df
    echo ""
    
    print_info "Available cleanup commands:"
    echo "  ./docker-cleanup.sh quick     - Safe cleanup of unused resources"
    echo "  ./docker-cleanup.sh deep      - Aggressive cleanup of all unused resources"
    echo "  ./docker-cleanup.sh reset     - Complete environment reset"
    echo "  ./docker-cleanup.sh logs      - Clean container logs"
    echo "  ./docker-cleanup.sh status    - Show current resource usage"
}

# Function to show usage
show_usage() {
    echo "Docker Cleanup Script for Basketball CRUD API & Dashboard"
    echo ""
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  quick       Quick cleanup (safe - removes unused resources)"
    echo "  deep        Deep cleanup (aggressive - removes all unused resources)"
    echo "  reset       Reset development environment (removes everything)"
    echo "  stop        Stop all project services"
    echo "  containers  Remove project containers only"
    echo "  images      Remove project images only"
    echo "  volumes     Remove project volumes only"
    echo "  networks    Remove project networks only"
    echo "  logs        Clean container logs"
    echo "  system      Clean Docker system resources"
    echo "  status      Show current Docker resource usage"
    echo "  summary     Show cleanup summary"
    echo "  help        Show this help message"
    echo ""
    echo "Options:"
    echo "  -f, --force    Skip confirmation prompts"
    echo "  -v, --verbose  Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 quick       # Safe cleanup"
    echo "  $0 deep        # Aggressive cleanup"
    echo "  $0 reset       # Complete reset"
    echo "  $0 status      # Show resource usage"
    echo "  $0 logs        # Clean logs only"
}

# Parse command line arguments
FORCE=false
COMMAND="quick"

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            FORCE=true
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        quick|deep|reset|stop|containers|images|volumes|networks|logs|system|status|summary)
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
print_info "Docker Cleanup for Basketball CRUD API & Dashboard"
echo ""

# Execute command
case $COMMAND in
    "quick")
        quick_cleanup
        show_cleanup_summary
        ;;
    "deep")
        deep_cleanup
        show_cleanup_summary
        ;;
    "reset")
        reset_dev_environment
        ;;
    "stop")
        stop_services
        ;;
    "containers")
        stop_services
        remove_containers
        ;;
    "images")
        remove_images
        ;;
    "volumes")
        remove_volumes
        ;;
    "networks")
        remove_networks
        ;;
    "logs")
        clean_logs
        ;;
    "system")
        clean_docker_system
        ;;
    "status")
        show_docker_usage
        ;;
    "summary")
        show_cleanup_summary
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac