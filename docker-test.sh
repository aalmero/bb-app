#!/bin/bash

# Docker Test Script for Basketball CRUD API & Dashboard
# This script provides test execution within Docker containers

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
    print_info "Checking if services are running..."
    
    if ! $COMPOSE_CMD ps | grep -q "Up"; then
        print_warning "Services are not running. Starting them now..."
        $COMPOSE_CMD up -d
        
        # Wait for services to be ready
        print_info "Waiting for services to be ready..."
        sleep 10
        
        # Check API health
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if curl -f http://localhost:3000/health &> /dev/null; then
                print_success "Services are ready"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                print_error "Services failed to start within timeout"
                exit 1
            fi
            
            print_info "Attempt $attempt/$max_attempts - waiting for services..."
            sleep 2
            ((attempt++))
        done
    else
        print_success "Services are already running"
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_info "Running unit tests in API container..."
    
    # Run Jest tests with proper configuration
    $COMPOSE_CMD exec api npm test -- --runInBand --verbose
    
    if [[ $? -eq 0 ]]; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    
    # Run integration tests specifically
    $COMPOSE_CMD exec api npm run test:integration
    
    if [[ $? -eq 0 ]]; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Function to run Docker Compose integration tests
run_docker_integration_tests() {
    print_info "Running Docker Compose integration tests..."
    
    # Run the specific Docker integration test
    $COMPOSE_CMD exec api npx jest test/docker-compose.integration.test.js --runInBand --verbose
    
    if [[ $? -eq 0 ]]; then
        print_success "Docker integration tests passed"
    else
        print_error "Docker integration tests failed"
        return 1
    fi
}

# Function to run health check tests
run_health_tests() {
    print_info "Running health check tests..."
    
    # Test API health endpoint
    if curl -f http://localhost:3000/health &> /dev/null; then
        print_success "API health check passed"
    else
        print_error "API health check failed"
        return 1
    fi
    
    # Test frontend accessibility
    if curl -f http://localhost:3001 &> /dev/null; then
        print_success "Frontend accessibility test passed"
    else
        print_error "Frontend accessibility test failed"
        return 1
    fi
    
    # Test database connectivity
    if $COMPOSE_CMD exec mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        print_success "Database connectivity test passed"
    else
        print_error "Database connectivity test failed"
        return 1
    fi
}

# Function to run API endpoint tests
run_api_tests() {
    print_info "Running API endpoint tests..."
    
    # Test basic CRUD endpoints
    local base_url="http://localhost:3000"
    
    # Test GET /clubs
    if curl -f "$base_url/clubs" &> /dev/null; then
        print_success "GET /clubs endpoint test passed"
    else
        print_error "GET /clubs endpoint test failed"
        return 1
    fi
    
    # Test GET /schedules
    if curl -f "$base_url/schedules" &> /dev/null; then
        print_success "GET /schedules endpoint test passed"
    else
        print_error "GET /schedules endpoint test failed"
        return 1
    fi
    
    # Test GET /team_stats
    if curl -f "$base_url/team_stats" &> /dev/null; then
        print_success "GET /team_stats endpoint test passed"
    else
        print_error "GET /team_stats endpoint test failed"
        return 1
    fi
    
    # Test GET /player_stats
    if curl -f "$base_url/player_stats" &> /dev/null; then
        print_success "GET /player_stats endpoint test passed"
    else
        print_error "GET /player_stats endpoint test failed"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_info "Running basic performance tests..."
    
    # Test API response time
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/clubs)
    local threshold=2.0
    
    if (( $(echo "$response_time < $threshold" | bc -l) )); then
        print_success "API response time test passed (${response_time}s < ${threshold}s)"
    else
        print_warning "API response time test slow (${response_time}s >= ${threshold}s)"
    fi
    
    # Test concurrent requests
    print_info "Testing concurrent API requests..."
    for i in {1..5}; do
        curl -f http://localhost:3000/clubs &> /dev/null &
    done
    wait
    print_success "Concurrent requests test completed"
}

# Function to run all tests
run_all_tests() {
    print_info "Running all tests..."
    
    local failed_tests=()
    
    # Run each test suite and track failures
    if ! run_health_tests; then
        failed_tests+=("health")
    fi
    
    if ! run_api_tests; then
        failed_tests+=("api")
    fi
    
    if ! run_unit_tests; then
        failed_tests+=("unit")
    fi
    
    if ! run_integration_tests; then
        failed_tests+=("integration")
    fi
    
    if ! run_docker_integration_tests; then
        failed_tests+=("docker-integration")
    fi
    
    if ! run_performance_tests; then
        failed_tests+=("performance")
    fi
    
    # Report results
    if [[ ${#failed_tests[@]} -eq 0 ]]; then
        print_success "All tests passed! 🎉"
        return 0
    else
        print_error "Some tests failed: ${failed_tests[*]}"
        return 1
    fi
}

# Function to run tests with coverage
run_tests_with_coverage() {
    print_info "Running tests with coverage..."
    
    $COMPOSE_CMD exec api npm test -- --coverage --runInBand
    
    if [[ $? -eq 0 ]]; then
        print_success "Tests with coverage completed"
        print_info "Coverage report generated in coverage/ directory"
    else
        print_error "Tests with coverage failed"
        return 1
    fi
}

# Function to run tests in watch mode
run_tests_watch() {
    print_info "Running tests in watch mode..."
    print_warning "Press Ctrl+C to exit watch mode"
    
    $COMPOSE_CMD exec api npm test -- --watch --runInBand
}

# Function to clean test artifacts
clean_test_artifacts() {
    print_info "Cleaning test artifacts..."
    
    # Remove coverage directory
    if [[ -d "coverage" ]]; then
        rm -rf coverage
        print_success "Removed coverage directory"
    fi
    
    # Clean Jest cache
    $COMPOSE_CMD exec api npx jest --clearCache
    print_success "Cleared Jest cache"
}

# Function to show test results summary
show_test_summary() {
    echo ""
    print_info "Test Summary:"
    echo "  📊 API: http://localhost:3000"
    echo "  📖 API Docs: http://localhost:3000/api-docs"
    echo "  🎨 Frontend: http://localhost:3001"
    echo ""
    print_info "Available test commands:"
    echo "  ./docker-test.sh run           - Run all tests"
    echo "  ./docker-test.sh unit          - Run unit tests only"
    echo "  ./docker-test.sh integration   - Run integration tests only"
    echo "  ./docker-test.sh health        - Run health checks only"
    echo "  ./docker-test.sh api           - Run API endpoint tests only"
    echo "  ./docker-test.sh coverage      - Run tests with coverage"
    echo "  ./docker-test.sh watch         - Run tests in watch mode"
    echo "  ./docker-test.sh clean         - Clean test artifacts"
}

# Function to show usage
show_usage() {
    echo "Docker Test Script for Basketball CRUD API & Dashboard"
    echo ""
    echo "Usage: $0 [OPTIONS] COMMAND"
    echo ""
    echo "Commands:"
    echo "  run             Run all tests (default)"
    echo "  unit            Run unit tests only"
    echo "  integration     Run integration tests only"
    echo "  docker          Run Docker integration tests only"
    echo "  health          Run health check tests only"
    echo "  api             Run API endpoint tests only"
    echo "  performance     Run performance tests only"
    echo "  coverage        Run tests with coverage report"
    echo "  watch           Run tests in watch mode"
    echo "  clean           Clean test artifacts"
    echo "  summary         Show test summary"
    echo "  help            Show this help message"
    echo ""
    echo "Options:"
    echo "  --no-start      Don't start services if not running"
    echo "  -v, --verbose   Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all tests"
    echo "  $0 unit         # Run unit tests only"
    echo "  $0 coverage     # Run tests with coverage"
    echo "  $0 watch        # Run tests in watch mode"
}

# Parse command line arguments
NO_START=false
COMMAND="run"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-start)
            NO_START=true
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        run|unit|integration|docker|health|api|performance|coverage|watch|clean|summary)
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
print_info "Docker Test Runner for Basketball CRUD API & Dashboard"
echo ""

# Check and start services if needed (unless --no-start is specified)
if [[ "$NO_START" != true ]]; then
    check_services
fi

# Execute command
case $COMMAND in
    "run")
        run_all_tests
        ;;
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "docker")
        run_docker_integration_tests
        ;;
    "health")
        run_health_tests
        ;;
    "api")
        run_api_tests
        ;;
    "performance")
        run_performance_tests
        ;;
    "coverage")
        run_tests_with_coverage
        ;;
    "watch")
        run_tests_watch
        ;;
    "clean")
        clean_test_artifacts
        ;;
    "summary")
        show_test_summary
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac