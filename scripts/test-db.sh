#!/bin/bash

# Test Database Management Script

set -e

case "$1" in
  "start")
    echo "🚀 Starting test database..."
    cd database
    docker-compose -f docker-compose.test.yml up -d postgres-test
    echo "⏳ Waiting for database to be ready..."
    
    # Wait for database to be ready
    timeout=60
    while ! docker exec happy-robot-postgres-test pg_isready -U happyrobot_test -d happyrobot_test > /dev/null 2>&1; do
      timeout=$((timeout - 1))
      if [ $timeout -eq 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        exit 1
      fi
      echo "⏳ Waiting for database... ($timeout seconds remaining)"
      sleep 1
    done
    
    echo "✅ Test database is ready!"
    echo "📊 Database URL: postgresql://happyrobot_test:happyrobot_test123@localhost:5433/happyrobot_test"
    ;;
    
  "stop")
    echo "🛑 Stopping test database..."
    cd database
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Test database stopped and cleaned up"
    ;;
    
  "reset")
    echo "🔄 Resetting test database..."
    cd database
    docker-compose -f docker-compose.test.yml down -v
    docker-compose -f docker-compose.test.yml up -d postgres-test
    
    # Wait for database to be ready
    timeout=60
    while ! docker exec happy-robot-postgres-test pg_isready -U happyrobot_test -d happyrobot_test > /dev/null 2>&1; do
      timeout=$((timeout - 1))
      if [ $timeout -eq 0 ]; then
        echo "❌ Database failed to start within 60 seconds"
        exit 1
      fi
      echo "⏳ Waiting for database... ($timeout seconds remaining)"
      sleep 1
    done
    
    echo "✅ Test database reset and ready!"
    ;;
    
  "status")
    echo "📊 Test database status:"
    cd database
    docker-compose -f docker-compose.test.yml ps
    ;;
    
  *)
    echo "Usage: $0 {start|stop|reset|status}"
    echo ""
    echo "Commands:"
    echo "  start  - Start the test database"
    echo "  stop   - Stop and clean up the test database"
    echo "  reset  - Reset the test database (stop, clean, start)"
    echo "  status - Show test database status"
    exit 1
    ;;
esac
