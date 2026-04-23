#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; exit 1; }
prompt(){ echo -en "${BOLD}$1${NC}"; }

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Lead OS - Setup Wizard${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# --------------------------------------------------
# Prerequisites
# --------------------------------------------------
info "Checking prerequisites..."

if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js 22+ from https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  fail "Node.js 22+ required (found v$(node -v | sed 's/v//'))"
fi
ok "Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  fail "npm is not installed"
fi
ok "npm $(npm -v)"

# --------------------------------------------------
# Environment file
# --------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f .env ]; then
  warn ".env already exists - skipping copy"
elif [ -f .env.sample ]; then
  cp .env.sample .env
  ok "Copied .env.sample to .env"
else
  touch .env
  ok "Created empty .env"
fi

# --------------------------------------------------
# Prompt for variables
# --------------------------------------------------
echo ""
echo -e "${BOLD}Configure essential environment variables:${NC}"
echo ""

prompt "1/5  LEAD_OS_DATABASE_URL [skip for in-memory mode]: "
read -r DB_URL
if [ -z "$DB_URL" ]; then
  warn "No database URL - app will use in-memory mode"
else
  sed -i '/^LEAD_OS_DATABASE_URL=/d' .env
  echo "LEAD_OS_DATABASE_URL=$DB_URL" >> .env
  ok "Database URL set"
fi

prompt "2/5  LEAD_OS_TENANT_ID [my-tenant]: "
read -r TENANT_ID
TENANT_ID="${TENANT_ID:-my-tenant}"
sed -i '/^LEAD_OS_TENANT_ID=/d' .env
echo "LEAD_OS_TENANT_ID=$TENANT_ID" >> .env
ok "Tenant ID: $TENANT_ID"

prompt "3/5  NEXT_PUBLIC_BRAND_NAME [My Brand]: "
read -r BRAND
BRAND="${BRAND:-My Brand}"
sed -i '/^NEXT_PUBLIC_BRAND_NAME=/d' .env
echo "NEXT_PUBLIC_BRAND_NAME=$BRAND" >> .env
ok "Brand name: $BRAND"

prompt "4/5  NEXT_PUBLIC_SITE_URL [http://localhost:3000]: "
read -r SITE_URL
SITE_URL="${SITE_URL:-http://localhost:3000}"
sed -i '/^NEXT_PUBLIC_SITE_URL=/d' .env
echo "NEXT_PUBLIC_SITE_URL=$SITE_URL" >> .env
ok "Site URL: $SITE_URL"

prompt "5/5  NEXT_PUBLIC_SUPPORT_EMAIL: "
read -r SUPPORT_EMAIL
if [ -n "$SUPPORT_EMAIL" ]; then
  sed -i '/^NEXT_PUBLIC_SUPPORT_EMAIL=/d' .env
  echo "NEXT_PUBLIC_SUPPORT_EMAIL=$SUPPORT_EMAIL" >> .env
  ok "Support email: $SUPPORT_EMAIL"
else
  warn "No support email provided - you can set it later in .env"
fi

# --------------------------------------------------
# Install & Build
# --------------------------------------------------
echo ""
info "Installing dependencies..."
npm install
ok "Dependencies installed"

info "Building application..."
npm run build
ok "Build complete"

# --------------------------------------------------
# Done
# --------------------------------------------------
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BOLD}Start development:${NC}  npm run dev"
echo -e "  ${BOLD}Start production:${NC}   npm run start"
echo -e "  ${BOLD}Run tests:${NC}          npm test"
echo ""
echo -e "  Edit ${CYAN}.env${NC} to update configuration."
echo ""
