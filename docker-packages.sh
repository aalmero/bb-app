#!/bin/bash

# Docker Package Management Script for Basketball CRUD API & Dashboard
# This script handles npm package installation and management within Docker containers

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

# Function to check if services are running
check_services() {
    if ! $COMPOSE_CMD ps | grep -q "Up"; then
        print_warning "Services are not running. Starting them now..."
        $COMPOSE_CMD up -d
        sleep 5
    fi
}

# Function to install packages in API container
install_api_packages() {
    local packages="$1"
    local dev_flag="$2"
    
    print_info "Installing packages in API container: $packages"
    
    if [[ "$dev_flag" == "--dev" ]]; then
        $COMPOSE_CMD exec api npm install --save-dev $packages
    else
        $COMPOSE_CMD exec api npm install $packages
    fi
    
    if [[ $? -eq 0 ]]; then
        print_success "Packages installed successfully in API container"
    else
        print_error "Failed to install packages in API container"
        return 1
    fi
}

# Function to install packages in Frontend container
install_frontend_packages() {
    local packages="$1"
    local dev_flag="$2"
    
    print_info "Installing packages in Frontend container: $packages"
    
    if [[ "$dev_flag" == "--dev" ]]; then
        $COMPOSE_CMD exec frontend npm install --save-dev $packages
    else
        $COMPOSE_CMD exec frontend npm install $packages
    fi
    
    if [[ $? -eq 0 ]]; then
        print_success "Packages installed successfully in Frontend container"
    else
        print_error "Failed to install packages in Frontend container"
        return 1
    fi
}

# Function to install packages in both containers
install_all_packages() {
    local packages="$1"
    local dev_flag="$2"
    
    print_info "Installing packages in both containers: $packages"
    
    install_api_packages "$packages" "$dev_flag"
    install_frontend_packages "$packages" "$dev_flag"
}

# Function to update all packages
update_packages() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Updating packages in API container..."
            $COMPOSE_CMD exec api npm update
            ;;
        "frontend")
            print_info "Updating packages in Frontend container..."
            $COMPOSE_CMD exec frontend npm update
            ;;
        "all"|"")
            print_info "Updating packages in all containers..."
            $COMPOSE_CMD exec api npm update
            $COMPOSE_CMD exec frontend npm update
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    print_success "Package updates completed"
}

# Function to audit packages for vulnerabilities
audit_packages() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Auditing packages in API container..."
            $COMPOSE_CMD exec api npm audit
            ;;
        "frontend")
            print_info "Auditing packages in Frontend container..."
            $COMPOSE_CMD exec frontend npm audit
            ;;
        "all"|"")
            print_info "Auditing packages in all containers..."
            echo "=== API Container ==="
            $COMPOSE_CMD exec api npm audit
            echo ""
            echo "=== Frontend Container ==="
            $COMPOSE_CMD exec frontend npm audit
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
}

# Function to fix package vulnerabilities
fix_vulnerabilities() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Fixing vulnerabilities in API container..."
            $COMPOSE_CMD exec api npm audit fix
            ;;
        "frontend")
            print_info "Fixing vulnerabilities in Frontend container..."
            $COMPOSE_CMD exec frontend npm audit fix
            ;;
        "all"|"")
            print_info "Fixing vulnerabilities in all containers..."
            $COMPOSE_CMD exec api npm audit fix
            $COMPOSE_CMD exec frontend npm audit fix
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    print_success "Vulnerability fixes completed"
}

# Function to list installed packages
list_packages() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Listing packages in API container..."
            $COMPOSE_CMD exec api npm list
            ;;
        "frontend")
            print_info "Listing packages in Frontend container..."
            $COMPOSE_CMD exec frontend npm list
            ;;
        "all"|"")
            print_info "Listing packages in all containers..."
            echo "=== API Container ==="
            $COMPOSE_CMD exec api npm list
            echo ""
            echo "=== Frontend Container ==="
            $COMPOSE_CMD exec frontend npm list
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
}

# Function to remove packages
remove_packages() {
    local service="$1"
    local packages="$2"
    
    if [[ -z "$packages" ]]; then
        print_error "No packages specified for removal"
        return 1
    fi
    
    case $service in
        "api")
            print_info "Removing packages from API container: $packages"
            $COMPOSE_CMD exec api npm uninstall $packages
            ;;
        "frontend")
            print_info "Removing packages from Frontend container: $packages"
            $COMPOSE_CMD exec frontend npm uninstall $packages
            ;;
        "all")
            print_info "Removing packages from all containers: $packages"
            $COMPOSE_CMD exec api npm uninstall $packages
            $COMPOSE_CMD exec frontend npm uninstall $packages
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    print_success "Packages removed successfully"
}

# Function to clean npm cache
clean_cache() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Cleaning npm cache in API container..."
            $COMPOSE_CMD exec api npm cache clean --force
            ;;
        "frontend")
            print_info "Cleaning npm cache in Frontend container..."
            $COMPOSE_CMD exec frontend npm cache clean --force
            ;;
        "all"|"")
            print_info "Cleaning npm cache in all containers..."
            $COMPOSE_CMD exec api npm cache clean --force
            $COMPOSE_CMD exec frontend npm cache clean --force
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    print_success "npm cache cleaned"
}

# Function to rebuild node_modules
rebuild_modules() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Rebuilding node_modules in API container..."
            $COMPOSE_CMD exec api rm -rf node_modules package-lock.json
            $COMPOSE_CMD exec api npm install
            ;;
        "frontend")
            print_info "Rebuilding node_modules in Frontend container..."
            $COMPOSE_CMD exec frontend rm -rf node_modules package-lock.json
            $COMPOSE_CMD exec frontend npm install
            ;;
        "all"|"")
            print_info "Rebuilding node_modules in all containers..."
            $COMPOSE_CMD exec api rm -rf node_modules package-lock.json
            $COMPOSE_CMD exec api npm install
            $COMPOSE_CMD exec frontend rm -rf node_modules package-lock.json
            $COMPOSE_CMD exec frontend npm install
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
    
    print_success "node_modules rebuilt successfully"
}

# Function to check package versions
check_versions() {
    local service="$1"
    
    case $service in
        "api")
            print_info "Checking package versions in API container..."
            $COMPOSE_CMD exec api npm outdated
            ;;
        "frontend")
            print_info "Checking package versions in Frontend container..."
            $COMPOSE_CMD exec frontend npm outdated
            ;;
        "all"|"")
            print_info "Checking package versions in all containers..."
            echo "=== API Container ==="
            $COMPOSE_CMD exec api npm outdated || true
            echo ""
            echo "=== Frontend Container ==="
            $COMPOSE_CMD exec frontend npm outdated || true
            ;;
        *)
            print_error "Unknown service: $service"
            return 1
            ;;
    esac
}

# Function to show usage
show_usage() {
    echo "Docker Package Management Script for Basketball CRUD API & Dashboard"
    echo ""
    echo "Usage: $0 COMMAND [SERVICE] [PACKAGES] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  install [service] <packages>    Install packages"
    echo "  update [service]                Update all packages"
    echo "  remove [service] <packages>     Remove packages"
    echo "  list [service]                  List installed packages"
    echo "  audit [service]                 Audit packages for vulnerabilities"
    echo "  fix [service]                   Fix package vulnerabilities"
    echo "  clean [service]                 Clean npm cache"
    echo "  rebuild [service]               Rebuild node_modules"
    echo "  outdated [service]              Check for outdated packages"
    echo "  help                            Show this help message"
    echo ""
    echo "Services:"
    echo "  api         API container only"
    echo "  frontend    Frontend container only"
    echo "  all         Both containers (default)"
    echo ""
    echo "Options:"
    echo "  --dev       Install as development dependency"
    echo ""
    echo "Examples:"
    echo "  $0 install api express cors"
    echo "  $0 install frontend react@19 --dev"
    echo "  $0 install all lodash"
    echo "  $0 update api"
    echo "  $0 remove frontend unused-package"
    echo "  $0 list all"
    echo "  $0 audit"
    echo "  $0 fix all"
    echo "  $0 clean"
    echo "  $0 rebuild api"
    echo "  $0 outdated"
}

# Parse command line arguments
COMMAND=""
SERVICE="all"
PACKAGES=""
DEV_FLAG=""

while [[ $# -gt 0 ]]; do
    case $1 in
        install|update|remove|list|audit|fix|clean|rebuild|outdated)
            COMMAND="$1"
            shift
            ;;
        api|frontend|all)
            SERVICE="$1"
            shift
            ;;
        --dev)
            DEV_FLAG="--dev"
            shift
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        *)
            if [[ -z "$PACKAGES" ]]; then
                PACKAGES="$1"
            else
                PACKAGES="$PACKAGES $1"
            fi
            shift
            ;;
    esac
done

# Validate command
if [[ -z "$COMMAND" ]]; then
    print_error "No command specified"
    show_usage
    exit 1
fi

# Main execution
print_info "Docker Package Manager for Basketball CRUD API & Dashboard"
echo ""

# Check services for commands that need them
case $COMMAND in
    install|update|remove|list|audit|fix|clean|rebuild|outdated)
        check_services
        ;;
esac

# Execute command
case $COMMAND in
    "install")
        if [[ -z "$PACKAGES" ]]; then
            print_error "No packages specified for installation"
            show_usage
            exit 1
        fi
        
        case $SERVICE in
            "api")
                install_api_packages "$PACKAGES" "$DEV_FLAG"
                ;;
            "frontend")
                install_frontend_packages "$PACKAGES" "$DEV_FLAG"
                ;;
            "all")
                install_all_packages "$PACKAGES" "$DEV_FLAG"
                ;;
        esac
        ;;
    "update")
        update_packages "$SERVICE"
        ;;
    "remove")
        remove_packages "$SERVICE" "$PACKAGES"
        ;;
    "list")
        list_packages "$SERVICE"
        ;;
    "audit")
        audit_packages "$SERVICE"
        ;;
    "fix")
        fix_vulnerabilities "$SERVICE"
        ;;
    "clean")
        clean_cache "$SERVICE"
        ;;
    "rebuild")
        rebuild_modules "$SERVICE"
        ;;
    "outdated")
        check_versions "$SERVICE"
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac