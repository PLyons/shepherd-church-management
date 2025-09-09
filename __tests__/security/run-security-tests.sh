#!/bin/bash

# Firebase Security Rules Test Runner
# Comprehensive script to run security rules validation tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FIRESTORE_PORT=8080
EMULATOR_UI_PORT=4000
TEST_PROJECT_ID="test-project-security-rules"
EMULATOR_PID_FILE="/tmp/firebase-emulator.pid"

echo -e "${BLUE}🔐 Firebase Security Rules Test Runner${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start Firebase emulator
start_emulator() {
    echo -e "${YELLOW}🚀 Starting Firebase Emulator...${NC}"
    
    if check_port $FIRESTORE_PORT; then
        echo -e "${GREEN}✅ Firebase emulator already running on port $FIRESTORE_PORT${NC}"
        return 0
    fi
    
    # Start emulator in background
    firebase emulators:start --only firestore --project=$TEST_PROJECT_ID > /dev/null 2>&1 &
    EMULATOR_PID=$!
    echo $EMULATOR_PID > $EMULATOR_PID_FILE
    
    # Wait for emulator to be ready
    echo -e "${YELLOW}⏳ Waiting for emulator to start...${NC}"
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if check_port $FIRESTORE_PORT; then
            echo -e "${GREEN}✅ Firebase emulator started successfully (PID: $EMULATOR_PID)${NC}"
            return 0
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    echo -e "${RED}❌ Failed to start Firebase emulator after $max_attempts seconds${NC}"
    return 1
}

# Function to stop Firebase emulator
stop_emulator() {
    echo -e "${YELLOW}🛑 Stopping Firebase Emulator...${NC}"
    
    if [ -f $EMULATOR_PID_FILE ]; then
        EMULATOR_PID=$(cat $EMULATOR_PID_FILE)
        if ps -p $EMULATOR_PID > /dev/null 2>&1; then
            kill $EMULATOR_PID
            echo -e "${GREEN}✅ Firebase emulator stopped (PID: $EMULATOR_PID)${NC}"
        fi
        rm -f $EMULATOR_PID_FILE
    fi
    
    # Also kill any processes using the ports
    local pids=$(lsof -ti:$FIRESTORE_PORT 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        echo $pids | xargs kill -9 2>/dev/null || true
    fi
}

# Function to run security tests
run_security_tests() {
    echo -e "${BLUE}🧪 Running Security Rules Tests...${NC}"
    
    # Run the specific security rules test
    if npm run security:rules; then
        echo -e "${GREEN}✅ All security tests passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Some security tests failed${NC}"
        return 1
    fi
}

# Function to validate test environment
validate_environment() {
    echo -e "${BLUE}🔍 Validating Test Environment...${NC}"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
        return 1
    fi
    
    # Check if security rules file exists
    if [ ! -f "firestore.rules" ]; then
        echo -e "${RED}❌ firestore.rules file not found in project root${NC}"
        return 1
    fi
    
    # Check if test file exists
    if [ ! -f "__tests__/security/firestore-security-rules.test.ts" ]; then
        echo -e "${RED}❌ Security rules test file not found${NC}"
        return 1
    fi
    
    # Check if Firebase rules testing package is installed
    if ! npm list @firebase/rules-unit-testing > /dev/null 2>&1; then
        echo -e "${RED}❌ @firebase/rules-unit-testing package not installed${NC}"
        echo -e "${YELLOW}💡 Run: npm install --save-dev @firebase/rules-unit-testing${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Test environment validation passed${NC}"
    return 0
}

# Function to display test summary
display_summary() {
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo -e "${BLUE}===============${NC}"
    echo -e "Project ID: ${TEST_PROJECT_ID}"
    echo -e "Firestore Port: ${FIRESTORE_PORT}"
    echo -e "Test File: __tests__/security/firestore-security-rules.test.ts"
    echo -e "Rules File: firestore.rules"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    stop_emulator
}

# Set up signal handlers for cleanup
trap cleanup EXIT INT TERM

# Main execution
main() {
    # Parse command line arguments
    SKIP_VALIDATION=false
    KEEP_EMULATOR=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --keep-emulator)
                KEEP_EMULATOR=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-validation    Skip environment validation"
                echo "  --keep-emulator      Keep emulator running after tests"
                echo "  -h, --help           Show this help message"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Unknown option: $1${NC}"
                exit 1
                ;;
        esac
    done
    
    display_summary
    echo ""
    
    # Validate environment unless skipped
    if [ "$SKIP_VALIDATION" = false ]; then
        if ! validate_environment; then
            exit 1
        fi
        echo ""
    fi
    
    # Start emulator
    if ! start_emulator; then
        exit 1
    fi
    echo ""
    
    # Run tests
    local test_result=0
    if ! run_security_tests; then
        test_result=1
    fi
    
    # Keep emulator running if requested
    if [ "$KEEP_EMULATOR" = true ]; then
        echo -e "${YELLOW}🔄 Keeping emulator running as requested${NC}"
        echo -e "${BLUE}💡 Access emulator UI at: http://localhost:${EMULATOR_UI_PORT}${NC}"
        echo -e "${BLUE}💡 To stop emulator manually: firebase emulators:stop${NC}"
        trap - EXIT  # Remove cleanup trap
    fi
    
    # Display final result
    echo ""
    if [ $test_result -eq 0 ]; then
        echo -e "${GREEN}🎉 Security rules validation completed successfully!${NC}"
    else
        echo -e "${RED}💥 Security rules validation failed!${NC}"
    fi
    
    exit $test_result
}

# Run main function with all arguments
main "$@"