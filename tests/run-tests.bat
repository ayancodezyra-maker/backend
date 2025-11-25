@echo off
REM API Test Suite Runner for Windows
REM Usage: tests\run-tests.bat

echo 🧪 BidRoom API Test Suite
echo ==========================
echo.

REM Check if server is running
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Backend server is not running on http://localhost:5000
    echo    Please start the server first: npm run dev
    exit /b 1
)

echo ✅ Backend server is running
echo.

REM Run tests
node tests/api-test-suite.js

exit /b %errorlevel%


