#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

echo "========================================="
echo "  K12 Platform CI Check"
echo "========================================="
echo ""

# TypeScript type check for each package
for pkg in web desktop mobile server; do
  if [ -f "packages/$pkg/tsconfig.json" ]; then
    echo -n "Type checking @k12/$pkg ... "
    if (cd "packages/$pkg" && npx tsc --noEmit) 2>&1; then
      echo -e "${GREEN}PASS${NC}"
      PASS=$((PASS + 1))
    else
      echo -e "${RED}FAIL${NC}"
      FAIL=$((FAIL + 1))
    fi
  else
    echo "Skipping @k12/$pkg (no tsconfig.json)"
  fi
done

echo ""

# ESLint check
echo -n "Running ESLint ... "
if npx eslint packages/*/src --ext .ts,.tsx 2>&1; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS + 1))
else
  echo -e "${RED}FAIL${NC}"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "========================================="
echo -e "  Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi