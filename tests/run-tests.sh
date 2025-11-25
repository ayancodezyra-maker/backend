#!/bin/bash

# API Test Suite Runner
# Usage: ./tests/run-tests.sh

echo "🧪 BidRoom API Test Suite"
echo "=========================="
echo ""

# Check if server is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "❌ Error: Backend server is not running on http://localhost:5000"
    echo "   Please start the server first: npm run dev"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Run tests
node tests/api-test-suite.js

exit $?


