#!/bin/bash

# Docker Environment Configuration Script
# This script helps manage environment variables for different Docker environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${NODE_ENV:-development}
ENV_FILE=".env"
DOCKER_COMPOSE_FILE="docker-compose.yml"

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

# Function to show usage
show_usage() {
    echo "Docker Environment Configuration Script"
    echo ""
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  setup [env]     Setup environment configuration (development|staging|production)"
    echo "  validate        Validate current environment configuration"
    echo "  secrets         Generate secure secrets for production"
    echo "  clean           Clean up environment files"
    echo "  help            Show this help message"
    echo ""
    echo "Options:"
    echo "  -f, --file      Specify custom .env file path"
    echo "  -e, --env       Specify environment (development|staging|production)"
    echo "  -v, --verbose   Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 setup development"
    echo "  $0 setup production"
    echo "  $0 validate"
    echo "  $0 secrets"
}

# Function to setup environment
setup_environment() {
    local env=${1:-$ENVIRONMENT}
    local source_file=".env.${env}"
    
    print_info "Setting up environment: $env"
    
    # Check if source environment file exists
    if [[ ! -f "$source_file" ]]; then
        print_error "Environment file $source_file not found"
        exit 1
    fi
    
    # Copy environment-specific file to .env
    cp "$source_file" "$ENV_FILE"
    print_success "Copied $source_file to $ENV_FILE"
    
    # Set appropriate Docker Compose file
    case $env in
        "production")
            DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        "staging")
            DOCKER_COMPOSE_FILE="docker-compose.staging.yml"
            ;;
        *)
            DOCKER_COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    print_info "Using Docker Compose file: $DOCKER_COMPOSE_FILE"
    
    # Validate the configuration
    validate_environment
}

# Function to validate environment configuration
validate_environment() {
    print_info "Validating environment configuration..."
    
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error ".env file not found. Run 'setup' command first."
        exit 1
    fi
    
    # Required variables
    local required_vars=("NODE_ENV" "PORT" "MONGODB_URI")
    local missing_vars=()
    
    # Check required variables
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    # Check for insecure secrets in production
    if grep -q "^NODE_ENV=production" "$ENV_FILE"; then
        print_info "Validating production secrets..."
        
        local insecure_patterns=("dev-" "test-" "change-this" "your-" "example")
        local insecure_found=false
        
        for pattern in "${insecure_patterns[@]}"; do
            if grep -q "$pattern" "$ENV_FILE"; then
                print_warning "Found potentially insecure value containing '$pattern'"
                insecure_found=true
            fi
        done
        
        if [[ "$insecure_found" == true ]]; then
            print_error "Insecure configuration detected for production environment"
            print_info "Run '$0 secrets' to generate secure secrets"
            exit 1
        fi
    fi
    
    print_success "Environment configuration is valid"
}

# Function to generate secure secrets
generate_secrets() {
    print_info "Generating secure secrets..."
    
    # Generate random secrets
    local session_secret=$(openssl rand -hex 32)
    local jwt_secret=$(openssl rand -hex 32)
    
    print_success "Generated secure secrets:"
    echo ""
    echo "Add these to your environment variables or .env.local file:"
    echo ""
    echo "SESSION_SECRET=$session_secret"
    echo "JWT_SECRET=$jwt_secret"
    echo ""
    print_warning "Store these secrets securely and never commit them to version control"
    
    # Optionally create .env.local file
    read -p "Create .env.local file with these secrets? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env.local << EOF
# Local environment overrides (never commit this file)
# Generated on $(date)

SESSION_SECRET=$session_secret
JWT_SECRET=$jwt_secret
EOF
        print_success "Created .env.local with secure secrets"
        print_warning "Added .env.local to .gitignore (if not already present)"
        
        # Add to .gitignore if not present
        if ! grep -q "\.env\.local" .gitignore 2>/dev/null; then
            echo ".env.local" >> .gitignore
        fi
    fi
}

# Function to clean up environment files
clean_environment() {
    print_info "Cleaning up environment files..."
    
    local files_to_clean=(".env" ".env.local")
    
    for file in "${files_to_clean[@]}"; do
        if [[ -f "$file" ]]; then
            read -p "Remove $file? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm "$file"
                print_success "Removed $file"
            fi
        fi
    done
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            ENV_FILE="$2"
            shift 2
            ;;
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        setup)
            COMMAND="setup"
            ENVIRONMENT="${2:-$ENVIRONMENT}"
            shift 2
            ;;
        validate)
            COMMAND="validate"
            shift
            ;;
        secrets)
            COMMAND="secrets"
            shift
            ;;
        clean)
            COMMAND="clean"
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

# Execute command
case ${COMMAND:-help} in
    "setup")
        setup_environment "$ENVIRONMENT"
        ;;
    "validate")
        validate_environment
        ;;
    "secrets")
        generate_secrets
        ;;
    "clean")
        clean_environment
        ;;
    *)
        show_usage
        ;;
esac