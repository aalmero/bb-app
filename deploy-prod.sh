#!/bin/bash

# Production Deployment Script for Basketball CRUD API & Dashboard
# This script handles production deployment with Docker Compose and Docker Swarm

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="basketball-prod"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        log_error "Production compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning "Production environment file not found: $ENV_FILE"
        log_info "Using default environment variables"
    fi
    
    log_success "All requirements satisfied"
}

validate_secrets() {
    log_info "Validating production secrets..."
    
    # Check for placeholder secrets
    if [[ -f "$ENV_FILE" ]]; then
        if grep -q "REPLACE_WITH_SECURE" "$ENV_FILE"; then
            log_error "Production secrets contain placeholder values!"
            log_error "Please update SESSION_SECRET and JWT_SECRET in $ENV_FILE"
            log_error "Or set them as environment variables"
            exit 1
        fi
    fi
    
    # Check environment variables
    if [[ -z "$SESSION_SECRET" && -z "$JWT_SECRET" ]]; then
        log_warning "SESSION_SECRET and JWT_SECRET not set as environment variables"
        log_warning "Make sure they are properly configured in $ENV_FILE"
    fi
    
    log_success "Secret validation completed"
}

show_deployment_info() {
    log_info "Deployment Configuration:"
    echo "  Project Name: $PROJECT_NAME"
    echo "  Compose File: $COMPOSE_FILE"
    echo "  Environment File: $ENV_FILE"
    echo "  API Replicas: ${API_REPLICAS:-2}"
    echo "  Frontend Replicas: ${FRONTEND_REPLICAS:-2}"
    echo "  MongoDB Replicas: ${MONGO_REPLICAS:-1}"
    echo "  API External Port: ${API_EXTERNAL_PORT:-3000}"
    echo "  Frontend External Port: ${FRONTEND_EXTERNAL_PORT:-80}"
}

deploy_compose() {
    log_info "Deploying with Docker Compose..."
    
    # Load environment file if it exists
    ENV_ARGS=""
    if [[ -f "$ENV_FILE" ]]; then
        ENV_ARGS="--env-file $ENV_FILE"
    fi
    
    # Deploy the stack
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" $ENV_ARGS up -d --build --remove-orphans
    
    log_success "Docker Compose deployment completed"
}

deploy_swarm() {
    log_info "Deploying with Docker Swarm..."
    
    # Check if swarm is initialized
    if ! docker info | grep -q "Swarm: active"; then
        log_info "Initializing Docker Swarm..."
        docker swarm init
    fi
    
    # Deploy the stack
    ENV_ARGS=""
    if [[ -f "$ENV_FILE" ]]; then
        ENV_ARGS="--env-file $ENV_FILE"
    fi
    
    docker stack deploy -c "$COMPOSE_FILE" $ENV_ARGS "$PROJECT_NAME"
    
    log_success "Docker Swarm deployment completed"
}

show_status() {
    log_info "Deployment Status:"
    
    if docker info | grep -q "Swarm: active"; then
        echo "Docker Swarm Services:"
        docker stack services "$PROJECT_NAME" 2>/dev/null || log_warning "No swarm services found"
    else
        echo "Docker Compose Services:"
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps 2>/dev/null || log_warning "No compose services found"
    fi
}

cleanup() {
    log_info "Cleaning up old containers and images..."
    
    # Remove unused containers, networks, and images
    docker system prune -f
    
    log_success "Cleanup completed"
}

show_logs() {
    local service="$1"
    if [[ -z "$service" ]]; then
        log_info "Available services: api, frontend, mongo"
        return
    fi
    
    if docker info | grep -q "Swarm: active"; then
        docker service logs "${PROJECT_NAME}_${service}" --follow
    else
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs "$service" --follow
    fi
}

show_help() {
    echo "Basketball CRUD API & Dashboard - Production Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy-compose    Deploy using Docker Compose (default)"
    echo "  deploy-swarm      Deploy using Docker Swarm"
    echo "  status            Show deployment status"
    echo "  logs [service]    Show logs for a service (api, frontend, mongo)"
    echo "  stop              Stop all services"
    echo "  cleanup           Clean up unused Docker resources"
    echo "  validate          Validate configuration and secrets"
    echo "  help              Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  API_REPLICAS              Number of API service replicas (default: 2)"
    echo "  FRONTEND_REPLICAS         Number of frontend service replicas (default: 2)"
    echo "  MONGO_REPLICAS            Number of MongoDB replicas (default: 1)"
    echo "  API_EXTERNAL_PORT         External port for API service (default: 3000)"
    echo "  FRONTEND_EXTERNAL_PORT    External port for frontend service (default: 80)"
    echo "  SESSION_SECRET            Session secret for API"
    echo "  JWT_SECRET                JWT secret for API"
    echo ""
    echo "Examples:"
    echo "  $0 deploy-compose         # Deploy with Docker Compose"
    echo "  $0 deploy-swarm           # Deploy with Docker Swarm"
    echo "  $0 logs api               # Show API service logs"
    echo "  API_REPLICAS=3 $0 deploy-compose  # Deploy with 3 API replicas"
}

# Main script logic
case "${1:-deploy-compose}" in
    "deploy-compose")
        check_requirements
        validate_secrets
        show_deployment_info
        deploy_compose
        show_status
        ;;
    "deploy-swarm")
        check_requirements
        validate_secrets
        show_deployment_info
        deploy_swarm
        show_status
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$2"
        ;;
    "stop")
        log_info "Stopping services..."
        if docker info | grep -q "Swarm: active"; then
            docker stack rm "$PROJECT_NAME"
        else
            docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
        fi
        log_success "Services stopped"
        ;;
    "cleanup")
        cleanup
        ;;
    "validate")
        check_requirements
        validate_secrets
        log_success "Configuration validation completed"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac