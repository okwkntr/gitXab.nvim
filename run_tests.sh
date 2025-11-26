#!/bin/bash
# Test runner script for GitXab.vim
# Usage: ./run_tests.sh [mock|unit|integration|gitlab|all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run mock tests (no external dependencies)
run_mock_tests() {
    echo -e "${GREEN}=== Running Mock Tests (No External Dependencies) ===${NC}"
    deno test \
        --allow-env \
        tests/backend_mock_test.ts
}

# Function to run unit tests (no external dependencies)
run_unit_tests() {
    echo -e "${GREEN}=== Running Unit Tests ===${NC}"
    deno test \
        --allow-env \
        --allow-read \
        --allow-write \
        --allow-run \
        tests/unit/
}

# Function to run integration tests (mock Neovim, no real GitLab)
run_integration_tests() {
    echo -e "${GREEN}=== Running Integration Tests ===${NC}"
    deno test \
        --allow-env \
        --allow-read \
        --allow-net \
        --allow-write \
        --no-check \
        tests/integration_test.ts
}

# Function to run GitLab-dependent tests (requires real GitLab instance)
run_gitlab_tests() {
    if [ -z "$GITLAB_TOKEN" ]; then
        echo -e "${YELLOW}Warning: GITLAB_TOKEN not set. GitLab tests may fail.${NC}"
        echo "Set it with: export GITLAB_TOKEN='your-token'"
        echo ""
    fi
    
    echo -e "${GREEN}=== Running GitLab Integration Tests ===${NC}"
    deno test \
        --allow-env \
        --allow-read \
        --allow-net \
        --allow-write \
        tests/backend_test.ts
}

# Main execution
TEST_TYPE="${1:-all}"

case "$TEST_TYPE" in
    mock)
        run_mock_tests
        ;;
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    gitlab)
        run_gitlab_tests
        ;;
    all)
        # Run tests that don't require external GitLab
        run_mock_tests
        echo ""
        run_unit_tests
        echo ""
        run_integration_tests
        ;;
    full)
        # Run ALL tests including GitLab-dependent ones
        run_mock_tests
        echo ""
        run_unit_tests
        echo ""
        run_integration_tests
        echo ""
        run_gitlab_tests
        ;;
    *)
        echo -e "${RED}Error: Invalid test type '$TEST_TYPE'${NC}"
        echo "Usage: $0 [mock|unit|integration|gitlab|all|full]"
        echo ""
        echo "Test types:"
        echo "  mock        - Mock tests (no external dependencies)"
        echo "  unit        - Unit tests (no external dependencies)"
        echo "  integration - Integration tests with mock Neovim"
        echo "  gitlab      - Tests requiring real GitLab instance"
        echo "  all         - Run mock + unit + integration (default, no GitLab required)"
        echo "  full        - Run ALL tests including GitLab-dependent ones"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=== All tests completed! ===${NC}"
