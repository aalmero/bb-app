#!/bin/bash

# Docker Development Helper Script
# This script provides common Docker commands for development

set -e

case "$1" in
  "start")
    echo "🚀 Starting development environment..."
    docker-compose up -d
    echo "✅ Services started!"
    echo "📊 API: http://localhost:3000"
    echo "📊 API Docs: http://localhost:3000/api-docs"
    echo "🎨 Frontend: http://localhost:3001"
    echo "🗄️  MongoDB: localhost:27017"
    ;;
  "stop")
    echo "🛑 Stopping development environment..."
    docker-compose down
    echo "✅ Services stopped!"
    ;;
  "restart")
    echo "🔄 Restarting development environment..."
    docker-compose down
    docker-compose up -d
    echo "✅ Services restarted!"
    ;;
  "logs")
    if [ -z "$2" ]; then
      echo "📋 Showing logs for all services..."
      docker-compose logs -f
    else
      echo "📋 Showing logs for $2..."
      docker-compose logs -f "$2"
    fi
    ;;
  "status")
    echo "📊 Service status:"
    docker-compose ps
    ;;
  "clean")
    echo "🧹 Cleaning up Docker resources..."
    ./docker-cleanup.sh quick
    echo "✅ Cleanup complete!"
    ;;
  "rebuild")
    echo "🔨 Rebuilding containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ Containers rebuilt and started!"
    ;;
  "install")
    if [ -z "$2" ]; then
      echo "📦 Installing dependencies in both containers..."
      ./docker-packages.sh install all
    else
      echo "📦 Installing dependencies in $2 container..."
      ./docker-packages.sh install "$2"
    fi
    echo "✅ Dependencies installed!"
    ;;
  "seed")
    echo "🌱 Seeding database..."
    docker-compose exec api npm run seed
    echo "✅ Database seeded!"
    ;;
  "shell")
    if [ -z "$2" ]; then
      echo "🐚 Opening shell in API container..."
      docker-compose exec api sh
    else
      echo "🐚 Opening shell in $2 container..."
      docker-compose exec "$2" sh
    fi
    ;;
  "test")
    echo "🧪 Running tests..."
    ./docker-test.sh run
    ;;
  "setup")
    echo "⚙️  Running initial setup..."
    ./docker-setup.sh
    ;;
  "packages")
    echo "📦 Opening package manager..."
    ./docker-packages.sh "${@:2}"
    ;;
  "cleanup")
    echo "🧹 Opening cleanup menu..."
    ./docker-cleanup.sh "${@:2}"
    ;;
  *)
    echo "🐳 Docker Development Helper"
    echo ""
    echo "Usage: $0 {start|stop|restart|logs|status|clean|rebuild|install|seed|shell|test|setup|packages|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show logs (optionally specify service name)"
    echo "  status   - Show service status"
    echo "  clean    - Clean up containers, volumes, and images"
    echo "  rebuild  - Rebuild containers from scratch"
    echo "  install  - Install npm dependencies (optionally specify service)"
    echo "  seed     - Seed the database with sample data"
    echo "  shell    - Open shell in container (default: api)"
    echo "  test     - Run tests in containers"
    echo "  setup    - Run initial Docker environment setup"
    echo "  packages - Manage npm packages in containers"
    echo "  cleanup  - Advanced cleanup options"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs api"
    echo "  $0 install frontend"
    echo "  $0 shell frontend"
    echo "  $0 test"
    echo "  $0 packages install api express"
    echo "  $0 cleanup deep"
    ;;
esac